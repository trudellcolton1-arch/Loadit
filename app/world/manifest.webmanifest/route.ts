import { WORLD } from "../_lib/world";

/** Lightweight PWA manifest for loadit.world (installable; no service worker). */
export const dynamic = "force-static";

export function GET() {
  const manifest = {
    name: WORLD.name,
    short_name: "Loadit.world",
    description: WORLD.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#04060B",
    theme_color: "#04060B",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
  return new Response(JSON.stringify(manifest), { headers: { "Content-Type": "application/manifest+json; charset=utf-8" } });
}
