import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/sections/Problem";
import { RoutingEngine } from "@/components/sections/RoutingEngine";
import { RailArchitecture } from "@/components/sections/RailArchitecture";
import { Comparison } from "@/components/sections/Comparison";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FutureOfMoney } from "@/components/sections/FutureOfMoney";
import { AeroSimulator } from "@/components/sections/AeroSimulator";
import { Security } from "@/components/sections/Security";
import { Patents } from "@/components/sections/Patents";
import { Roadmap } from "@/components/sections/Roadmap";
import { Investors } from "@/components/sections/Investors";
import { Faq } from "@/components/sections/Faq";
import { Access } from "@/components/sections/Access";
import { Footer } from "@/components/Footer";

// Heavy, below-the-fold sections are code-split (still server-rendered for SEO)
// so they don't weigh down the initial route bundle. Sized skeletons avoid CLS.
function skeleton(h: string) {
  const SectionSkeleton = () => <div className={h} aria-hidden />;
  SectionSkeleton.displayName = "SectionSkeleton";
  return SectionSkeleton;
}
const AeroLiveMind = dynamic(
  () => import("@/components/sections/AeroLiveMind").then((m) => m.AeroLiveMind),
  { loading: skeleton("min-h-[680px]") }
);
const TemporalVault = dynamic(
  () => import("@/components/sections/TemporalVault").then((m) => m.TemporalVault),
  { loading: skeleton("min-h-[680px]") }
);
const EnergyRail = dynamic(
  () => import("@/components/sections/EnergyRail").then((m) => m.EnergyRail),
  { loading: skeleton("min-h-[640px]") }
);
const OfflineMode = dynamic(
  () => import("@/components/sections/OfflineMode").then((m) => m.OfflineMode),
  { loading: skeleton("min-h-[560px]") }
);
const ProgrammableValue = dynamic(
  () => import("@/components/sections/ProgrammableValue").then((m) => m.ProgrammableValue),
  { loading: skeleton("min-h-[520px]") }
);
const Agents = dynamic(
  () => import("@/components/sections/Agents").then((m) => m.Agents),
  { loading: skeleton("min-h-[520px]") }
);
const ApiPlayground = dynamic(
  () => import("@/components/sections/ApiPlayground").then((m) => m.ApiPlayground),
  { loading: skeleton("min-h-[560px]") }
);
const AskAero = dynamic(
  () => import("@/components/sections/AskAero").then((m) => m.AskAero),
  { loading: skeleton("min-h-[640px]") }
);
const NetworkStatus = dynamic(
  () => import("@/components/sections/NetworkStatus").then((m) => m.NetworkStatus),
  { loading: skeleton("min-h-[560px]") }
);

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <RoutingEngine />
        <RailArchitecture />
        <Comparison />
        <HowItWorks />
        <FutureOfMoney />
        <AeroSimulator />
        <AeroLiveMind />
        <TemporalVault />
        <EnergyRail />
        <OfflineMode />
        <ProgrammableValue />
        <Agents />
        <ApiPlayground />
        <AskAero />
        <Security />
        <NetworkStatus />
        <Patents />
        <Roadmap />
        <Investors />
        <Faq />
        <Access />
      </main>
      <Footer />
    </>
  );
}
