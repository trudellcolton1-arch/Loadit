import { WORLD } from "../_lib/world";

/** robots.txt for loadit.world (middleware routes the host's /robots.txt here). */
export const dynamic = "force-static";

export function GET() {
  const body = ["User-agent: *", "Allow: /", "", `Sitemap: ${WORLD.url}/sitemap.xml`, `Host: ${WORLD.url}`, ""].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
