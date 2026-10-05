import { INFO } from "../_lib/content";

/** sitemap.xml for loadit.info — a single canonical page. */
export const dynamic = "force-static";

export function GET() {
  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${INFO.url}/</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>1</priority></url>
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
