import { NextResponse } from "next/server";
import { stellarNetwork } from "@/lib/anchor";

export const dynamic = "force-dynamic";

/** Web app manifest scoped to the wallet, so installing from /app launches the wallet, not the marketing site. */
export function GET() {
  const test = stellarNetwork() === "testnet";
  const manifest = {
    id: "/app",
    name: test ? "Loadit (test mode)" : "Loadit",
    short_name: "Loadit",
    description: "Load cash into USDC you control. Non-custodial wallet with cash-in and cash-out at a licensed cash network.",
    start_url: "/app",
    scope: "/app",
    display: "standalone",
    orientation: "portrait",
    background_color: "#04060B",
    theme_color: "#04060B",
    categories: ["finance"],
    icons: [
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=300" },
  });
}
