import { NextResponse } from "next/server";
import { guardOnramp } from "@/lib/risk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * STRIPE CRYPTO ONRAMP session (non-custodial).
 *
 * Creates a Stripe Crypto Onramp session server-side (STRIPE_SECRET_KEY) and
 * returns the client_secret. Stripe runs KYC + the fiat→crypto conversion and
 * delivers to the user's own wallet; Loadit never holds funds.
 *
 * The client_secret is mounted by Stripe's onramp UI. On mobile we open the
 * hosted onramp page (/onramp/stripe) in a WebView, which initialises the
 * Stripe onramp SDK with this client_secret.
 *
 * Docs: https://docs.stripe.com/crypto/onramp
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Loadit asset -> Stripe (destination_currency, destination_network).
const MAP: Record<string, { currency: string; network: string }> = {
  USDC: { currency: "usdc", network: "base" },
  ETH: { currency: "eth", network: "ethereum" },
  BTC: { currency: "btc", network: "bitcoin" },
  SOL: { currency: "sol", network: "solana" },
  USDT: { currency: "usdt", network: "ethereum" },
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  let body: { amount_usd?: number; asset?: string; wallet?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400, headers: CORS });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, configured: false, provider: "stripe" }, { headers: CORS });
  }

  const asset = (body.asset || "USDC").toUpperCase();
  const wallet = (body.wallet || "").trim();
  const amount = Math.max(1, Math.round(body.amount_usd || 0));
  const m = MAP[asset];
  if (!m) {
    return NextResponse.json(
      { ok: false, reason: "unsupported_asset", supported: Object.keys(MAP) },
      { status: 422, headers: CORS }
    );
  }
  if (!wallet) {
    return NextResponse.json(
      { ok: false, reason: "missing_wallet", message: "A destination wallet address is required (non-custodial)." },
      { status: 422, headers: CORS }
    );
  }

  // HQ Fraud Shield: score the attempt before the provider hand-off.
  const { verdict, blocked } = await guardOnramp(req, { amountUsd: amount, asset, wallet, payMethod: "card" }, "onramp/stripe", CORS);
  if (blocked) return blocked;

  try {
    const params = new URLSearchParams();
    params.set("transaction_details[destination_currency]", m.currency);
    params.set("transaction_details[destination_network]", m.network);
    params.set("transaction_details[destination_exchange_amount]", "");
    params.set("transaction_details[source_currency]", "usd");
    params.set("transaction_details[source_amount]", String(amount));
    params.set("transaction_details[wallet_address]", wallet);

    const res = await fetch("https://api.stripe.com/v1/crypto/onramp_sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, reason: "stripe_error", detail: data?.error?.message ?? null },
        { headers: CORS }
      );
    }
    return NextResponse.json(
      {
        ok: true,
        provider: "stripe",
        client_secret: data.client_secret,
        id: data.id,
        // Hosted page that mounts the onramp UI with this client_secret.
        url: `https://loadit.net/onramp/stripe?cs=${encodeURIComponent(data.client_secret)}`,
        risk: verdict.decision,
      },
      { headers: CORS }
    );
  } catch {
    return NextResponse.json({ ok: false, reason: "error" }, { headers: CORS });
  }
}
