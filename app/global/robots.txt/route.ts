import { GLOBAL } from "../_lib/site";

/** robots.txt for loaditglobal.com (middleware routes the host's /robots.txt here). */
export const dynamic = "force-static";

export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /dashboard",
    "",
    `Sitemap: ${GLOBAL.url}/sitemap.xml`,
    `Host: ${GLOBAL.url}`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
