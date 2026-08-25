import { NextResponse } from "next/server";
import { limit } from "@/lib/ratelimit";
import {
  mgSandboxConfigured,
  startSandboxDeposit,
  sandboxDepositStatus,
} from "@/lib/moneygramSandbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * FOUNDER PRACTICE RUN — MoneyGram sandbox leg.
 *
 * POST { amountUsd } → starts a real SEP-24 interactive deposit at MoneyGram's
 * TESTNET anchor and returns their hosted sandbox URL + transaction id.
 * GET ?id=<sep24 id> → live transaction status from the anchor.
 *
 * Test network, test USDC, no real money — the lib refuses to run against
 * the public network, so this endpoint cannot be pointed at production.
 */

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") || "").trim();
  if (!id) {
    return NextResponse.json({ configured: mgSandboxConfigured(), mode: "sandbox" });
  }
  const limited = limit(req, "practice-mg-status", 30);
  if (limited) return limited;
  return sandboxDepositStatus(id)
    .then((s) =>
      s
        ? NextResponse.json({ ok: true, mode: "sandbox", ...s })
        : NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 })
    )
    .catch(() => NextResponse.json({ ok: false, reason: "anchor_unavailable" }, { status: 502 }));
}

export async function POST(req: Request) {
  const limited = limit(req, "practice-mg", 10);
  if (limited) return limited;

  if (!mgSandboxConfigured()) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  let body: { amountUsd?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  const amountUsd = Number(body.amountUsd);
  if (!Number.isFinite(amountUsd) || amountUsd < 1 || amountUsd > 10_000) {
    return NextResponse.json({ ok: false, reason: "invalid_params" }, { status: 422 });
  }

  try {
    const dep = await startSandboxDeposit(amountUsd);
    return NextResponse.json({ ok: true, mode: "sandbox", ...dep });
  } catch {
    return NextResponse.json({ ok: false, reason: "anchor_unavailable" }, { status: 502 });
  }
}
