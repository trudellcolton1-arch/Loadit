import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live market prices for the Temporal Exchange.
 * BTC/ETH from CoinGecko, USD/MXN from Frankfurter (ECB). Upstream calls are
 * cached server-side (revalidate) to stay within free rate limits; the client
 * polls this endpoint. Degrades gracefully — returns whatever it can fetch.
 */
export async function GET() {
  const prices: Record<string, number> = {};

  // Crypto — Coinbase public exchange-rates (one call, no key, reliable).
  try {
    const r = await fetch(
      "https://api.coinbase.com/v2/exchange-rates?currency=USD",
      { next: { revalidate: 10 } }
    );
    if (r.ok) {
      const d = await r.json();
      const rates = d?.data?.rates ?? {};
      const px = (sym: string) => {
        const v = Number(rates[sym]);
        return v > 0 ? 1 / v : 0;
      };
      const btc = px("BTC");
      const eth = px("ETH");
      const sol = px("SOL");
      if (btc) prices["BTC/USD"] = btc;
      if (eth) prices["ETH/USD"] = eth;
      if (sol) prices["SOL/USD"] = sol;
    }
  } catch {
    /* ignore — degrade gracefully */
  }

  // Fallback for any missing crypto from CoinGecko.
  if (!prices["BTC/USD"] || !prices["ETH/USD"]) {
    try {
      const r = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd",
        { next: { revalidate: 15 } }
      );
      if (r.ok) {
        const d = await r.json();
        if (!prices["BTC/USD"] && d?.bitcoin?.usd) prices["BTC/USD"] = d.bitcoin.usd;
        if (!prices["ETH/USD"] && d?.ethereum?.usd) prices["ETH/USD"] = d.ethereum.usd;
        if (!prices["SOL/USD"] && d?.solana?.usd) prices["SOL/USD"] = d.solana.usd;
      }
    } catch {
      /* ignore */
    }
  }

  try {
    const r2 = await fetch("https://api.frankfurter.app/latest?from=USD&to=MXN", {
      next: { revalidate: 300 },
    });
    if (r2.ok) {
      const d2 = await r2.json();
      if (d2?.rates?.MXN) prices["USD/MXN"] = d2.rates.MXN;
    }
  } catch {
    /* ignore */
  }

  return NextResponse.json({
    ok: Object.keys(prices).length > 0,
    prices,
    ts: Date.now(),
  });
}
