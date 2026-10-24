import { NextResponse } from "next/server";
import { isValidSessionId } from "@/lib/merchant/session";
import { publicView, syncSession } from "@/lib/merchant/payments";
import { getSession, merchantStoreConfigured } from "@/lib/merchant/store";
import { limit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * HOSTED CHECKOUT — on-chain verification.
 *
 * POST /api/checkout/session/:id/verify → checks Horizon for a successful
 * USDC payment to the merchant's address carrying this session's memo. On a
 * match the session flips to succeeded (exactly once — the store guards the
 * transition) and the signed payment.succeeded webhook fires. The checkout
 * page polls this while the buyer pays. Safe to call any number of times.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const limited = limit(req, "checkout-verify", 30);
  if (limited) return limited;
  if (!merchantStoreConfigured()) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }
  if (!isValidSessionId(params.id)) {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }
  try {
    let session = await getSession(params.id);
    if (!session) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
    session = await syncSession(session, { verify: true });
    return NextResponse.json({ ok: true, session: publicView(session) });
  } catch {
    return NextResponse.json({ ok: false, reason: "store_error" }, { status: 502 });
  }
}
