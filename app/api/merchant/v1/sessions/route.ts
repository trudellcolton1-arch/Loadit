import { NextResponse } from "next/server";
import { verifyMerchantKey } from "@/lib/merchant/keys";
import { validateCreateSession } from "@/lib/merchant/session";
import { createSession, merchantView } from "@/lib/merchant/payments";
import { merchantStoreConfigured } from "@/lib/merchant/store";
import { rateLimited } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * MERCHANT CHECKOUT — create a session.
 *
 * POST /api/merchant/v1/sessions  (auth: x-api-key — a merchant `lk_…` key)
 *   { amount_usd, order_id, item: { name, sku?, image_url? },
 *     success_url, cancel_url, webhook_url?, metadata?, expires_in_minutes? }
 *   → { ok, replayed, session } where session.url is the hosted Loadit
 *     checkout the buyer pays USDC on.
 *
 * Idempotent per (merchant, order_id): retrying a create for the same order
 * returns the original session with replayed: true — a retry can never open
 * two payment requests for one order.
 *
 * CORS is open so a static storefront CAN call this from the browser, but the
 * recommended integration keeps the API key server-side (see docs/merchant-api.md).
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  const merchant = verifyMerchantKey(req.headers.get("x-api-key") || "");
  if (!merchant) {
    return json(
      { ok: false, reason: "invalid_api_key", message: "Provide a valid merchant API key via the x-api-key header." },
      401
    );
  }
  if (rateLimited(`merchant-create:${merchant.kid}`, 120)) {
    return json({ ok: false, reason: "rate_limited" }, 429);
  }
  if (!merchantStoreConfigured()) {
    return json({ ok: false, reason: "not_configured", message: "Merchant checkout is not configured on this deployment." }, 503);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, reason: "bad_request", message: "Body must be JSON." }, 400);
  }

  // http://localhost redirect/webhook URLs are allowed in test mode only.
  const v = validateCreateSession(body, { allowHttpLocalhost: merchant.mode === "test" });
  if (!v.ok) return json({ ok: false, reason: v.reason, message: v.message }, 422);

  try {
    const { session, replayed } = await createSession(merchant, v.input);
    return json({ ok: true, replayed, session: merchantView(session) }, replayed ? 200 : 201);
  } catch {
    return json({ ok: false, reason: "store_error", message: "Could not create the session. Try again." }, 502);
  }
}
