import { NextResponse } from "next/server";
import { getMergedFees } from "@/lib/liveFees";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live network fees, derived from on-chain gas + ETH price (see lib/liveFees).
 * Clients fetch this and pass `fees` into computeRoute() as feeOverrides so the
 * UI quotes live economics. Falls back to static estimates per network.
 */
export async function GET() {
  const data = await getMergedFees();
  return NextResponse.json(
    { ok: true, ...data, ts: Date.now() },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}
