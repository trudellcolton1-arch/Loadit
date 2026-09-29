import type { Metadata } from "next";
import { GLOBAL } from "./_lib/site";
import { HeroRoute } from "./_components/HeroRoute";
import { RouteFinder } from "./_components/RouteFinder";
import { GpsComparison } from "./_components/GpsComparison";
import { Rerouting } from "./_components/Rerouting";
import { HowItWorks } from "./_components/HowItWorks";
import { Engine } from "./_components/Engine";
import { Capabilities } from "./_components/Capabilities";
import { DeveloperExperience } from "./_components/DeveloperExperience";
import { WhoFor } from "./_components/WhoFor";
import { ProductsGrid } from "./_components/ProductsGrid";
import { Labs } from "./_components/Labs";
import { GlobalNetwork } from "./_components/GlobalNetwork";
import { FinalCta } from "./_components/FinalCta";

export const metadata: Metadata = {
  title: { absolute: GLOBAL.title },
  description: GLOBAL.description,
  alternates: { canonical: "/" },
  openGraph: { title: GLOBAL.title, description: GLOBAL.description, url: GLOBAL.url },
};

/**
 * loaditglobal.com — the digital front door to the infrastructure company.
 * Built around one analogy, in this order: the analogy, the experience, the
 * comparison, the rerouting moment, then how it works, then the engine.
 */
export default function GlobalHome() {
  return (
    <main>
      <HeroRoute />
      <RouteFinder />
      <GpsComparison />
      <Rerouting />
      <HowItWorks />
      <Engine />
      <Capabilities />
      <DeveloperExperience />
      <WhoFor />
      <ProductsGrid />
      <Labs />
      <GlobalNetwork />
      <FinalCta />
    </main>
  );
}
