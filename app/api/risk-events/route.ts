import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * RISK EVENTS COLLECTOR — a simple, self-hosted sink for the HQ Fraud Shield's
 * shadow-mode telemetry (set ANALYTICS_WEBHOOK_URL to this route).
 *
 * POST — receives a verdict payload, console.logs it (so it shows in Vercel's
 * runtime logs, the reliable multi-day record) and keeps a recent in-memory
 * ring for a quick browser peek.
 * GET  — token-gated JSON of recent events (defaults to non-allow only). The
 * in-memory ring is per warm instance and resets on cold start; the Vercel
 * runtime logs are the durable view.
 *
 * Data note: keeps risk verdicts (hashed IP, wallet, amount, geo, decision).
 * Guard the GET with RISK_EVENTS_TOKEN so the buffer isn't world-readable.
 */
const MAX = 500;
let events: Array<Record<string, unknown>> = [];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    events.push({ received: new Date().toISOString(), ...body });
    if (events.length > MAX) events = events.slice(-MAX);
    // Durable view: shows up in Vercel → Project → Logs (filter "[risk-event]").
    console.log("[risk-event]", JSON.stringify(body));
  } catch {
    /* never fail the caller */
  }
  return NextResponse.json({ ok: true });
}

export function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const expected = process.env.RISK_EVENTS_TOKEN;
  if (!expected || token !== expected) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }
  const showAll = url.searchParams.get("all") === "1";
  const list = showAll ? events : events.filter((e) => e.decision && e.decision !== "allow");
  return NextResponse.json({
    ok: true,
    count: list.length,
    note: "In-memory ring (resets on cold start). Vercel runtime logs are the durable record — filter for [risk-event].",
    events: list.slice(-200).reverse(),
  });
}
