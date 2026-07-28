import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { clientIp } from "@/lib/ratelimit";

/**
 * HQ FRAUD SHIELD — real-time abuse/fraud gate for the licensed on-ramps.
 *
 * This is an ABUSE gate, not KYC/AML: it scores each attempt before the
 * provider hand-off (the provider still does the KYC). assessRisk() is pure
 * and deterministic; guardOnramp() mirrors lib/ratelimit.ts's limit() pattern,
 * returning { verdict, blocked } where `blocked` is a ready 403 NextResponse
 * or null.
 *
 * Safety (must-haves):
 *  • LOADIT_FRAUD_BYPASS=1  → total pass-through (kill switch).
 *  • LOADIT_RISK_BLOCK=0    → shadow mode: score + log, block nothing.
 *  • Fails OPEN: any scoring bug returns allow — payments never break.
 *  • Velocity is keyed by a SHA-256 IP hash; the raw IP is never stored.
 *  • Optional HQ advisory (HQ_RISK_URL) can only RAISE suspicion, never block
 *    alone. Non-allow verdicts are logged fire-and-forget to
 *    ANALYTICS_WEBHOOK_URL.
 */

// ---------- config ----------
const EMBARGOED = new Set(["KP", "IR", "SY", "CU"]); // hard block
const HIGH_RISK = new Set(["RU", "BY", "MM", "VE", "AF", "SS", "LY", "YE", "ZW"]); // +35
const STRUCTURING = [1000, 3000, 10000]; // "within $60 under" each → +18
const AUTOMATION_UA =
  /curl|wget|python-requests|python|go-http|okhttp|axios|libwww|httpclient|bot|crawler|spider|headless|puppeteer|playwright|scrapy|java\//i;

const EVM = /^0x[a-fA-F0-9]{40}$/;
const WALLET_FORMATS: Record<string, RegExp> = {
  ETH: EVM,
  USDC: EVM,
  USDT: EVM,
  BNB: EVM,
  BTC: /^(bc1[0-9a-z]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
  SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  XRP: /^r[0-9a-zA-Z]{24,34}$/,
};

const WINDOW_MS = 10 * 60 * 1000; // velocity window
const MAX_ATTEMPTS = 20000; // in-memory ring safety cap
const SCORE_BLOCK = 85;
const SCORE_REVIEW = 55;

export type Decision = "allow" | "review" | "block";

export interface RiskSignals {
  country: string | null;
  asset: string;
  wallet: string;
  amountUsd: number;
  userAgent: string | null;
  payMethod?: string | null;
  ipAttempts: number; // attempts from this IP hash in the window (incl. current)
  walletIpCount: number; // distinct IP hashes this wallet appeared across
  ipAmountTotal: number; // summed amount from this IP hash in the window
}

export interface Verdict {
  decision: Decision;
  score: number;
  hardBlock: boolean;
  reasons: string[];
}

/** Deterministic scoring. Pure — velocity counts arrive via signals. */
export function assessRisk(s: RiskSignals): Verdict {
  const reasons: string[] = [];
  let score = 0;
  let hardBlock = false;

  // Geography
  const cc = (s.country || "").toUpperCase();
  if (cc && EMBARGOED.has(cc)) {
    hardBlock = true;
    reasons.push("geo_embargoed:" + cc);
  } else if (cc && HIGH_RISK.has(cc)) {
    score += 35;
    reasons.push("geo_high_risk:" + cc);
  }

  // Wallet format for the chosen asset
  const fmt = WALLET_FORMATS[(s.asset || "").toUpperCase()];
  if (fmt && !fmt.test((s.wallet || "").trim())) {
    hardBlock = true;
    reasons.push("wallet_malformed:" + (s.asset || "?").toUpperCase());
  }

  // Amount
  const amt = Number.isFinite(s.amountUsd) ? s.amountUsd : 0;
  if (amt >= 25000) {
    score += 30;
    reasons.push("amount_large");
  }
  if (STRUCTURING.some((t) => amt >= t - 60 && amt < t)) {
    score += 18;
    reasons.push("amount_structuring");
  }

  // Client
  const ua = (s.userAgent || "").trim();
  if (!ua) {
    score += 15;
    reasons.push("ua_empty");
  } else if (AUTOMATION_UA.test(ua)) {
    score += 25;
    reasons.push("ua_automation");
  }

  // Velocity
  if (s.ipAttempts >= 15) {
    hardBlock = true;
    reasons.push("velocity_ip_hard");
  } else if (s.ipAttempts >= 8) {
    score += 30;
    reasons.push("velocity_ip");
  }
  if (s.walletIpCount >= 4) {
    score += 25;
    reasons.push("wallet_multi_ip");
  }
  if (s.ipAmountTotal >= 50000) {
    score += 20;
    reasons.push("velocity_amount_pileup");
  }

  const decision: Decision =
    hardBlock || score >= SCORE_BLOCK ? "block" : score >= SCORE_REVIEW ? "review" : "allow";
  return { decision, score, hardBlock, reasons };
}

// ---------- velocity store (in-memory, per warm instance) ----------
interface Attempt {
  t: number;
  ip: string; // SHA-256 hash — never the raw IP
  wallet: string;
  amount: number;
}
let attempts: Attempt[] = [];

function measureVelocity(ipHash: string, wallet: string, amount: number) {
  const now = Date.now();
  attempts = attempts.filter((a) => now - a.t < WINDOW_MS);
  attempts.push({ t: now, ip: ipHash, wallet, amount });
  if (attempts.length > MAX_ATTEMPTS) attempts = attempts.slice(-MAX_ATTEMPTS);

  let ipAttempts = 0;
  let ipAmountTotal = 0;
  const walletIps = new Set<string>();
  for (const a of attempts) {
    if (a.ip === ipHash) {
      ipAttempts++;
      ipAmountTotal += a.amount;
    }
    if (wallet && a.wallet === wallet) walletIps.add(a.ip);
  }
  return { ipAttempts, walletIpCount: walletIps.size, ipAmountTotal };
}

function hashIp(ip: string): string {
  try {
    return crypto.createHash("sha256").update(String(ip)).digest("hex");
  } catch {
    return "na";
  }
}

/** HQ advisory — may only raise suspicion, never blocks alone. Fails silent. */
async function hqAdvisory(payload: Record<string, unknown>): Promise<{ suspicion: number; reason: string } | null> {
  const url = process.env.HQ_RISK_URL;
  if (!url) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1200);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify(payload),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as { suspicion?: number; reason?: string } | null;
    if (!data) return null;
    const suspicion = Math.max(0, Number(data.suspicion) || 0);
    return suspicion > 0 ? { suspicion, reason: String(data.reason || "hq") } : null;
  } catch {
    return null;
  }
}

/** Fire-and-forget audit log. Never throws into the payment path. */
async function logVerdict(payload: Record<string, unknown>): Promise<void> {
  const url = process.env.ANALYTICS_WEBHOOK_URL;
  if (!url) return;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1500);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify(payload),
    }).catch(() => {});
    clearTimeout(timer);
  } catch {
    /* logging never breaks payments */
  }
}

export interface TxInput {
  amountUsd: number;
  asset: string;
  wallet: string;
  payMethod?: string | null;
}

/**
 * Guard an on-ramp route. Mirrors lib/ratelimit.ts's limit(): returns
 * { verdict, blocked } — `blocked` is a ready 403 NextResponse on a block, or
 * null to proceed. Add `risk: verdict.decision` to the route's success JSON.
 */
export async function guardOnramp(
  req: Request,
  tx: TxInput,
  route: string,
  corsHeaders?: Record<string, string>
): Promise<{ verdict: Verdict; blocked: NextResponse | null }> {
  const ALLOW: Verdict = { decision: "allow", score: 0, hardBlock: false, reasons: [] };

  // Kill switch: total pass-through.
  if (process.env.LOADIT_FRAUD_BYPASS === "1") {
    return { verdict: { ...ALLOW, reasons: ["bypass"] }, blocked: null };
  }

  try {
    const shadow = process.env.LOADIT_RISK_BLOCK === "0";
    const rawCountry = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country");
    const userAgent = req.headers.get("user-agent");
    const ipHash = hashIp(clientIp(req));
    const asset = (tx.asset || "").toUpperCase();
    const wallet = (tx.wallet || "").trim();
    const amountUsd = Number(tx.amountUsd) || 0;

    const vel = measureVelocity(ipHash, wallet, amountUsd);
    const signals: RiskSignals = {
      country: rawCountry ? rawCountry.toUpperCase() : null,
      asset,
      wallet,
      amountUsd,
      userAgent,
      payMethod: tx.payMethod ?? null,
      ...vel,
    };

    const verdict = assessRisk(signals);

    // HQ advisory: can raise suspicion (allow → review) but never block alone.
    const hq = await hqAdvisory({
      route,
      country: signals.country,
      asset,
      amountUsd,
      ua: userAgent,
      ipHash,
      ...vel,
    });
    if (hq) {
      verdict.reasons.push("hq_advisory:" + hq.reason);
      verdict.score += hq.suspicion;
      if (verdict.decision === "allow" && verdict.score >= SCORE_REVIEW) verdict.decision = "review";
      // deliberately never escalated to "block" from HQ
    }

    // Fire-and-forget log of non-allow verdicts.
    if (verdict.decision !== "allow") {
      void logVerdict({
        event: "onramp_risk",
        ts: new Date().toISOString(),
        route,
        decision: verdict.decision,
        score: verdict.score,
        reasons: verdict.reasons,
        asset,
        amountUsd,
        wallet,
        country: signals.country,
        ipHash,
        payMethod: signals.payMethod,
        shadow,
      });
    }

    if (verdict.decision === "block" && !shadow) {
      const blocked = NextResponse.json(
        {
          ok: false,
          reason: "risk_blocked",
          decision: "block",
          message:
            "This transaction couldn't be completed. If you believe this is an error, contact support@loadit.net.",
        },
        { status: 403, headers: corsHeaders }
      );
      return { verdict, blocked };
    }

    return { verdict, blocked: null };
  } catch {
    // Fail open: a scoring bug must never break payments.
    return { verdict: { ...ALLOW, reasons: ["error_fail_open"] }, blocked: null };
  }
}
