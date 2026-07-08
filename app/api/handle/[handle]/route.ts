import { NextResponse } from "next/server";
import { handleByName, hylaqConfigured } from "@/lib/hylaqDb";
import { limit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Resolve a public Hylaq @handle → its profile + receive addresses.
 *
 * This is the "pay @handle" / profile-lookup primitive: given @colt, return
 * where value should land. Receive addresses are public by design; sensitive
 * columns are never read (see lib/hylaqDb).
 */
export async function GET(req: Request, { params }: { params: { handle: string } }) {
  // Throttle bulk enumeration of the handle→addresses namespace.
  const limited = limit(req, "handle", 40);
  if (limited) return limited;
  if (!hylaqConfigured()) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }
  const name = decodeURIComponent(params.handle || "").replace(/^@/, "").trim();
  if (!name || !/^[a-zA-Z0-9_.-]{1,40}$/.test(name)) {
    return NextResponse.json({ ok: false, reason: "invalid_handle" }, { status: 422 });
  }
  try {
    const profile = await handleByName(name);
    if (!profile) {
      return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, profile });
  } catch (e) {
    console.error("[handle] lookup failed:", String(e));
    return NextResponse.json({ ok: false, reason: "lookup_failed" }, { status: 502 });
  }
}
