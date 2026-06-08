import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * AERO ↔ OpenAI bridge. Generates the routing explanation + reasoning from the
 * computed route. The API key lives only on the server (OPENAI_API_KEY).
 * If the key is missing or OpenAI errors, we return ok:false and the client
 * gracefully falls back to the deterministic local explanation.
 */
export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, reason: "no_key" });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const {
    paymentMethod,
    asset,
    amount,
    network,
    savingsPct,
    loaditFee,
    legacyFee,
    eta,
    risk,
  } = body as Record<string, string | number>;

  const system =
    "You are AERO (Adaptive Economic Routing Oracle), the AI-orchestrated " +
    "settlement router of the patented, non-custodial Loadit Unified Financial " +
    "Rail. You select the cheapest, fastest, safest path across blockchains, " +
    "liquidity pools, and payment networks, evaluating live fees, liquidity, " +
    "congestion, compliance, and temporal rules. Be precise and confident. " +
    "Never guarantee exact fees, speeds, or returns — frame numbers as estimates " +
    "dependent on market and network conditions. " +
    'Respond ONLY with strict JSON: {"explanation": string, "reasoning": string}. ' +
    "explanation: ONE clear sentence on why this network was chosen. " +
    "reasoning: 2-3 sentences citing fees, liquidity, settlement speed, and risk, " +
    "and which alternatives were ranked lower. No markdown, no preamble.";

  const user =
    `Route chosen: ${paymentMethod} → ${asset} settling on ${network}. ` +
    `Amount $${amount}. Loadit fee $${loaditFee} vs legacy $${legacyFee} ` +
    `(${savingsPct}% savings). Settlement ${eta}. Risk score ${risk}. ` +
    `Explain why AERO picked ${network} over alternatives like Ethereum.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.6,
        max_tokens: 220,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ ok: false, reason: "upstream" });
    }
    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { explanation?: string; reasoning?: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { explanation: content };
    }
    return NextResponse.json({
      ok: true,
      explanation: parsed.explanation ?? null,
      reasoning: parsed.reasoning ?? null,
      model: data?.model ?? null,
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "error" });
  }
}
