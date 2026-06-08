import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Waitlist capture. Validates the email and, if WAITLIST_WEBHOOK_URL is set
 * (e.g. a Zapier/Make/CRM endpoint), forwards the lead. Without it, the lead
 * is accepted and logged so the form works out of the box; wire the webhook in
 * Vercel env to start collecting for real.
 */
export async function POST(req: Request) {
  let body: { email?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!EMAIL.test(email)) {
    return NextResponse.json({ ok: false, reason: "invalid_email" }, { status: 422 });
  }

  const lead = {
    email,
    source: body.source || "request_access",
    ts: new Date().toISOString(),
  };

  const hook = process.env.WAITLIST_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
    } catch {
      // Don't fail the user if the downstream hook hiccups.
    }
  } else {
    console.log("[waitlist] lead:", lead);
  }

  return NextResponse.json({ ok: true });
}
