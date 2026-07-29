import { NextResponse } from "next/server";
import { hylaqQuery, hylaqConfigured } from "@/lib/hylaqDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * HQ CONTENT DEBUG — read-only introspection to diagnose why /p/<slug> pages
 * 404 (is hq_content_page in this Neon? how are rows tagged?). Token-gated
 * (RISK_EVENTS_TOKEN). Temporary: remove once the content engine is verified.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!process.env.RISK_EVENTS_TOKEN || token !== process.env.RISK_EVENTS_TOKEN) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }
  if (!hylaqConfigured()) return NextResponse.json({ ok: false, reason: "db_not_configured" });

  const out: Record<string, unknown> = { ok: true };
  try {
    const t = await hylaqQuery(`select to_regclass('hq_content_page') as t`);
    out.tableExists = Boolean(t[0]?.t);
  } catch (e) {
    out.tableExists = `error: ${String(e).slice(0, 160)}`;
  }
  if (out.tableExists === true) {
    try {
      out.byDomainStatus = await hylaqQuery(
        `select domain, status, count(*)::int as n from hq_content_page group by 1,2 order by 3 desc limit 20`
      );
      out.recent = await hylaqQuery(
        `select slug, domain, status, published_at from hq_content_page order by published_at desc nulls last limit 10`
      );
    } catch (e) {
      out.queryError = String(e).slice(0, 200);
    }
  }
  return NextResponse.json(out);
}
