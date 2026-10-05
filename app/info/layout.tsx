import type { Metadata, Viewport } from "next";
import { INFO } from "./_lib/content";
import { InfoNav } from "./_components/InfoNav";
import { InfoFooter } from "./_components/InfoFooter";
import { InfoJsonLd } from "./_components/InfoJsonLd";

/**
 * LOADIT.INFO — layout for the investor site served on loadit.info
 * (middleware rewrites the host to /info/*). Canonicals resolve to loadit.info;
 * copies at /info on other hosts carry X-Robots-Tag: noindex from middleware.
 */
export const metadata: Metadata = {
  metadataBase: new URL(INFO.url),
  title: { default: INFO.title, template: `%s | ${INFO.name}` },
  description: INFO.description,
  applicationName: INFO.name,
  authors: [{ name: INFO.company }],
  alternates: { canonical: "/" },
  openGraph: { title: INFO.title, description: INFO.description, url: INFO.url, siteName: INFO.name, type: "website" },
  twitter: { card: "summary_large_image", title: INFO.title, description: INFO.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#04060B", colorScheme: "dark", width: "device-width", initialScale: 1 };

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="info-site min-h-screen bg-void text-white antialiased">
      <style>{`
        [data-loadit-widget]{display:none !important}
        .info-site{scroll-behavior:smooth}
        .info-site :focus-visible{outline:2px solid #34D17A;outline-offset:3px;border-radius:6px}
        @media (prefers-reduced-motion: reduce){.info-site{scroll-behavior:auto}.info-site *{transition:none !important}}
      `}</style>
      <InfoJsonLd />
      <InfoNav />
      {children}
      <InfoFooter />
    </div>
  );
}
