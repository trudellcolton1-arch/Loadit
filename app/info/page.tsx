import type { Metadata } from "next";
import { INFO } from "./_lib/content";
import { Hero } from "./_components/Hero";
import { HowItWorks } from "./_components/HowItWorks";
import { Patent } from "./_components/Patent";
import { Products } from "./_components/Products";
import { Problem, MarketEntry, Progress, BusinessModel, Roadmap, Differentiation, Leadership, Faq } from "./_components/Sections";
import { Contact } from "./_components/Contact";

export const metadata: Metadata = {
  title: { absolute: INFO.title },
  description: INFO.description,
  alternates: { canonical: "/" },
  openGraph: { title: INFO.title, description: INFO.description, url: INFO.url },
};

/** loadit.info — one focused page; each section answers an investor question. */
export default function InvestorHome() {
  return (
    <main id="top">
      <Hero />
      <Problem />
      <HowItWorks />
      <Patent />
      <Products />
      <MarketEntry />
      <Progress />
      <BusinessModel />
      <Roadmap />
      <Differentiation />
      <Leadership />
      <Faq />
      <Contact />
    </main>
  );
}
