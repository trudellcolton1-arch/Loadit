import { INFO } from "../_lib/content";

/** robots.txt for loadit.info (middleware routes the host's /robots.txt here). */
export const dynamic = "force-static";

export function GET() {
  const body = ["User-agent: *", "Allow: /", "", `Sitemap: ${INFO.url}/sitemap.xml`, `Host: ${INFO.url}`, ""].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
