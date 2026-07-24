import { NextResponse } from "next/server";
import { limit } from "@/lib/ratelimit";
import { screenAddress, screeningConfigured } from "@/lib/screen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SANCTIONS SCREEN endpoint.
 *
 * POST { address } → { ok, checked, sanctioned, categories, identifications }.
 * The Chainalysis key stays server-side; the app only ever sees the verdict.
 * GET → configuration status (no secret), so the app can show whether
 * screening is live.
 */
export function GET() {
  return NextResponse.json({ configured: screeningConfigured(), vendor: "Chainalysis" });
}

export async function POST(req: Request) {
  const limited = limit(req, "screen", 60);
  if (limited) return limited;

  let body: { address?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const address = typeof body.address === "string" ? body.address.trim().slice(0, 120) : "";
  if (!address) {
    return NextResponse.json({ ok: false, reason: "invalid_params" }, { status: 422 });
  }

  const result = await screenAddress(address);
  return NextResponse.json({ ok: true, vendor: "Chainalysis", ...result });
}
