import { GLOBAL, ROUTES } from "../_lib/site";

/** sitemap.xml for loaditglobal.com — every URL canonical to the Global domain. */
export const dynamic = "force-static";

export function GET() {
  const now = new Date().toISOString();
  const urls = ROUTES.map(
    (r) =>
      `  <url><loc>${GLOBAL.url}${r.path}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>${r.priority}</priority></url>`
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
