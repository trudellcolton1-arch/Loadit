import { API_BASE, AERO_API_KEY } from "./config";

export interface Intent {
  payment_method: string;
  asset: string;
  amount_usd: number;
  destination?: string;
}
export interface Route {
  network_name: string;
  loadit_fee_usd: number;
  fee_pct?: number;
  total_usd?: number;
  legacy_fee_usd: number;
  savings_usd: number;
  savings_pct: number;
  eta: string;
}
/** Live provider quote from the HQ (Hylaq) routing service, via the backend. */
export interface HQLiveQuote {
  provider: string;
  rail: string;
  fee_usd: number;
  spread_pct: number;
  eta_minutes: number;
  asset_out: number;
  price_usd: number;
  savings_usd: number;
  mode: string;
}

export interface IntentResult {
  ok: boolean;
  ai: boolean;
  fees_live: boolean;
  intent: Intent;
  route: Route;
  hq?: HQLiveQuote;
  explanation: string;
}

/** Natural-language money request → grounded route (AI Intent Router). */
export async function routeIntent(message: string): Promise<IntentResult> {
  const res = await fetch(`${API_BASE}/api/intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  return res.json();
}

/** Direct structured route via the public AERO API. */
export async function computeRoute(params: {
  amount_usd: number;
  asset: string;
  payment_method?: string;
}) {
  const res = await fetch(`${API_BASE}/api/v1/route?key=${AERO_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

export interface HQMessage {
  role: "user" | "assistant";
  content: string;
}
export interface HQResult {
  ok: boolean;
  ai?: boolean;
  fallback?: boolean;
  fees_live?: boolean;
  reply?: string;
  intent?: Intent;
  route?: Route & { asset: string; amount_usd: number; payment_method?: string };
  hq?: HQLiveQuote;
}

/**
 * HQ — your AI. Send the running chat thread; HQ replies, and when the
 * message is a money move it also returns a grounded route to render inline.
 */
export async function askHQ(messages: HQMessage[]): Promise<HQResult> {
  const res = await fetch(`${API_BASE}/api/hq`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  return res.json();
}

/** One provider quote from the HQ (Hylaq) routing service. */
export interface HQProviderQuote {
  provider: string;
  rail: string;
  feeUsd: number;
  spreadPct: number;
  etaMinutes: number;
  accepts: boolean;
  source: string;
  note?: string;
  assetOut: number;
}

/** Full HQ quote payload, proxied verbatim by the backend (key stays server-side). */
export interface HQRouteQuote {
  ok?: boolean; // present (false) only on backend error responses
  reason?: string;
  best?: HQProviderQuote;
  quotes?: HQProviderQuote[];
  priceUsd?: number;
  savingsUsd?: number;
  mode?: string; // "sandbox" → show the test-mode badge, never hide it
  receipt?: { statement?: string; attestation?: { model?: string; ts?: string; reqId?: string } };
  /** Execution handle for the chosen provider (Zero Hash / Transak / MoonPay / MoneyGram SDKs). */
  execute?: { provider?: string; rail?: string } & Record<string, unknown>;
}

/**
 * Live provider quote — talks to loadit.net's backend, never to HQ directly.
 * The HQ key lives on the server and is never shipped in the app.
 */
export async function getRoute(
  amountUsd: number,
  asset: string,
  payMethod?: string,
  wallet?: string
): Promise<HQRouteQuote> {
  const res = await fetch(`${API_BASE}/api/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountUsd, asset, payMethod, wallet }),
  });
  return res.json();
}

export interface SwapPlan {
  fromAsset: string;
  fromChain: string;
  toAsset: string;
  toChain: string;
  steps: { kind: string; detail: string }[];
  estCostPct: number;
  provider: string | null;
  note: string;
}
export interface MoneyGramPlan {
  ok: boolean;
  reason?: string;
  amountUsd: number;
  asset: string;
  wallet: string;
  loaditFeeUsd: number;
  feePct: number;
  swap: SwapPlan;
  steps: { n: number; title: string; detail: string }[];
  configured: boolean;
}

/**
 * Plan a MoneyGram cash → USDC(Stellar) → chosen-asset route. Talks only to
 * loadit.net; the swap executor and live anchor are configured server-side.
 */
export async function getMoneyGramPlan(
  amountUsd: number,
  asset: string,
  wallet: string
): Promise<MoneyGramPlan> {
  const res = await fetch(`${API_BASE}/api/onramp/moneygram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountUsd, asset, wallet }),
  });
  return res.json();
}

export type OnrampProvider = "coinbase" | "stripe";

export interface OnrampResult {
  ok: boolean;
  provider?: OnrampProvider;
  url?: string;
  configured?: boolean;
  reason?: string;
  message?: string;
}

/**
 * Ask the backend for a non-custodial on-ramp session. The returned URL opens
 * the licensed provider's hosted flow (KYC + cash/card→crypto), delivering to
 * the user's own wallet. Loadit never touches funds.
 */
export async function getOnramp(
  provider: OnrampProvider,
  params: { amount_usd: number; asset: string; wallet: string }
): Promise<OnrampResult> {
  const res = await fetch(`${API_BASE}/api/onramp/${provider}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

/** HQ provider preference: which licensed on-ramp to try first for an asset. */
export function preferredProvider(asset: string): OnrampProvider {
  // Coinbase covers BTC/SOL/XRP natively; Stripe is great for card→USDC/ETH.
  return ["BTC", "SOL", "XRP"].includes(asset.toUpperCase()) ? "coinbase" : "stripe";
}
