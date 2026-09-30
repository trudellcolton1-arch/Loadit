import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { SITE } from "@/lib/constants";

/**
 * One deployment, several front doors — the web app manifest is chosen by host.
 * loaditglobal.com (+ its subdomains) gets Loadit Global copy; every other host
 * (loadit.net, load.money, load.club) keeps the consumer manifest unchanged.
 */
export default function manifest(): MetadataRoute.Manifest {
  const host = (headers().get("host") || "").toLowerCase().split(":")[0];
  const isGlobal = host === "loaditglobal.com" || host.endsWith(".loaditglobal.com");

  const name = isGlobal ? "Loadit Global — GPS for money" : `${SITE.name} — ${SITE.tagline}`;
  const short_name = isGlobal ? "Loadit Global" : SITE.name;
  const description = isGlobal
    ? "Loadit Global is enterprise and developer routing infrastructure for value movement — GPS for money. Pre-launch."
    : SITE.description;

  return {
    name,
    short_name,
    description,
    start_url: "/",
    display: "standalone",
    background_color: "#04060B",
    theme_color: "#04060B",
    icons: [
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
