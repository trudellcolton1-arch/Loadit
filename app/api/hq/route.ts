import { NextResponse } from "next/server";
import {
  ROUTE_TOOL,
  heuristicParse,
  looksLikeMoneyIntent,
  routeIntent,
  validateIntent,
  type Intent,
  type RoutedIntent,
} from "@/lib/intent";
import { formatUSD } from "@/lib/aero";
import { getHQQuote, toWire, type HQQuote } from "@/lib/hq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * HQ — the user's personal AI inside the Loadit app.
 *
 * One endpoint, two behaviors in a single conversation:
 * - Chat: answers as HQ, the in-app money copilot (short, mobile-friendly —
 *   unlike AERO's maximally-detailed web concierge at /api/ask).
 * - Action: when the user asks to actually move money, HQ parses the intent
 *   (OpenAI tool-calling, heuristic fallback), runs it through the real AERO
 *   engine with live fees, and returns a `route` payload alongside the reply
 *   so the app can render an actionable route card in the thread. Numbers
 *   always come from the engine, never from the model.
 *
 * Works with no OPENAI_API_KEY: intent detection + canned answers keep the
 * whole loop functional offline.
 */

const SYSTEM = `You are HQ — the user's personal AI inside the Loadit app. Loadit is the AI-powered financial rail: cash, cards, and bank money in; Bitcoin, Ethereum, Solana, XRP, USDC, or USDT out — routed the cheapest real way.

WHO YOU ARE
You are "my AI" for each user: their money copilot, in their pocket. You are the ONLY intelligence in Loadit — you route everything, you quote everything, you explain everything. Never mention any other engine or AI. You are warm, sharp, and brief. This is a phone screen — answer in a few short sentences, not essays. No markdown, no headers, no bullet lists unless the user asks for a breakdown.

GROUND TRUTH ABOUT LOADIT (use this, never contradict it)
- Non-custodial: Loadit never holds user funds. Purchases are completed by licensed partners (Coinbase or Stripe) straight to the user's own wallet.
- Cash at any register: THE way to turn paper cash into crypto — deposit cash at 90,000+ stores (Walmart, Walgreens, 7-Eleven, CVS…), then buy through a licensed on-ramp straight to the user's own wallet.
- You route across networks (Lightning, Solana, Base, Ethereum, Polygon, XRPL) for the cheapest, fastest settlement; typical savings vs legacy rails (Bitcoin ATMs, card spreads) are large but always estimates.
- Pricing: Loadit charges ONE flat 0.75% convenience fee on the amount converted — shown before the user confirms, no hidden spread. At 0.75% Loadit undercuts everything: bank/debit on-ramps (~1-2%), cards (4-5%), and Bitcoin ATMs (7-15%). Cheaper than the bank is the whole point. Be upfront about the fee; never hide it or claim it's free.
- Provider preference: Coinbase covers BTC/SOL/XRP natively; Stripe is great for card→USDC/ETH.

WHEN TO ACT
If the user wants to actually move, buy, convert, or send money, call route_money with their intent — do not answer in prose. If details are missing, sensible defaults: Debit Card funding, USDC asset, $100. If they are only asking a question, just answer it.

RULES
Never invent fees, savings, or settlement times — routing numbers come from the engine, not you. Describe outcomes as estimates. Never guarantee returns or performance. No financial advice on what to invest in — if asked "should I buy X", explain you route money, you don't pick winners. Stay on money, Loadit, and crypto; deflect anything else with one friendly sentence and bring it back to what you can do.`;

/** Keyword fallback so HQ is useful even without an API key. */
function canned(q: string): string {
  const s = q.toLowerCase();
  if (/\b(what|who)\b.*\b(are you|is hq)\b|^hq\??$/.test(s) || s.includes("your name"))
    return "I'm HQ — your AI inside Loadit. Tell me what you want to do with your money (like \"turn $200 cash into Bitcoin\") and I'll find the cheapest real route through a licensed partner, straight to your own wallet.";
  if (s.includes("register") || s.includes("qr") || (s.includes("cash") && s.includes("store")))
    return "Cash at any register: deposit paper cash at 90,000+ stores, then buy crypto through Coinbase or Stripe — it lands in your own wallet. Tap the register card on the home screen and I'll walk you through it.";
  if (s.includes("fee") || s.includes("cost") || s.includes("cheap"))
    return "Loadit charges one flat 0.75% convenience fee on the amount you convert — shown before you confirm, no hidden spread. On $150 that's about $1.13. It undercuts banks and debit rails (~1–2%), cards (4–5%), and Bitcoin ATMs (7–15%). Tell me an amount and asset and I'll quote the exact fee and total.";
  if (s.includes("safe") || s.includes("secur") || s.includes("custod") || s.includes("trust"))
    return "Loadit is non-custodial — your money never sits with us. Every purchase is completed by a licensed partner (Coinbase or Stripe) directly to a wallet you control. I route; I never hold.";
  if (s.includes("coinbase") || s.includes("stripe") || s.includes("provider"))
    return "Two licensed partners finish every purchase: Coinbase covers BTC, SOL, and XRP natively, and Stripe shines for card→USDC or ETH. I pick whichever is cheapest and cleanest for your asset — you can override it on the buy screen.";
  if (s.includes("wallet"))
    return "You bring your own wallet — Loadit never creates or holds one for you. Paste your address at checkout and the licensed partner delivers straight to it.";
  if (s.includes("invest") || s.includes("should i buy") || s.includes("price") || s.includes("predict"))
    return "I route money — I don't pick winners or predict prices. Once you've decided what you want, I'll make sure you get it the cheapest real way.";
  return "I'm HQ, your AI for moving money. Ask me how Loadit works, or just say the move — \"buy $250 of Solana with my debit card\", \"turn $500 cash into Bitcoin\" — and I'll route it.";
}

/** HQ-voiced version of the route explanation. */
function hqExplain(intent: Intent, routed: RoutedIntent, live?: HQQuote | null): string {
  const dest = intent.destination ? ` to ${intent.destination}` : "";
  const r = routed.result;
  const cheaper = r.savingsPct > 0 ? `, ~${r.savingsPct}% cheaper than the old way` : "";
  const base =
    `Here's your route: ${formatUSD(intent.amount_usd)} from your ${intent.payment_method.toLowerCase()} ` +
    `into ${intent.asset}${dest}, settling over ${r.network.name} in ${r.eta}. ` +
    `My flat 0.75% fee is ${formatUSD(r.loaditFee)}, so you pay ${formatUSD(r.total)} all in${cheaper}. ` +
    `A licensed partner completes it straight to your wallet; I never hold your funds.`;
  if (!live) return `${base} Ready when you are.`;
  const beat = live.savingsUsd > 0 ? `, beating the next-best offer by ${formatUSD(live.savingsUsd)}` : "";
  return (
    `${base} I also checked live providers: best execution right now is ${live.best.provider} — ` +
    `you'd receive about ${live.best.assetOut} ${intent.asset}${beat}. Ready when you are.`
  );
}

/** Run the AERO engine and the live HQ provider check in parallel. */
async function routeWithLiveQuote(intent: Intent) {
  const [routed, live] = await Promise.all([
    routeIntent(intent),
    getHQQuote({
      amountUsd: intent.amount_usd,
      asset: intent.asset,
      payMethod: intent.payment_method,
      wallet: intent.destination,
    }),
  ]);
  return { routed, live };
}

interface ChatMsg {
  role: string;
  content: string;
}

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

async function aiChat(
  messages: ChatMsg[],
  key: string
): Promise<{ reply?: string; intent?: Intent } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "system", content: SYSTEM }, ...messages],
        tools: [ROUTE_TOOL],
        tool_choice: "auto",
        temperature: 0.6,
        max_tokens: 700,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.error(`[hq] OpenAI ${res.status}:`, (await res.text()).slice(0, 500));
      return null;
    }
    const data = await res.json();
    const msg = data?.choices?.[0]?.message;
    const args = msg?.tool_calls?.[0]?.function?.arguments;
    if (args) {
      try {
        return { intent: validateIntent(JSON.parse(args)) };
      } catch {
        return null;
      }
    }
    const reply = msg?.content?.trim();
    return reply ? { reply } : null;
  } catch (e) {
    console.error("[hq] request failed:", String(e));
    return null;
  }
}

/** GET /api/hq — diagnostics: is the live model configured? (no secrets leaked) */
export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  });
}

export async function POST(req: Request) {
  let body: { messages?: ChatMsg[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
    .slice(-12);
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  if (!lastUser.trim()) {
    return NextResponse.json({ ok: false, reason: "empty" }, { status: 422 });
  }

  const key = process.env.OPENAI_API_KEY;

  if (key) {
    const ai = await aiChat(messages, key);
    if (ai?.intent) {
      const { routed, live } = await routeWithLiveQuote(ai.intent);
      return NextResponse.json({
        ok: true,
        ai: true,
        fees_live: routed.fees_live,
        reply: hqExplain(ai.intent, routed, live),
        intent: ai.intent,
        route: routed.route,
        hq: live ? toWire(live) : undefined,
      });
    }
    if (ai?.reply) {
      return NextResponse.json({ ok: true, ai: true, reply: ai.reply });
    }
    // fall through to the offline path on any AI failure
  }

  if (looksLikeMoneyIntent(lastUser)) {
    const intent = heuristicParse(lastUser);
    const { routed, live } = await routeWithLiveQuote(intent);
    return NextResponse.json({
      ok: true,
      ai: false,
      fallback: !key ? undefined : true,
      fees_live: routed.fees_live,
      reply: hqExplain(intent, routed, live),
      intent,
      route: routed.route,
      hq: live ? toWire(live) : undefined,
    });
  }

  return NextResponse.json({ ok: true, ai: false, fallback: key ? true : undefined, reply: canned(lastUser) });
}
