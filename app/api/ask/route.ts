import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM =
  "You are AERO, the AI concierge for Loadit — an AI-powered financial rail that " +
  "moves value across cash, cards, stablecoins, and crypto using real-time routing " +
  "(AERO), a Quantum Financial Router (QFR), temporal settlement, energy-denominated " +
  "rails, and offline identity-bound escrow. Loadit routes across Bitcoin, Ethereum, " +
  "Solana, Base, XRPL, Polygon, Lightning, and banks, cutting fees up to ~86% with " +
  "~2s settlement. Answer as a confident fintech infrastructure expert: concrete, " +
  "concise (2-4 sentences), no markdown. If asked to route a payment, describe the " +
  "likely path (e.g. Cash → USDC → Solana → BTC → wallet), an estimated fee, and ETA.";

/** Keyword fallback so the concierge is useful even without an API key. */
function canned(q: string): string {
  const s = q.toLowerCase();
  if (s.includes("fee") || s.includes("cost") || s.includes("cheap"))
    return "AERO scores every network in real time and routes to the cheapest viable path — typically ~$0.45 vs ~$3.20 on legacy rails, an ~86% saving. It re-checks fees, liquidity, and settlement speed on every transaction.";
  if (s.includes("offline") || s.includes("blackout"))
    return "Loadit's offline settlement binds value to a verified identity and holds it in cryptographic escrow. Payments complete during outages and reconcile with a full audit trail the moment connectivity returns.";
  if (s.includes("energy") || s.includes("kwh") || s.includes("electric"))
    return "Part of a payment can ride Loadit's energy rail — converted into tokenized kWh backed by production data. Settlement clears only when IoT meters confirm the energy was generated.";
  if (s.includes("quantum") || s.includes("qfr"))
    return "The Quantum Financial Router explores millions of candidate routes in parallel when quantum hardware is available, with classical AERO as the always-on fallback. The rail gets smarter as the hardware arrives.";
  if (s.includes("how") && (s.includes("work") || s.includes("route")))
    return "Walk into a store, scan a QR, pay with cash or card. Loadit tokenizes it, verifies identity, and AERO routes the value — e.g. Cash → USDC → Solana → your asset → wallet — settling on-chain in ~2 seconds while the merchant still gets fiat.";
  if (s.includes("send") || s.includes("remit") || s.includes("transfer"))
    return "Tell me the amount, asset, and destination and AERO will pick the optimal corridor. A $500 USDC transfer to Manila would likely route Debit → USDC → Solana (or Lightning for BTC), ~$0.45 fee, arriving in under 2 seconds.";
  return "Loadit is the AI-powered financial rail: cash, cards, stablecoins, and crypto routed across 14 networks for the cheapest, fastest, safest settlement. Ask me about fees, how routing works, offline payments, energy settlement, or how a specific transfer would route.";
}

export async function POST(req: Request) {
  let body: { messages?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  const messages = Array.isArray(body.messages) ? body.messages.slice(-8) : [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: true, fallback: true, reply: canned(lastUser) });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "system", content: SYSTEM }, ...messages],
        temperature: 0.6,
        max_tokens: 240,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return NextResponse.json({ ok: true, fallback: true, reply: canned(lastUser) });
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || canned(lastUser);
    return NextResponse.json({ ok: true, reply });
  } catch {
    return NextResponse.json({ ok: true, fallback: true, reply: canned(lastUser) });
  }
}
