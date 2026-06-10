import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight event tracker for the funnel — affiliate clicks, route computes,
 * provider impressions. Forwards each event to ANALYTICS_WEBHOOK_URL (e.g. a
 * Zapier/Make sheet, PostHog, or your DB endpoint). Without that env it logs to
 * the server so the funnel works out of the box. Fire-and-forget; always 200 so
 * it never blocks navigation.
 */
const ALLOWED = new Set([
  "route_computed",
  "provider_click",
  "provider_impression",
  "checkout_start",
]);

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    /* tolerate beacon payloads */
  }

  const event = String(body.event || "");
  if (!ALLOWED.has(event)) {
    return NextResponse.json({ ok: false, reason: "unknown_event" }, { status: 422 });
  }

  const record = {
    event,
    provider: body.provider ?? null,
    asset: body.asset ?? null,
    method: body.method ?? null,
    amount: body.amount ?? null,
    ref: req.headers.get("referer"),
    ua: req.headers.get("user-agent"),
    ts: new Date().toISOString(),
  };

  const hook = process.env.ANALYTICS_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
    } catch {
      /* never block the user on analytics */
    }
  } else {
    console.log("[track]", record);
  }

  return NextResponse.json({ ok: true });
}
