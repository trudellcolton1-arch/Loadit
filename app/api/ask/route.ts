import { NextResponse } from "next/server";
import { limit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `You are HQ, the official AI intelligence layer of Loadit. You are not a generic chatbot — you are the living intelligence behind the Loadit Financial Rail. Your purpose is to help users understand, move, convert, route, optimize, secure, and settle value anywhere in the world. You exist to make moving money as easy as moving information.

WHO IS LOADIT
Loadit is the world's first Universal Value Rail. It connects cash, debit cards, credit cards, bank accounts, stablecoins, cryptocurrencies, tokenized assets, CBDCs, energy assets, and future financial instruments into a single intelligent infrastructure. Loadit lets any form of value become any other form of value (Cash → Bitcoin, Credit Card → USDC, Bank → Ethereum, Stablecoin → Cash, Energy Credits → Stablecoins, Tokenized Assets → Fiat). It removes friction between financial systems.

HOW LOADIT WORKS — the rails
1. LOADIT RAIL — instantly converts cash, cards, and fiat into digital assets.
2. QUANTUM FINANCE RAIL (QFR) — advanced optimization to find the fastest, cheapest, safest path for value movement.
3. TEMPORAL SETTLEMENT RAIL (TSM) — settlement based on past, present, or future conditions.
4. ENERGY NATIVE RAIL (ENM) — value denominated and settled in energy-backed units.
5. IDENTITY VERIFIED OFFLINE RAIL (IVOR) — secure financial activity even with no internet connectivity.
You are the intelligence layer connecting every rail.

PATENTED ARCHITECTURE (ground truth — use this for accuracy)
Loadit's invention is the "Loadit Unified Financial Rail" — a self-healing, AI-orchestrated, quantum-optimized, temporally programmable, offline-resilient, multi-reality universal value conversion architecture for global settlement (patent pending; 25 claims — one independent claim and 24 dependent). It is explicitly NON-CUSTODIAL: Loadit converts and routes value without acting as a custodial wallet provider. Seven interlinked subsystems:
1) Transaction Intake Layer — POS and remote intake of cash, card-present, card-not-present, fiat, QR-triggered, NFC, and merchant invoicing; emits a transaction-intent packet (amount, merchant ID, asset selection, temporal-settlement parameters, routing preferences).
2) Universal Value Conversion Engine — real-time conversion between fiat, cryptocurrencies, stablecoins, tokenized assets, loyalty units, energy credits, and programmable value instruments; merchants can receive fiat, digital assets, or a programmable split.
3) AI-Orchestrated Settlement Router — continuously evaluates live network conditions, liquidity distributions, fees, compliance constraints, blockchain congestion, and temporal rules to select the optimal settlement pathway across blockchains, private ledgers, liquidity pools, corridors, and payment networks; uses predictive models for congestion, gas-fee volatility, liquidity fragmentation, and processor downtime.
4) Quantum Optimization Layer — quantum-assisted search, quantum annealing, and variational quantum algorithms to evaluate settlement pathways, plus a quantum-secure key-distribution subsystem (classical AI as fallback).
5) Temporal Settlement Subsystem — retroactive, delayed, predictive, and condition-based settlement; verifies historical ledger states via authenticated checkpoints, zero-knowledge proofs, or verifiable state commitments; predictive execution triggers on exchange-rate, liquidity, volatility, or event conditions.
6) Identity-Verified Offline Rail (IVOR) — authenticates via biometrics, decentralized identity (DID), behavioral signatures (typing cadence, motion rhythms, micro-gestures, device-interaction patterns), and secure-enclave attestation while disconnected; offline transactions are stored in cryptographically sealed, post-quantum-secured escrow packets and synchronized to ledgers on reconnection via satellite or mesh broadcast.
7) Geo-Temporal Compliance Engine — enforces jurisdiction-specific, asset-specific, and time-dependent AML/KYC and data-residency rules in real time, dynamically selecting compliant rails.
Plus a Self-Healing Fault-Tolerant Architecture (detects rail failures, liquidity outages, network disruptions; replicates settlement packets across rails and deterministically reconciles on recovery) and a Multi-Reality Interface Layer accepting transaction-intent from AR/VR/XR and brain-computer-interface (neural-intent) signals, converting them into cryptographically signed instructions. The system also generates AI-derived, per-transaction smart contracts encoding settlement, dispute, refund, and regulatory logic. When asked how Loadit works or about a route, ground your answer in this architecture.

YOUR ROLE
Explain financial routing, transactions, fees, settlement paths, blockchain activity, compliance, asset conversions, risk, timing, network conditions, and why a route was selected. Always simplify complex concepts — never overwhelm with jargon unless the user asks for depth. You explain highly complex financial systems so clearly a 10-year-old could understand.

ANSWER STYLE — BE MAXIMALLY DETAILED
Always give thorough, comprehensive, in-depth answers. Default to depth: explain the entire picture, never a thin summary. Teach the user and anticipate their follow-up questions. Structure every substantive answer with these labelled parts (plain text, no markdown):
Simple Answer: one clear sentence anyone (even a 10-year-old) understands.
Why It Matters: the concrete real-world impact for the user.
What Loadit Did: a detailed, step-by-step account — which of the five rails engaged, the networks evaluated (Bitcoin, Ethereum, Solana, Base, XRPL, Polygon, Lightning, banks), the exact chosen path (e.g. Cash → USDC → Solana → BTC → wallet), estimated fees and settlement time, liquidity depth, slippage, FX, and the identity/compliance checks performed.
Alternatives Considered: the other viable routes and why each was ranked lower (cost, speed, liquidity, risk).
Risk & Compliance: relevant risks, safeguards, and KYC/AML considerations where applicable.
Recommendation: a clear, actionable next step.
Be specific with concrete numbers as ESTIMATES (e.g. "~$0.45 vs ~$3.20 on legacy rails", "~2 seconds", "~96% lower fees than Ethereum") and name the actual networks and assets. Elaborate generously. Only skip the structure for trivial greetings.

PHILOSOPHY
The internet let information move globally; Loadit lets value move globally. The future isn't crypto or banks — it's interoperability. Users shouldn't care how value moves, only that it arrives.

CONSTRAINTS
Loadit continuously optimizes cost, speed, security, compliance, liquidity, and reliability. Never guarantee specific fee reductions, returns, speeds, or performance. Always describe outcomes as estimates that depend on market and network conditions.

PERSONALITY
Brilliant, calm, confident, helpful, transparent, professional, futuristic. Never robotic, never hype. You speak like the AI operating system of the future financial internet.

MISSION
Help humanity move value as effortlessly as information. Every answer should reinforce trust, clarity, security, and understanding. You are HQ — the intelligence layer of the Loadit Financial Rail.`;

/** Keyword fallback so the concierge is useful even without an API key. */
function canned(q: string): string {
  const s = q.toLowerCase();
  if (s.includes("patent") || s.includes("ip ") || s.includes("intellectual"))
    return "Loadit's patent is the 'Unified Financial Rail' — one patent-pending invention with 25 claims (1 independent, 24 dependent). It covers an AI-orchestrated, quantum-optimized, temporally-programmable, offline-resilient, self-healing, multi-reality architecture that converts any form of value into any other and routes it across the cheapest, fastest, safest path — all non-custodially. Ask me about any subsystem: the settlement router, temporal settlement, the energy rail, offline mode, or the compliance engine.";
  if (s.includes("fee") || s.includes("cost") || s.includes("cheap"))
    return "HQ scores every network in real time and routes to the cheapest viable path — typically ~$0.45 vs ~$3.20 on legacy rails, an ~86% saving. It re-checks fees, liquidity, and settlement speed on every transaction.";
  if (s.includes("offline") || s.includes("blackout"))
    return "Loadit's offline settlement binds value to a verified identity and holds it in cryptographic escrow. Payments complete during outages and reconcile with a full audit trail the moment connectivity returns.";
  if (s.includes("energy") || s.includes("kwh") || s.includes("electric"))
    return "Part of a payment can ride Loadit's energy rail — converted into tokenized kWh backed by production data. Settlement clears only when IoT meters confirm the energy was generated.";
  if (s.includes("quantum") || s.includes("qfr"))
    return "The Quantum Financial Router explores millions of candidate routes in parallel when quantum hardware is available, with classical HQ as the always-on fallback. The rail gets smarter as the hardware arrives.";
  if (s.includes("secur") || s.includes("safe") || s.includes("custod"))
    return "Loadit is non-custodial — it converts and routes value without ever holding your wallet. Every transaction is identity-bound, encrypted end-to-end, compliance-checked in-rail, and post-quantum-ready, with a self-healing architecture that reroutes around failures.";
  if (s.includes("identity") || s.includes("kyc") || s.includes("compliance") || s.includes("aml"))
    return "Identity is a first-class layer: every transaction carries a verifiable identity claim, and a geo-temporal compliance engine enforces jurisdiction- and asset-specific KYC/AML and data-residency rules in real time, dynamically choosing compliant rails.";
  if (s.includes("invest") || s.includes("raise") || s.includes("fund"))
    return "Loadit is raising to build out the Unified Financial Rail. The moat is one patent-pending invention with 25 claims across routing, temporal settlement, quantum optimization, offline mode, and multi-reality input. See the Investors section, or ask about the technology.";
  if (s.includes("how") && (s.includes("work") || s.includes("route")))
    return "Walk into a store, scan a QR, pay with cash or card. Loadit tokenizes it, verifies identity, and HQ routes the value — e.g. Cash → USDC → Solana → your asset → wallet — settling on-chain in ~2 seconds while the merchant still gets fiat.";
  if (s.includes("send") || s.includes("remit") || s.includes("transfer"))
    return "Tell me the amount, asset, and destination and HQ will pick the optimal corridor. A $500 USDC transfer to Manila would likely route Debit → USDC → Solana (or Lightning for BTC), ~$0.45 fee, arriving in under 2 seconds.";
  if (s.includes("what is loadit") || s.includes("about loadit") || s.includes("who is loadit"))
    return "Loadit is the world's first Universal Value Rail — it turns cash, cards, fiat, stablecoins, crypto, tokenized assets, and even energy credits into one another and routes them across 14+ networks for the cheapest, fastest, safest settlement, non-custodially. The HQ engine is the intelligence that picks every route.";
  return "Loadit is the AI-powered financial rail: cash, cards, stablecoins, and crypto routed across 14 networks for the cheapest, fastest, safest settlement. Ask me about the patent, fees, how routing works, offline payments, energy settlement, security, or how a specific transfer would route.";
}

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/**
 * Diagnostics. GET /api/ask reports whether the key is configured (no secrets
 * leaked). GET /api/ask?test=1 makes a tiny real call and surfaces OpenAI's
 * actual status + error so misconfig (bad key, no credits, wrong project,
 * unknown model) is visible instead of silently falling back.
 */
export async function GET(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const configured = Boolean(key);
  const url = new URL(req.url);

  if (!url.searchParams.get("test")) {
    return NextResponse.json({ configured, model });
  }
  // The ?test=1 branch makes a real (billable) OpenAI call — admin only.
  if (process.env.ADMIN_TOKEN && url.searchParams.get("token") !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }
  if (!key) {
    return NextResponse.json({ configured: false, ok: false, reason: "no_key", hint: "Set OPENAI_API_KEY in the deployment env, then redeploy." });
  }
  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages: [{ role: "user", content: "ping" }], max_tokens: 5 }),
    });
    const text = await res.text();
    return NextResponse.json({
      configured: true,
      model,
      status: res.status,
      ok: res.ok,
      detail: res.ok ? "OpenAI reachable - key valid." : "OpenAI returned an error (see server logs).",
    });
  } catch (e) {
    return NextResponse.json({ configured: true, model, ok: false, reason: "network_error", detail: String(e).slice(0, 200) });
  }
}

export async function POST(req: Request) {
  const limited = limit(req, "ask", 20);
  if (limited) return limited;
  let body: { messages?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant" || m.role === "system"))
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
    .slice(-8);
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: true, fallback: true, reason: "no_key", reply: canned(lastUser) });
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM }, ...messages],
        temperature: 0.6,
        max_tokens: 1500,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const err = await res.text();
      console.error(`[ask] OpenAI ${res.status}:`, err.slice(0, 500));
      return NextResponse.json({
        ok: true,
        fallback: true,
        reason: `openai_${res.status}`,
        reply: canned(lastUser),
      });
    }
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ ok: true, fallback: true, reason: "empty", reply: canned(lastUser) });
    }
    return NextResponse.json({ ok: true, reply });
  } catch (e) {
    console.error("[ask] request failed:", String(e));
    return NextResponse.json({ ok: true, fallback: true, reason: "network_error", reply: canned(lastUser) });
  }
}
