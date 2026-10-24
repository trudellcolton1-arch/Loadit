import { NextResponse } from "next/server";
import { verifyMerchantKey } from "@/lib/merchant/keys";
import { isValidSessionId } from "@/lib/merchant/session";
import { merchantView, syncSession } from "@/lib/merchant/payments";
import { getSession, merchantStoreConfigured } from "@/lib/merchant/store";
import { rateLimited } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * MERCHANT CHECKOUT — session status.
 *
 * GET /api/merchant/v1/sessions/:id  (auth: x-api-key)
 * Lazily brings the session up to date: expires it if past its deadline, and
 * verifies settlement on-chain while it's pending — so merchants that poll
 * this endpoint get authoritative state even if a webhook delivery is missed
 * or the buyer never returned to the checkout page.
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const merchant = verifyMerchantKey(req.headers.get("x-api-key") || "");
  if (!merchant) {
    return json({ ok: false, reason: "invalid_api_key" }, 401);
  }
  if (rateLimited(`merchant-status:${merchant.kid}`, 240)) {
    return json({ ok: false, reason: "rate_limited" }, 429);
  }
  if (!merchantStoreConfigured()) {
    return json({ ok: false, reason: "not_configured" }, 503);
  }
  if (!isValidSessionId(params.id)) {
    return json({ ok: false, reason: "not_found" }, 404);
  }

  try {
    let session = await getSession(params.id);
    // A session belongs to exactly one merchant key — 404, never 403, so the
    // endpoint doesn't confirm foreign session ids exist.
    if (!session || session.merchantKid !== merchant.kid) {
      return json({ ok: false, reason: "not_found" }, 404);
    }
    session = await syncSession(session, { verify: true });
    return json({ ok: true, session: merchantView(session) });
  } catch {
    return json({ ok: false, reason: "store_error" }, 502);
  }
}
