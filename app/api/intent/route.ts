import { NextResponse } from "next/server";
import {
  ASSETS,
  PAYMENT_METHODS,
  computeRoute,
  formatUSD,
  type Asset,
  type PaymentMethod,
} from "@/lib/aero";
import { getMergedFees } from "@/lib/liveFees";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * AI INTENT ROUTER — natural language → real route.
 *
 * Turns a plain-language money request ("send my mom $200 in Manila the
 * cheapest way") into a structured, validated transaction intent, then runs it
 * through the real AERO engine (with live fees) so every number is grounded,
 * never hallucinated. Uses OpenAI tool-calling when configured; falls back to a
 * deterministic heuristic parser so it always works.
 */

const ASSET_IDS = ASSETS.map((a) => a.id);

interface Intent {
  payment_method: PaymentMethod;
  asset: Asset;
  amount_usd: number;
  destination?: string;
}

const PARSER_SYSTEM =
  "You are AERO's intent parser for the Loadit money rail. Convert the user's " +
  "request into a single structured money-routing intent by calling route_money. " +
  "Infer sensible defaults: if no funding method is stated use Debit Card; if no " +
  "asset is stated use USDC; if no amount is stated use 100. Capture any " +
  "destination (a place, person, or wallet) in `destination`. Never invent fees.";

const TOOL = {
  type: "function" as const,
  function: {
    name: "route_money",
    description: "Route a value transfer across the Loadit rail.",
    parameters: {
      type: "object",
      properties: {
        payment_method: { type: "string", enum: PAYMENT_METHODS, description: "How the user is funding the transfer." },
        asset: { type: "string", enum: ASSET_IDS, description: "The asset the user wants to receive." },
        amount_usd: { type: "number", description: "Amount in USD." },
        destination: { type: "string", description: "Where it's going (place, person, or wallet). Optional." },
      },
      required: ["payment_method", "asset", "amount_usd"],
    },
  },
};

/** Deterministic parser so the feature works with no API key. */
function heuristicParse(text: string): Intent {
  const s = text.toLowerCase();

  // amount: $1,200 / 500 / 2k
  let amount = 100;
  const m = s.match(/\$?\s*([\d,]+(?:\.\d+)?)\s*(k|thousand)?/);
  if (m) {
    amount = parseFloat(m[1].replace(/,/g, ""));
    if (m[2]) amount *= 1000;
  }

  // asset
  let asset: Asset = "USDC";
  if (/\bbtc\b|bitcoin/.test(s)) asset = "BTC";
  else if (/\beth\b|ethereum|ether\b/.test(s)) asset = "ETH";
  else if (/\bsol\b|solana/.test(s)) asset = "SOL";
  else if (/\bxrp\b|ripple/.test(s)) asset = "XRP";
  else if (/usdt|tether/.test(s)) asset = "USDT";
  else if (/usdc|stablecoin|dollar|usd\b/.test(s)) asset = "USDC";

  // funding method
  let method: PaymentMethod = "Debit Card";
  if (/\bcash\b/.test(s)) method = "Cash";
  else if (/credit/.test(s)) method = "Credit Card";
  else if (/\bbank\b|wire|ach|transfer from/.test(s)) method = "Bank Transfer";
  else if (/debit/.test(s)) method = "Debit Card";

  // destination after "to "
  let destination: string | undefined;
  const d = text.match(/\bto\s+([A-Za-z0-9 ,.'-]{2,40})/);
  if (d) destination = d[1].trim().replace(/\s+(the|cheapest|fastest).*$/i, "").trim() || undefined;

  return { payment_method: method, asset, amount_usd: amount, destination };
}

function validate(raw: Partial<Intent>): Intent {
  const fallback = { payment_method: "Debit Card" as PaymentMethod, asset: "USDC" as Asset, amount_usd: 100 };
  const method = PAYMENT_METHODS.includes(raw.payment_method as PaymentMethod)
    ? (raw.payment_method as PaymentMethod)
    : fallback.payment_method;
  const asset = ASSET_IDS.includes(raw.asset as Asset) ? (raw.asset as Asset) : fallback.asset;
  const amount = Number.isFinite(raw.amount_usd) && (raw.amount_usd as number) > 0
    ? Math.min(1_000_000, raw.amount_usd as number)
    : fallback.amount_usd;
  const destination = typeof raw.destination === "string" && raw.destination.trim()
    ? raw.destination.trim().slice(0, 60)
    : undefined;
  return { payment_method: method, asset, amount_usd: amount, destination };
}

async function aiParse(message: string, key: string): Promise<Intent | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: PARSER_SYSTEM },
          { role: "user", content: message },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "route_money" } },
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return null;
    return validate(JSON.parse(args));
  } catch {
    return null;
  }
}

function explain(intent: Intent, r: ReturnType<typeof computeRoute>): string {
  const dest = intent.destination ? ` to ${intent.destination}` : "";
  return (
    `Got it — moving ${formatUSD(intent.amount_usd)} from your ${intent.payment_method.toLowerCase()} ` +
    `into ${intent.asset}${dest}. AERO routes this over ${r.network.name} for about ` +
    `${formatUSD(r.loaditFee)} — versus ~${formatUSD(r.legacyFee)} the old way, ~${r.savingsPct}% cheaper — ` +
    `settling in ${r.eta}. It's non-custodial: Loadit converts and routes, it never holds your funds.`
  );
}

export async function POST(req: Request) {
  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  const message = (body.message || "").trim();
  if (!message) {
    return NextResponse.json({ ok: false, reason: "empty" }, { status: 422 });
  }

  const key = process.env.OPENAI_API_KEY;
  let intent: Intent | null = key ? await aiParse(message, key) : null;
  const aiParsed = Boolean(intent);
  if (!intent) intent = heuristicParse(message);

  const live = await getMergedFees();
  const r = computeRoute({
    paymentMethod: intent.payment_method,
    asset: intent.asset,
    amount: intent.amount_usd,
    wallet: intent.destination || "",
    preferred: "auto",
    feeOverrides: live.fees,
  });

  return NextResponse.json({
    ok: true,
    ai: aiParsed,
    fees_live: live.live,
    intent,
    route: {
      network: r.network.id,
      network_name: r.network.name,
      asset: intent.asset,
      amount_usd: intent.amount_usd,
      payment_method: intent.payment_method,
      loadit_fee_usd: r.loaditFee,
      legacy_fee_usd: r.legacyFee,
      savings_usd: r.savingsAbs,
      savings_pct: r.savingsPct,
      eta: r.eta,
      confidence: r.confidence / 100,
      risk: r.risk,
      path: r.path.map((p) => p.label),
      settlement: "non_custodial",
    },
    explanation: explain(intent, r),
  });
}
