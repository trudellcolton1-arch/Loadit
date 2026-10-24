import { NextResponse } from "next/server";
import { isValidSessionId } from "@/lib/merchant/session";
import { publicView, syncSession } from "@/lib/merchant/payments";
import { getSession, merchantStoreConfigured } from "@/lib/merchant/store";
import { limit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * HOSTED CHECKOUT — public session view.
 *
 * GET /api/checkout/session/:id → the public-safe fields the hosted checkout
 * page renders (amount, USDC, destination, memo, status, expiry). No API key:
 * the session id in the URL is the capability, exactly like a Stripe Checkout
 * link. Expiry is applied lazily; on-chain verification happens via the
 * sibling /verify endpoint so plain page loads stay fast.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const limited = limit(req, "checkout-view", 60);
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
    session = await syncSession(session, { verify: false });
    return NextResponse.json({ ok: true, session: publicView(session) });
  } catch {
    return NextResponse.json({ ok: false, reason: "store_error" }, { status: 502 });
  }
}
