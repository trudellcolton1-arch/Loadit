/**
 * NATURAL-LANGUAGE MONEY INTENT — shared parsing + routing helpers.
 *
 * Turns a plain-language money request ("send my mom $200 in Manila the
 * cheapest way") into a structured, validated transaction intent, then runs it
 * through the real HQ engine so every number is grounded, never
 * hallucinated. Used by both the /api/intent router and the /api/hq assistant.
 * AI parsing uses OpenAI tool-calling when configured; the deterministic
 * heuristic parser keeps everything working without a key.
 */
import {
  ASSETS,
  PAYMENT_METHODS,
  computeRoute,
  formatUSD,
  type Asset,
  type PaymentMethod,
} from "./aero";
import { getMergedFees } from "./liveFees";

export const ASSET_IDS = ASSETS.map((a) => a.id);

export interface Intent {
  payment_method: PaymentMethod;
  asset: Asset;
  amount_usd: number;
  destination?: string;
}

export const PARSER_SYSTEM =
  "You are HQ's intent parser for the Loadit money rail. Convert the user's " +
  "request into a single structured money-routing intent by calling route_money. " +
  "Infer sensible defaults: if no funding method is stated use Debit Card; if no " +
  "asset is stated use USDC; if no amount is stated use 100. Capture any " +
  "destination (a place, person, or wallet) in `destination`. Never invent fees.";

export const ROUTE_TOOL = {
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
export function heuristicParse(text: string): Intent {
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

export function validateIntent(raw: Partial<Intent>): Intent {
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

/**
 * Does this message read like a money-move request (vs a question)?
 * Requires an action verb plus either an amount or a named asset, so
 * "how do fees work?" stays a conversation and "turn $50 into BTC" routes.
 */
export function looksLikeMoneyIntent(text: string): boolean {
  const s = text.toLowerCase();
  const verb = /\b(buy|send|move|turn|convert|transfer|swap|load|deposit|cash out|remit|exchange|get me)\b/.test(s);
  const amount = /\$\s*\d|\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:k|thousand|bucks|dollars|usd)?\b/.test(s);
  const asset = /\b(btc|bitcoin|eth|ethereum|sol|solana|xrp|ripple|usdc|usdt|tether|stablecoin|crypto)\b/.test(s);
  return verb && (amount || asset);
}

export interface RoutedIntent {
  intent: Intent;
  fees_live: boolean;
  result: ReturnType<typeof computeRoute>;
  /** Wire-format route payload shared by /api/intent and /api/hq. */
  route: {
    network: string;
    network_name: string;
    asset: Asset;
    amount_usd: number;
    payment_method: PaymentMethod;
    loadit_fee_usd: number;
    fee_pct: number;
    total_usd: number;
    legacy_fee_usd: number;
    savings_usd: number;
    savings_pct: number;
    eta: string;
    confidence: number;
    risk: { value: number; label: string };
    path: string[];
    settlement: "non_custodial";
  };
}

/** Run a validated intent through the real HQ engine with live fees. */
export async function routeIntent(intent: Intent): Promise<RoutedIntent> {
  const live = await getMergedFees();
  const r = computeRoute({
    paymentMethod: intent.payment_method,
    asset: intent.asset,
    amount: intent.amount_usd,
    wallet: intent.destination || "",
    preferred: "auto",
    feeOverrides: live.fees,
  });
  return {
    intent,
    fees_live: live.live,
    result: r,
    route: {
      network: r.network.id,
      network_name: r.network.name,
      asset: intent.asset,
      amount_usd: intent.amount_usd,
      payment_method: intent.payment_method,
      loadit_fee_usd: r.loaditFee,
      fee_pct: r.feePct,
      total_usd: r.total,
      legacy_fee_usd: r.legacyFee,
      savings_usd: r.savingsAbs,
      savings_pct: r.savingsPct,
      eta: r.eta,
      confidence: r.confidence / 100,
      risk: r.risk,
      path: r.path.map((p) => p.label),
      settlement: "non_custodial",
    },
  };
}

export function explainRoute(intent: Intent, r: ReturnType<typeof computeRoute>): string {
  const dest = intent.destination ? ` to ${intent.destination}` : "";
  const cheaper = r.savingsPct > 0 ? ` — about ${r.savingsPct}% cheaper than the old way` : "";
  return (
    `Got it — moving ${formatUSD(intent.amount_usd)} from your ${intent.payment_method.toLowerCase()} ` +
    `into ${intent.asset}${dest}, settling over ${r.network.name} in ${r.eta}. ` +
    `Loadit's flat 0.75% fee is ${formatUSD(r.loaditFee)}, so you pay ${formatUSD(r.total)} all in${cheaper}. ` +
    `It's non-custodial: Loadit converts and routes, it never holds your funds.`
  );
}

/** OpenAI tool-calling parse; returns null on any failure so callers fall back. */
export async function aiParseIntent(message: string, key: string): Promise<Intent | null> {
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
        tools: [ROUTE_TOOL],
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
    return validateIntent(JSON.parse(args));
  } catch {
    return null;
  }
}
