/**
 * HQ (Hylaq) live routing service — server-side client.
 *
 * HQ_LOADIT_KEY lives here and ONLY here: calls go Loadit backend →
 * hylaqo.com, and the key is never sent to the phone or the browser.
 * Every helper degrades to null on any failure so callers can fall back
 * to the local HQ engine.
 */

const HQ_URL = "https://www.hylaqo.com/api/route";

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

export interface HQQuote {
  best: HQProviderQuote;
  quotes: HQProviderQuote[];
  priceUsd: number;
  savingsUsd: number;
  mode: string;
  receipt?: { statement?: string; attestation?: Record<string, unknown> };
}

/** Flattened wire format we expose to clients (snake_case like the rest of the API). */
export interface HQQuoteWire {
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

export function hqConfigured(): boolean {
  return Boolean(process.env.HQ_LOADIT_KEY);
}

export async function getHQQuote(params: {
  amountUsd: number;
  asset: string;
  payMethod?: string;
  wallet?: string;
}): Promise<HQQuote | null> {
  const key = process.env.HQ_LOADIT_KEY;
  if (!key) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(HQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        amountUsd: params.amountUsd,
        asset: params.asset,
        payMethod: params.payMethod || "",
        wallet: params.wallet || "",
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.error(`[hq] hylaqo ${res.status}:`, (await res.text()).slice(0, 300));
      return null;
    }
    const data = await res.json();
    if (!data?.best?.provider) return null;
    return data as HQQuote;
  } catch (e) {
    console.error("[hq] quote failed:", String(e));
    return null;
  }
}

export function toWire(q: HQQuote): HQQuoteWire {
  return {
    provider: q.best.provider,
    rail: q.best.rail,
    fee_usd: q.best.feeUsd,
    spread_pct: q.best.spreadPct,
    eta_minutes: q.best.etaMinutes,
    asset_out: q.best.assetOut,
    price_usd: q.priceUsd,
    savings_usd: q.savingsUsd,
    mode: q.mode,
  };
}
