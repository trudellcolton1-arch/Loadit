import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { screenAddress } from "@/lib/screen";
import { clientIp } from "@/lib/ratelimit";

/**
 * HQ FRAUD SHIELD — risk scoring + guard for the licensed on-ramps.
 *
 * guardOnramp() is dropped into each on-ramp route (stripe / coinbase /
 * moneygram) right before the provider hand-off. It scores the request and,
 * when armed, returns a 403 the route hands straight back; otherwise it returns
 * null and the payment proceeds untouched.
 *
 * Design guarantees:
 *  • HARD-FAILS OPEN. Any exception in the shield returns null (allow) — a bug
 *    in fraud logic must never block a legitimate payment.
 *  • Only HARD signals block (OFAC-embargoed country, malformed wallet,
 *    sanctioned destination address). SOFT signals (large amount, automation
 *    user-agent, high-risk geo) only flag; a single soft signal never blocks,
 *    and HQ's advisory heuristic is advisory-only — it never blocks alone.
 *  • IPs are hashed before they ever leave the process (audit log).
 *
 * Flag-gating / rollout:
 *  • LOADIT_FRAUD_BYPASS=1  → total kill switch: guard is a no-op (rollback).
 *  • LOADIT_RISK_BLOCK=0    → shadow mode: score + log, block nothing. Deploy
 *    here first; remove the var to arm blocking.
 *  • LOADIT_HIGH_RISK_GEO   → optional comma list overriding the soft high-risk
 *    geo watchlist.
 */

const HARD = 100; // any single hard signal crosses the block line
const SOFT = 20; // soft signals accumulate for monitoring but never reach HARD
const LARGE_AMOUNT_USD = 1000; // matches the per-transaction cap; soft flag above it

/** OFAC comprehensively-embargoed jurisdictions — HARD block. */
const EMBARGOED = new Set(["IR", "KP", "SY", "CU"]);

/** Elevated-risk (non-embargoed) jurisdictions — SOFT flag only. */
const HIGH_RISK = new Set(
  (process.env.LOADIT_HIGH_RISK_GEO || "RU,VE,MM,AF,YE")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
);

const AUTOMATION_UA =
  /bot|crawl|spider|curl|wget|python|okhttp|axios|headless|puppeteer|playwright|java\/|go-http|scrapy/i;

const bypassed = () => process.env.LOADIT_FRAUD_BYPASS === "1";
const shadow = () => process.env.LOADIT_RISK_BLOCK === "0";

export interface RiskContext {
  provider: string;
  amountUsd: number;
  asset: string;
  wallet: string;
  country?: string | null;
  userAgent?: string | null;
  ipHash?: string | null;
}

export interface RiskVerdict {
  score: number;
  block: boolean; // would block (before shadow/bypass are applied)
  reasons: string[]; // hard signals that drive a block
  flags: string[]; // soft signals — informational only
}

/** Lenient multi-format address sanity check. Blocks only clearly-garbage input. */
export function looksLikeAnyAddress(w: string): boolean {
  const s = (w || "").trim();
  if (!s) return false;
  return (
    /^0x[a-fA-F0-9]{40}$/.test(s) || // EVM (ETH/BNB/Base/…)
    /^G[A-Z2-7]{55}$/.test(s) || // Stellar
    /^(bc1|tb1)[0-9a-z]{20,80}$/i.test(s) || // bech32 (BTC)
    /^[1-9A-HJ-NP-Za-km-z]{25,44}$/.test(s) // base58 (BTC legacy / SOL / XRP)
  );
}

/**
 * HQ advisory — a heuristic "second opinion". Advisory ONLY: it may add a soft
 * flag, but it is never a hard signal, so it can never block on its own. Wire
 * to the real HQ model later if desired; it must stay advisory.
 */
function hqAdvisory(softCount: number): string | null {
  return softCount >= 2 ? "hq_elevated_pattern" : null;
}

/** Score an on-ramp request. Pure except for the sanctions-oracle lookup. */
export async function scoreOnramp(ctx: RiskContext): Promise<RiskVerdict> {
  const reasons: string[] = [];
  const flags: string[] = [];
  let score = 0;

  const country = (ctx.country || "").toUpperCase();

  // ---- HARD signals (any one blocks when armed) ----
  if (country && EMBARGOED.has(country)) {
    reasons.push("embargoed_country:" + country);
    score += HARD;
  }

  if (!looksLikeAnyAddress(ctx.wallet)) {
    reasons.push("malformed_wallet");
    score += HARD;
  } else {
    // Only spend an oracle call on a well-formed address.
    try {
      const s = await screenAddress(ctx.wallet);
      if (s.sanctioned) {
        reasons.push("sanctioned_wallet");
        score += HARD;
      }
    } catch {
      /* fail-open: a screening outage never blocks a payment */
    }
  }

  // ---- SOFT signals (flag, never block alone) ----
  if (Number.isFinite(ctx.amountUsd) && ctx.amountUsd >= LARGE_AMOUNT_USD) {
    flags.push("large_amount");
    score += SOFT;
  }
  if (ctx.userAgent && AUTOMATION_UA.test(ctx.userAgent)) {
    flags.push("automation_ua");
    score += SOFT;
  }
  if (country && HIGH_RISK.has(country)) {
    flags.push("high_risk_geo:" + country);
    score += SOFT;
  }

  const advisory = hqAdvisory(flags.length);
  if (advisory) flags.push(advisory); // advisory: no weight, never blocks

  // Block is driven strictly by HARD signals, never by soft accumulation.
  return { score, block: reasons.length > 0, reasons, flags };
}

function hashIp(ip: string): string {
  try {
    return crypto.createHash("sha256").update(String(ip)).digest("hex").slice(0, 16);
  } catch {
    return "na";
  }
}

/** Fire-and-forget audit log to the analytics webhook. Never throws upward. */
async function logRisk(ctx: RiskContext, v: RiskVerdict): Promise<void> {
  const url = process.env.ANALYTICS_WEBHOOK_URL;
  if (!url) return;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1500);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        event: "onramp_risk",
        ts: new Date().toISOString(),
        provider: ctx.provider,
        asset: ctx.asset,
        amountUsd: ctx.amountUsd,
        wallet: ctx.wallet,
        country: ctx.country || null,
        ipHash: ctx.ipHash || null,
        score: v.score,
        block: v.block,
        shadow: shadow(),
        reasons: v.reasons,
        flags: v.flags,
      }),
    }).catch(() => {});
    clearTimeout(timer);
  } catch {
    /* logging must never break the payment path */
  }
}

/**
 * Guard an on-ramp route. Returns a 403 NextResponse to hand back on a block,
 * or null to proceed. Pass the route's CORS headers so the block response
 * carries them too.
 */
export async function guardOnramp(
  req: Request,
  params: {
    provider: string;
    amountUsd: number;
    asset: string;
    wallet: string;
    headers?: Record<string, string>;
  }
): Promise<NextResponse | null> {
  if (bypassed()) return null; // kill switch — total no-op

  try {
    const ctx: RiskContext = {
      provider: params.provider,
      amountUsd: Number(params.amountUsd) || 0,
      asset: (params.asset || "").toUpperCase(),
      wallet: (params.wallet || "").trim(),
      country: req.headers.get("x-vercel-ip-country"),
      userAgent: req.headers.get("user-agent"),
      ipHash: hashIp(clientIp(req)),
    };

    const verdict = await scoreOnramp(ctx);
    void logRisk(ctx, verdict); // fire-and-forget

    if (verdict.block && !shadow()) {
      return NextResponse.json(
        {
          ok: false,
          reason: "risk_blocked",
          message:
            "This transaction couldn't be completed. If you believe this is an error, contact support@loadit.net.",
        },
        { status: 403, headers: params.headers }
      );
    }
    return null; // allow: clean, shadow mode, or soft-flag-only
  } catch {
    return null; // HARD fail-open: a bug in the shield never blocks a payment
  }
}
