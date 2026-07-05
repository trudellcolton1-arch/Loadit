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
  legacy_fee_usd: number;
  savings_usd: number;
  savings_pct: number;
  eta: string;
}
export interface IntentResult {
  ok: boolean;
  ai: boolean;
  fees_live: boolean;
  intent: Intent;
  route: Route;
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
  route?: Route & { asset: string; amount_usd: number };
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
