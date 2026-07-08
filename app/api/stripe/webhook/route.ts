import { NextResponse } from "next/server";
import crypto from "crypto";
import { signApiKey } from "@/lib/apiKeys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook → mint + deliver an HQ API key.
 *
 * On `checkout.session.completed` we generate a stateless signed key (see
 * lib/apiKeys) bound to the customer, and forward it to KEY_DELIVERY_WEBHOOK_URL
 * (or WAITLIST_WEBHOOK_URL) so your email/CRM automation can send it. Signature
 * is verified manually against STRIPE_WEBHOOK_SECRET — no SDK required.
 *
 * Without STRIPE_WEBHOOK_SECRET set, we reject so unsigned calls can't mint keys.
 */
const SIG_TOLERANCE_S = 300; // reject events older than 5 min (replay guard)

function verifyStripeSig(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  // A signature header can carry a timestamp and MULTIPLE v1 signatures (during
  // secret rotation). Collect every v1 rather than letting the last one win.
  let t = "";
  const v1s: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.split("=");
    if (k === "t") t = v;
    else if (k === "v1" && v) v1s.push(v);
  }
  if (!t || !v1s.length) return false;
  // Replay protection: the signed timestamp must be recent.
  const ts = parseInt(t, 10);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > SIG_TOLERANCE_S) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${payload}`)
    .digest("hex");
  const exp = Buffer.from(expected);
  return v1s.some((v1) => {
    try {
      const got = Buffer.from(v1);
      return got.length === exp.length && crypto.timingSafeEqual(got, exp);
    } catch {
      return false;
    }
  });
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
