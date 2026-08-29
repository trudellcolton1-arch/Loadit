import { NextResponse } from "next/server";
import { authorizeRailOwner } from "@/lib/rail/ownerGate";
import { handleRailAction, type RailActionRequest } from "@/lib/rail/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/rail — the Loadit app's rail runtime endpoint.
 *
 * OWNER-GATED ON THE SERVER: every call must carry a Hylaq access token that
 * resolves (via Hylaq's token store / userinfo — see lib/rail/ownerGate.ts)
 * to the rail owner's email. UI gating in the app is cosmetic; THIS is the
 * enforcement. Unauthorized callers get 401/403 and no machine state.
 *
 * CORS is open because the caller is the Loadit app (native fetch has no
 * origin; Expo web dev runs on another port) — authentication is the bearer
 * token, never the origin.
 */

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  const auth = await authorizeRailOwner(req);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, reason: auth.reason },
      { status: auth.status, headers: CORS_HEADERS }
    );
  }

  let body: RailActionRequest;
  try {
    body = (await req.json()) as RailActionRequest;
  } catch {
    body = {};
  }

  const result = await handleRailAction(body);
  return NextResponse.json(result.payload, { status: result.status, headers: CORS_HEADERS });
}
