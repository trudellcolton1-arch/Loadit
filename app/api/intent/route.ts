import { NextResponse } from "next/server";
import {
  aiParseIntent,
  explainRoute,
  heuristicParse,
  routeIntent,
} from "@/lib/intent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * AI INTENT ROUTER — natural language → real route.
 *
 * Turns a plain-language money request ("send my mom $200 in Manila the
 * cheapest way") into a structured, validated transaction intent, then runs it
 * through the real AERO engine (with live fees) so every number is grounded,
 * never hallucinated. Uses OpenAI tool-calling when configured; falls back to a
 * deterministic heuristic parser so it always works. Parsing/routing lives in
 * lib/intent.ts, shared with the /api/hq assistant.
 */
export async function POST(req: Request) {
  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  const message = (body.message || "").trim();
  if (!message) {
    return NextResponse.json({ ok: false, reason: "empty" }, { status: 422 });
  }

  const key = process.env.OPENAI_API_KEY;
  let intent = key ? await aiParseIntent(message, key) : null;
  const aiParsed = Boolean(intent);
  if (!intent) intent = heuristicParse(message);

  const routed = await routeIntent(intent);

  return NextResponse.json({
    ok: true,
    ai: aiParsed,
    fees_live: routed.fees_live,
    intent,
    route: routed.route,
    explanation: explainRoute(intent, routed.result),
  });
}
