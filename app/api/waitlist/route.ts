import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Waitlist capture. Validates the email, then delivers the lead through every
 * configured channel:
 *  1. RESEND_API_KEY set → emails the lead to LEADS_TO (default colt@loadit.net)
 *     via Resend's HTTP API. LEADS_FROM overrides the sender.
 *  2. WAITLIST_WEBHOOK_URL set → forwards to the webhook (Zapier/Make/CRM).
 *  3. Always logs, so Vercel runtime logs are a backstop either way.
 * The user's submit never fails on a downstream hiccup.
 */
const LEADS_TO = process.env.LEADS_TO || "colt@loadit.net";
const LEADS_FROM = process.env.LEADS_FROM || "Loadit <onboarding@resend.dev>";

async function emailLead(lead: { email: string; source: string; ts: string }): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        from: LEADS_FROM,
        to: [LEADS_TO],
        reply_to: lead.email,
        subject: `Loadit lead: ${lead.email}`,
        text: `New Request Access lead on loadit.net\n\nEmail: ${lead.email}\nSource: ${lead.source}\nTime: ${lead.ts}\n\nReply to this email to reach them directly.`,
      }),
    }).catch(() => {});
    clearTimeout(timer);
  } catch {
    // Never fail the user on a mail hiccup.
  }
}
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

  await emailLead(lead);

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
  }
  // Backstop: always visible in Vercel runtime logs.
  console.log("[waitlist] lead:", lead);

  return NextResponse.json({ ok: true });
}
