import { NextResponse } from "next/server";
import { planMoneyGram, moneygramConfigured } from "@/lib/moneygram";
import { ASSETS, type Asset } from "@/lib/aero";
import { guardOnramp } from "@/lib/risk";

/** Public planning endpoint, called by the Loadit app (native fetch has no
 *  origin; the Expo web preview runs cross-origin). No credentials, nothing
 *  sensitive — CORS-open like /api/rail. Fraud Shield still blocks; its 403
 *  carries the same headers so web clients can read the verdict. */
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * MONEYGRAM RAMPS route planner.
 *
 * POST { amountUsd, asset, wallet } → the full cash→USDC(Stellar)→swap→asset
 * plan the app renders and HQ explains. Provider-agnostic: the swap executor
 * plugs in via SWAP_PROVIDER, the live anchor via MONEYGRAM_ANCHOR_URL.
 * GET → configuration status (no secrets).
 */
const ASSET_IDS = ASSETS.map((a) => a.id);

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function GET() {
  return NextResponse.json(
    {
      configured: moneygramConfigured(),
      swap_provider: process.env.SWAP_PROVIDER || null,
    },
    { headers: CORS_HEADERS }
  );
}

export async function POST(req: Request) {
  let body: { amountUsd?: number; asset?: string; wallet?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400, headers: CORS_HEADERS });
  }

  const amountUsd = Number(body.amountUsd);
  const asset = (typeof body.asset === "string" ? body.asset.toUpperCase() : "") as Asset;
  const wallet = typeof body.wallet === "string" ? body.wallet.trim().slice(0, 120) : "";

  if (!Number.isFinite(amountUsd) || amountUsd <= 0 || amountUsd > 1_000_000 || !ASSET_IDS.includes(asset)) {
    return NextResponse.json({ ok: false, reason: "invalid_params" }, { status: 422, headers: CORS_HEADERS });
  }

  // HQ Fraud Shield: score the attempt before planning the ramp. A block is
  // still a block — the headers only make the 403 readable to web clients.
  const { verdict, blocked } = await guardOnramp(
    req,
    { amountUsd, asset, wallet, payMethod: "cash" },
    "onramp/moneygram",
    CORS_HEADERS
  );
  if (blocked) return blocked;

  const plan = planMoneyGram(amountUsd, asset, wallet);
  return NextResponse.json({ ok: true, ...plan, risk: verdict.decision }, { headers: CORS_HEADERS });
}
