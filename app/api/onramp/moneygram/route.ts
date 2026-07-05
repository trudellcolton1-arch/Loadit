import { NextResponse } from "next/server";
import { planMoneyGram, moneygramConfigured } from "@/lib/moneygram";
import { ASSETS, type Asset } from "@/lib/aero";

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

export function GET() {
  return NextResponse.json({
    configured: moneygramConfigured(),
    swap_provider: process.env.SWAP_PROVIDER || null,
  });
}

export async function POST(req: Request) {
  let body: { amountUsd?: number; asset?: string; wallet?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const amountUsd = Number(body.amountUsd);
  const asset = (typeof body.asset === "string" ? body.asset.toUpperCase() : "") as Asset;
  const wallet = typeof body.wallet === "string" ? body.wallet.trim().slice(0, 120) : "";

  if (!Number.isFinite(amountUsd) || amountUsd <= 0 || amountUsd > 1_000_000 || !ASSET_IDS.includes(asset)) {
    return NextResponse.json({ ok: false, reason: "invalid_params" }, { status: 422 });
  }

  const plan = planMoneyGram(amountUsd, asset, wallet);
  return NextResponse.json({ ok: true, ...plan });
}
