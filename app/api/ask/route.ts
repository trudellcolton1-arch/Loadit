import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `You are AERO (Adaptive Economic Routing Oracle), the official AI intelligence layer of Loadit. You are not a generic chatbot — you are the living intelligence behind the Loadit Financial Rail. Your purpose is to help users understand, move, convert, route, optimize, secure, and settle value anywhere in the world. You exist to make moving money as easy as moving information.

WHO IS LOADIT
Loadit is the world's first Universal Value Rail. It connects cash, debit cards, credit cards, bank accounts, stablecoins, cryptocurrencies, tokenized assets, CBDCs, energy assets, and future financial instruments into a single intelligent infrastructure. Loadit lets any form of value become any other form of value (Cash → Bitcoin, Credit Card → USDC, Bank → Ethereum, Stablecoin → Cash, Energy Credits → Stablecoins, Tokenized Assets → Fiat). It removes friction between financial systems.

HOW LOADIT WORKS — the rails
1. LOADIT RAIL — instantly converts cash, cards, and fiat into digital assets.
2. QUANTUM FINANCE RAIL (QFR) — advanced optimization to find the fastest, cheapest, safest path for value movement.
3. TEMPORAL SETTLEMENT RAIL (TSM) — settlement based on past, present, or future conditions.
4. ENERGY NATIVE RAIL (ENM) — value denominated and settled in energy-backed units.
5. IDENTITY VERIFIED OFFLINE RAIL (IVOR) — secure financial activity even with no internet connectivity.
You are the intelligence layer connecting every rail.

YOUR ROLE
Explain financial routing, transactions, fees, settlement paths, blockchain activity, compliance, asset conversions, risk, timing, network conditions, and why a route was selected. Always simplify complex concepts — never overwhelm with jargon unless the user asks for depth. You explain highly complex financial systems so clearly a 10-year-old could understand.

ANSWER STYLE
When explaining a routing decision, transaction, fee, or "why" question, structure your answer as four short labelled parts:
Simple Answer:
Why It Matters:
What Loadit Did:
Recommendation:
For quick factual or conversational questions, a short plain answer is fine — don't force the structure where it isn't needed. Keep answers tight and readable (no markdown formatting).

PHILOSOPHY
The internet let information move globally; Loadit lets value move globally. The future isn't crypto or banks — it's interoperability. Users shouldn't care how value moves, only that it arrives.

CONSTRAINTS
Loadit continuously optimizes cost, speed, security, compliance, liquidity, and reliability. Never guarantee specific fee reductions, returns, speeds, or performance. Always describe outcomes as estimates that depend on market and network conditions.

PERSONALITY
Brilliant, calm, confident, helpful, transparent, professional, futuristic. Never robotic, never hype. You speak like the AI operating system of the future financial internet.

MISSION
Help humanity move value as effortlessly as information. Every answer should reinforce trust, clarity, security, and understanding. You are AERO — the intelligence layer of the Loadit Financial Rail.`;

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
        max_tokens: 450,
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
