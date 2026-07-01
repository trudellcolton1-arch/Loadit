import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * COINBASE ONRAMP hand-off (non-custodial).
 *
 * Builds a Coinbase Onramp URL that opens Coinbase's licensed, hosted flow.
 * Coinbase runs KYC + the cash/card→crypto conversion and delivers the asset
 * straight to the USER'S OWN wallet address. Loadit never touches funds.
 *
 * Config: COINBASE_ONRAMP_APP_ID (from the Coinbase Developer Platform). For the
 * newer secure-init flow you can also mint a session token server-side with CDP
 * API keys and pass it through; this builder supports appId today.
 *
 * Docs: https://docs.cdp.coinbase.com/onramp/docs/api-initializing
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Loadit asset -> Coinbase (network, ticker). base/solana are cheapest to settle.
const MAP: Record<string, { network: string; asset: string }> = {
  USDC: { network: "base", asset: "USDC" },
  USDT: { network: "ethereum", asset: "USDT" },
  ETH: { network: "base", asset: "ETH" },
  BTC: { network: "bitcoin", asset: "BTC" },
  SOL: { network: "solana", asset: "SOL" },
  XRP: { network: "ripple", asset: "XRP" },
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  let body: { amount_usd?: number; asset?: string; wallet?: string; sessionToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400, headers: CORS });
  }

  const appId = process.env.COINBASE_ONRAMP_APP_ID;
  if (!appId) {
    return NextResponse.json({ ok: false, configured: false, provider: "coinbase" }, { headers: CORS });
  }

  const asset = (body.asset || "USDC").toUpperCase();
  const wallet = (body.wallet || "").trim();
  const amount = Math.max(1, Math.round(body.amount_usd || 0));
  const m = MAP[asset] || MAP.USDC;

  if (!wallet) {
    return NextResponse.json(
      { ok: false, reason: "missing_wallet", message: "A destination wallet address is required (non-custodial)." },
      { status: 422, headers: CORS }
    );
  }

  const params = new URLSearchParams();
  params.set("appId", appId);
  // addresses maps the user's wallet -> networks it can receive on.
  params.set("addresses", JSON.stringify({ [wallet]: [m.network] }));
  params.set("assets", JSON.stringify([m.asset]));
  params.set("defaultAsset", m.asset);
  params.set("defaultNetwork", m.network);
  params.set("presetFiatAmount", String(amount));
  params.set("fiatCurrency", "USD");
  if (body.sessionToken) params.set("sessionToken", body.sessionToken);

  const url = `https://pay.coinbase.com/buy/select-asset?${params.toString()}`;
  return NextResponse.json(
    { ok: true, provider: "coinbase", url, network: m.network, asset: m.asset },
    { headers: CORS }
  );
}
