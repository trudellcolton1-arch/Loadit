import { NextResponse } from "next/server";
import {
  aiParseIntent,
  explainRoute,
  heuristicParse,
  routeIntent,
} from "@/lib/intent";
import { getHQQuote, toWire } from "@/lib/hq";
import { limit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public planning endpoint, called by the Loadit app (native fetch has no
 *  origin; the Expo web preview runs cross-origin). No credentials, nothing
 *  sensitive — CORS-open like /api/rail. */
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * AI INTENT ROUTER — natural language → real route.
 *
 * Turns a plain-language money request ("send my mom $200 in Manila the
 * cheapest way") into a structured, validated transaction intent, then runs it
 * through the real HQ engine (with live fees) so every number is grounded,
 * never hallucinated. Uses OpenAI tool-calling when configured; falls back to a
 * deterministic heuristic parser so it always works. Parsing/routing lives in
 * lib/intent.ts, shared with the /api/hq assistant.
 */
export async function POST(req: Request) {
  const limited = limit(req, "intent", 20);
  if (limited) return limited;
  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400, headers: CORS_HEADERS });
  }
  const message = (body.message || "").trim().slice(0, 2000);
  if (!message) {
    return NextResponse.json({ ok: false, reason: "empty" }, { status: 422, headers: CORS_HEADERS });
  }

  const key = process.env.OPENAI_API_KEY;
  let intent = key ? await aiParseIntent(message, key) : null;
  const aiParsed = Boolean(intent);
  if (!intent) intent = heuristicParse(message);

  // HQ engine + live HQ provider check in parallel; HQ is additive and
  // absent whenever the service or key is unavailable.
  const [routed, live] = await Promise.all([
    routeIntent(intent),
    getHQQuote({
      amountUsd: intent.amount_usd,
      asset: intent.asset,
      payMethod: intent.payment_method,
      wallet: intent.destination,
    }),
  ]);

  return NextResponse.json(
    {
      ok: true,
      ai: aiParsed,
      fees_live: routed.fees_live,
      intent,
      route: routed.route,
      hq: live ? toWire(live) : undefined,
      explanation: explainRoute(intent, routed.result),
    },
    { headers: CORS_HEADERS }
  );
}
