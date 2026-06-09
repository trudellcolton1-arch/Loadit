import { NextResponse } from "next/server";
import { SITE } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Account-funding scaffold for the Temporal Exchange.
 * Reports which providers are configured (via env) and, when keys are present,
 * creates a real deposit session:
 *   - Stripe Checkout  (STRIPE_SECRET_KEY)
 *   - Coinbase Commerce (COINBASE_COMMERCE_API_KEY)
 * Without keys it returns { configured: false } so the UI stays in demo mode.
 *
 * NOTE: collecting deposits is only the funding layer. Running a real exchange
 * (custody, ledger, settlement of temporal contracts) requires a backend and
 * the appropriate money-transmission / derivatives compliance.
 */
export async function GET() {
  return NextResponse.json({
    providers: {
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      coinbase: Boolean(process.env.COINBASE_COMMERCE_API_KEY),
      crypto: Boolean(process.env.DEPOSIT_WALLET_ADDRESS),
    },
  });
}

export async function POST(req: Request) {
  let body: { provider?: string; amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  const provider = body.provider;
  const amount = Math.max(1, Math.round(body.amount || 0));

  if (provider === "stripe") {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return NextResponse.json({ ok: false, configured: false, provider });
    try {
      const params = new URLSearchParams();
      params.set("mode", "payment");
      params.set("success_url", `${SITE.url}/?funded=1`);
      params.set("cancel_url", `${SITE.url}/?funded=0`);
      params.set("line_items[0][quantity]", "1");
      params.set("line_items[0][price_data][currency]", "usd");
      params.set("line_items[0][price_data][unit_amount]", String(amount * 100));
      params.set("line_items[0][price_data][product_data][name]", "Loadit account funding");
      const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ ok: false, reason: "stripe_error" });
      return NextResponse.json({ ok: true, url: data.url });
    } catch {
      return NextResponse.json({ ok: false, reason: "error" });
    }
  }

  if (provider === "coinbase") {
    const key = process.env.COINBASE_COMMERCE_API_KEY;
    if (!key) return NextResponse.json({ ok: false, configured: false, provider });
    try {
      const res = await fetch("https://api.commerce.coinbase.com/charges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CC-Api-Key": key,
          "X-CC-Version": "2018-03-22",
        },
        body: JSON.stringify({
          name: "Loadit account funding",
          description: "Deposit to Loadit Temporal Exchange",
          pricing_type: "fixed_price",
          local_price: { amount: String(amount), currency: "USD" },
        }),
      });
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ ok: false, reason: "coinbase_error" });
      return NextResponse.json({ ok: true, url: data?.data?.hosted_url });
    } catch {
      return NextResponse.json({ ok: false, reason: "error" });
    }
  }

  if (provider === "crypto") {
    const addr = process.env.DEPOSIT_WALLET_ADDRESS;
    if (!addr) return NextResponse.json({ ok: false, configured: false, provider });
    return NextResponse.json({ ok: true, address: addr });
  }

  return NextResponse.json({ ok: false, reason: "unknown_provider" }, { status: 400 });
}
