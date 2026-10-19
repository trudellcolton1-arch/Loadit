import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/constants";
import { Hero } from "./_components/Hero";
import { Journey } from "./_components/Journey";
import { WhatIs, Survives, HowItWorks, BuiltFor, WhyItMatters, HistoryVsCollectible, TrustCoverage, Faq } from "./_components/Sections";
import { FinalCta } from "./_components/FinalCta";
import { Section, StatusTag } from "./_components/Bits";
import { SectionHeading } from "@/components/ui/SectionHeading";

const TITLE = "DollarDNA — Different assets. Connected history.";
const DESC =
  "DollarDNA is Loadit's framework for giving value a traceable history across Bitcoin, US dollars, stablecoins, and other supported assets: recorded transfers, conversions, context, and evidence — with coverage gaps shown honestly. In design; illustrative simulation.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/dollardna" },
  openGraph: { title: TITLE, description: DESC, url: `${SITE.url}/dollardna`, siteName: SITE.name, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: TITLE,
  url: `${SITE.url}/dollardna`,
  description: DESC,
  isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
  about: { "@type": "Thing", name: "DollarDNA", description: "An asset-agnostic provenance record model designed by Loadit, Inc. In design." },
};

export default function DollarDnaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="pt-16">
        <style>{`
          .dna-flow{stroke-dasharray:5 9;animation:dna-flow 1.8s linear infinite}
          @keyframes dna-flow{to{stroke-dashoffset:-28}}
          @media (prefers-reduced-motion: reduce){.dna-flow{animation:none}}
        `}</style>
        <Hero />
        <WhatIs />
        <Section id="journey">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Interactive cross-asset journey" title="Bitcoin → USD → USDC → a payment." description="Step through six recorded events. Inspect each parcel, the rate and fee applied, what was conserved, and what evidence supports each record. Everything is example data." />
            <StatusTag tag="illustrative" className="mb-2" />
          </div>
          <div className="mt-10"><Journey /></div>
        </Section>
        <Survives />
        <HowItWorks />
        <BuiltFor />
        <WhyItMatters />
        <HistoryVsCollectible />
        <TrustCoverage />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
