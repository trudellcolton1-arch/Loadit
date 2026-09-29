import type { Metadata } from "next";
import { GLOBAL } from "./_lib/site";
import { GlobalNav } from "./_components/GlobalNav";
import { GlobalFooter } from "./_components/GlobalFooter";
import { GlobalJsonLd } from "./_components/GlobalJsonLd";

/**
 * LOADIT GLOBAL — layout for the enterprise / developer site served on
 * loaditglobal.com (middleware rewrites the host to /global/*).
 *
 * Independent metadata: its own metadataBase so every canonical, OG url, and
 * sitemap entry resolves to loaditglobal.com — never to loadit.net.
 */
export const metadata: Metadata = {
  metadataBase: new URL(GLOBAL.url),
  title: {
    default: GLOBAL.title,
    template: `%s | ${GLOBAL.name}`,
  },
  description: GLOBAL.description,
  applicationName: GLOBAL.name,
  keywords: [
    "value routing infrastructure",
    "payment orchestration API",
    "stablecoin settlement API",
    "cash to digital value",
    "financial infrastructure",
    "Loadit Global",
  ],
  authors: [{ name: GLOBAL.parent.name }],
  alternates: { canonical: "/" },
  openGraph: {
    title: GLOBAL.title,
    description: GLOBAL.description,
    url: GLOBAL.url,
    siteName: GLOBAL.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: GLOBAL.title,
    description: GLOBAL.description,
  },
  robots: { index: true, follow: true },
};

export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="global-site min-h-screen bg-void text-white">
      {/* The consumer chat widget belongs to loadit.net; keep this site clean. */}
      <style>{`[data-loadit-widget]{display:none !important}`}</style>
      <GlobalJsonLd />
      <GlobalNav />
      {children}
      <GlobalFooter />
    </div>
  );
}
