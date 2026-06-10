import { NextResponse } from "next/server";
import { SITE } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe subscription checkout for AERO API plans.
 * Creates a hosted Checkout Session (mode=subscription) for the Startup plan.
 * On payment, the Stripe webhook (/api/stripe/webhook) mints and delivers a
 * signed API key. Requires STRIPE_SECRET_KEY + STRIPE_PRICE_STARTUP (a recurring
 * Price id) in env; without them it returns { configured:false } and the UI
 * falls back to the "request a key" form.
 */
const PRICES: Record<string, string | undefined> = {
  startup: process.env.STRIPE_PRICE_STARTUP,
};

export async function POST(req: Request) {
  let body: { plan?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const plan = (body.plan || "startup").toLowerCase();
  const key = process.env.STRIPE_SECRET_KEY;
  const price = PRICES[plan];

  if (!key || !price) {
    return NextResponse.json({ ok: false, configured: false, plan });
  }

  try {
    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("success_url", `${SITE.url}/developers?subscribed=1&session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${SITE.url}/developers?subscribed=0`);
    params.set("line_items[0][price]", price);
    params.set("line_items[0][quantity]", "1");
    params.set("metadata[plan]", plan);
    params.set("subscription_data[metadata][plan]", plan);
    params.set("allow_promotion_codes", "true");
    if (body.email) params.set("customer_email", body.email);

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
