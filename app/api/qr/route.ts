import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * QR code generator for Loadit Cash QR (and anything else).
 * GET /api/qr?data=<url>&size=<px>  →  PNG
 * Used by the mobile app's Receive screen and the /pay flow.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const data = url.searchParams.get("data") || "";
  const size = Math.min(1024, Math.max(128, Number(url.searchParams.get("size")) || 512));
  if (!data || data.length > 1500) {
    return NextResponse.json({ ok: false, reason: "bad_data" }, { status: 422 });
  }
  try {
    const buf = await QRCode.toBuffer(data, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#04060B", light: "#FFFFFF" },
    });
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "qr_error" }, { status: 500 });
  }
}
