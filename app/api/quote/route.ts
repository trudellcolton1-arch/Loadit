import { NextResponse } from "next/server";
import { getHQQuote, hqConfigured } from "@/lib/hq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * LIVE HQ QUOTE — Loadit backend proxy to the HQ (Hylaq) routing service.
 *
 * The phone posts { amountUsd, asset, payMethod, wallet }; the backend adds
 * HQ_LOADIT_KEY server-side and hands hylaqo's route back verbatim. The key
 * lives here and ONLY here — it never reaches the client.
 */
export async function GET() {
  return NextResponse.json({ configured: hqConfigured() });
}

export async function POST(req: Request) {
  let body: { amountUsd?: number; asset?: string; payMethod?: string; wallet?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const amountUsd = Number(body.amountUsd);
  const asset = typeof body.asset === "string" ? body.asset.trim().toUpperCase().slice(0, 12) : "";
  if (!Number.isFinite(amountUsd) || amountUsd <= 0 || amountUsd > 1_000_000 || !asset) {
    return NextResponse.json({ ok: false, reason: "invalid_params" }, { status: 422 });
  }
  if (!hqConfigured()) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  const quote = await getHQQuote({
    amountUsd,
    asset,
    payMethod: typeof body.payMethod === "string" ? body.payMethod.slice(0, 40) : "",
    wallet: typeof body.wallet === "string" ? body.wallet.slice(0, 120) : "",
  });
  if (!quote) {
    return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 502 });
  }
  return NextResponse.json(quote);
}
