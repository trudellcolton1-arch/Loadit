import { NextRequest, NextResponse } from "next/server";
import { dataroomConfigured, dataroomRole, drQuery } from "@/lib/dataroom";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/dataroom/file/[id] — authorized view/download of one document.
 * Investor code or admin key required on EVERY fetch; the client sends it
 * as a header and turns the response into a blob, so codes never appear in
 * URLs or server logs.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!dataroomConfigured()) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }
  const role = dataroomRole(req.headers);
  if (!role) return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });

  const { id } = params;
  const [doc] = await drQuery<{ name: string; mime: string; content_b64: string }>(
    "select name, mime, content_b64 from dataroom_documents where id = $1",
    [id]
  );
  if (!doc) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });

  const bytes = Buffer.from(doc.content_b64, "base64");
  const safeName = doc.name.replace(/[^\w.\- ()]/g, "_");
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": doc.mime,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
