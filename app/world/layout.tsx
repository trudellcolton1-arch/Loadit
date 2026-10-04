import type { Metadata, Viewport } from "next";
import { WORLD } from "./_lib/world";
import { WorldNav } from "./_components/WorldNav";
import { WorldFooter } from "./_components/WorldFooter";
import { WorldJsonLd } from "./_components/WorldJsonLd";

/**
 * LOADIT.WORLD — layout for the vision site served on loadit.world
 * (middleware rewrites the host to /world/*). Its own metadataBase so every
 * canonical, OG url, and sitemap entry resolves to loadit.world.
 */
export const metadata: Metadata = {
  metadataBase: new URL(WORLD.url),
  title: { default: WORLD.title, template: `%s | ${WORLD.name}` },
  description: WORLD.description,
  applicationName: WORLD.name,
  manifest: "/manifest.webmanifest",
  keywords: [
    "Loadit",
    "financial routing layer",
    "money like the internet",
    "value interoperability",
    "cash to digital",
    "intelligent payment routing",
  ],
  authors: [{ name: WORLD.parent.name }],
  alternates: { canonical: "/" },
  openGraph: {
    title: WORLD.title,
    description: WORLD.description,
    url: WORLD.url,
    siteName: WORLD.name,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: WORLD.title, description: WORLD.description },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, title: WORLD.name, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#04060B",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function WorldLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="world-site min-h-screen bg-void text-white antialiased">
      <style>{`
        [data-loadit-widget]{display:none !important}
        .world-site{scroll-behavior:smooth}
        .world-site :focus-visible{outline:2px solid #34D17A;outline-offset:3px;border-radius:6px}
        .world-flow{stroke-dasharray:6 10;animation:world-flow 1.6s linear infinite}
        @keyframes world-flow{to{stroke-dashoffset:-32}}
        @media (prefers-reduced-motion: reduce){
          .world-site{scroll-behavior:auto}
          .world-flow{animation:none}
        }
      `}</style>
      <WorldJsonLd />
      <WorldNav />
      {children}
      <WorldFooter />
    </div>
  );
}
