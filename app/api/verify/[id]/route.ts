import { NextResponse } from "next/server";
import { getReceipt } from "@/lib/quantum";
import { limit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Raw verification material for a quantum receipt: the exact signed payload,
 * the ML-DSA-65 signature, and Loadit's public key — everything needed to
 * verify independently with any FIPS 204 implementation.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const limited = limit(req, "verify", 60);
  if (limited) return limited;

  const r = await getReceipt(params.id);
  if (!r) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    id: r.id,
    valid: r.valid,
    alg: "ML-DSA-65",
    payload: r.payload,
    signatureB64: r.sigB64,
    publicKeyB64: r.pubkeyB64,
    verify_hint:
      "ml_dsa65.verify(base64decode(signatureB64), utf8bytes(JSON.stringify(payload)), base64decode(publicKeyB64)) — e.g. @noble/post-quantum",
  });
}
