import { NextResponse } from "next/server";
import { limit } from "@/lib/ratelimit";
import { parseInquiry, formatInquiryEmail } from "@/lib/investorInquiry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Investor inquiry from loadit.info. Validates server-side, honeypot + rate
 * limit for spam, then delivers to the company inbox via Resend (the same
 * adapter the waitlist uses). Success is returned ONLY when Resend accepts
 * the message — a submission is never silently discarded. If delivery is not
 * configured or fails, the client gets an honest error with a direct email.
 *
 * Env: RESEND_API_KEY (required for delivery), LEADS_TO (default
 * colt@loadit.net), LEADS_FROM (default Resend onboarding sender),
 * INVESTOR_WEBHOOK_URL (optional CRM forward).
 */
const LEADS_TO = process.env.LEADS_TO || "colt@loadit.net";
const LEADS_FROM = process.env.LEADS_FROM || "Loadit <onboarding@resend.dev>";

export async function POST(req: Request) {
  const limited = limit(req, "investor-inquiry", 5);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const parsed = parseInquiry(body);
  if (!parsed.ok) {
    // Honeypot: pretend success to the bot, deliver nothing, log nothing personal.
    if (parsed.errors.website) return NextResponse.json({ ok: true });
    return NextResponse.json({ ok: false, reason: "invalid", errors: parsed.errors }, { status: 422 });
  }
  const inquiry = parsed.inquiry;
  const ts = new Date().toISOString();

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[investor-inquiry] RESEND_API_KEY not set — delivery not configured");
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        from: LEADS_FROM,
        to: [LEADS_TO],
        reply_to: inquiry.email,
        subject: `Investor inquiry: ${inquiry.name}${inquiry.firm ? ` (${inquiry.firm})` : ""}`,
        text: formatInquiryEmail(inquiry, ts),
      }),
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.error(`[investor-inquiry] resend rejected (${res.status})`);
      return NextResponse.json({ ok: false, reason: "delivery_failed" }, { status: 502 });
    }
  } catch (e) {
    console.error("[investor-inquiry] resend unreachable:", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ ok: false, reason: "delivery_failed" }, { status: 502 });
  }

  // Optional CRM forward — best effort, never affects the user's result.
  const hook = process.env.INVESTOR_WEBHOOK_URL;
  if (hook) {
    fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...inquiry, ts, source: "loadit.info" }) }).catch(() => {});
  }

  // Minimal operational log: no name, email, or message.
  console.log("[investor-inquiry] delivered", { ts, investorType: inquiry.investorType ?? null, hasFirm: Boolean(inquiry.firm) });
  return NextResponse.json({ ok: true });
}
