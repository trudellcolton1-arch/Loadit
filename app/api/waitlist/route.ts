import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

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

type Delivery =
  | { channel: "email"; ok: boolean; status: number; to: string; detail: string }
  | { channel: "log_only"; ok: false; reason: string };

async function emailLead(lead: { email: string; source: string; ts: string }): Promise<Delivery> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[waitlist] RESEND_API_KEY not set — lead only logged, not emailed");
    return { channel: "log_only", ok: false, reason: "RESEND_API_KEY not set" };
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch("https://api.resend.com/emails", {
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
    }).catch((e: unknown) => {
      console.error("[waitlist] resend request failed:", e instanceof Error ? e.message : String(e));
      return null;
    });
    clearTimeout(timer);
    if (!res) return { channel: "log_only", ok: false, reason: "resend unreachable" };
    // Visible in Vercel runtime logs: proves whether the lead actually reached LEADS_TO.
    const text = await res.text().catch(() => "");
    if (res.ok) console.log(`[waitlist] emailed lead to ${LEADS_TO}: ${text}`);
    else console.error(`[waitlist] resend rejected (${res.status}) to ${LEADS_TO}: ${text}`);
    return { channel: "email", ok: res.ok, status: res.status, to: LEADS_TO, detail: text.slice(0, 300) };
  } catch (e) {
    // Never fail the user on a mail hiccup.
    return { channel: "log_only", ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

/** Admin-only diagnostics: the data-room admin key unlocks the delivery report in the response. */
function isAdmin(req: Request): boolean {
  const want = process.env.DATAROOM_ADMIN_KEY;
  const got = req.headers.get("x-waitlist-diag");
  if (!want || !got) return false;
  const a = Buffer.from(want), b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
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

  const delivery = await emailLead(lead);

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

  if (isAdmin(req)) return NextResponse.json({ ok: true, delivery });
  return NextResponse.json({ ok: true });
}
