import { NextResponse } from "next/server";
import crypto from "crypto";
import { signApiKey } from "@/lib/apiKeys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook → mint + deliver an AERO API key.
 *
 * On `checkout.session.completed` we generate a stateless signed key (see
 * lib/apiKeys) bound to the customer, and forward it to KEY_DELIVERY_WEBHOOK_URL
 * (or WAITLIST_WEBHOOK_URL) so your email/CRM automation can send it. Signature
 * is verified manually against STRIPE_WEBHOOK_SECRET — no SDK required.
 *
 * Without STRIPE_WEBHOOK_SECRET set, we reject so unsigned calls can't mint keys.
 */
function verifyStripeSig(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${payload}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!verifyStripeSig(payload, sig, secret)) {
    return NextResponse.json({ ok: false, reason: "bad_signature" }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_json" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object ?? {};
    const email =
      (session.customer_email as string) ||
      ((session.customer_details as Record<string, unknown>)?.email as string) ||
      undefined;
    const plan =
      ((session.metadata as Record<string, unknown>)?.plan as string) || "startup";
    const kid = "k_" + String(session.id || crypto.randomUUID()).slice(-16);

    const apiKey = signApiKey({ kid, plan, email });

    // Deliver the key to your email/CRM automation.
    const hook = process.env.KEY_DELIVERY_WEBHOOK_URL || process.env.WAITLIST_WEBHOOK_URL;
    const delivery = { type: "api_key_issued", email, plan, kid, apiKey, ts: new Date().toISOString() };
    if (hook) {
      try {
        await fetch(hook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(delivery),
        });
      } catch {
        /* don't fail the webhook on downstream hiccup — Stripe would retry */
      }
    } else {
      console.log("[stripe] issued API key:", { email, plan, kid });
    }
  }

  return NextResponse.json({ ok: true, received: true });
}
