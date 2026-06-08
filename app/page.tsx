import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/sections/Problem";
import { RoutingEngine } from "@/components/sections/RoutingEngine";
import { RailArchitecture } from "@/components/sections/RailArchitecture";
import { Comparison } from "@/components/sections/Comparison";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FutureOfMoney } from "@/components/sections/FutureOfMoney";
import { AeroSimulator } from "@/components/sections/AeroSimulator";
import { AeroLiveMind } from "@/components/sections/AeroLiveMind";
import { TemporalVault } from "@/components/sections/TemporalVault";
import { EnergyRail } from "@/components/sections/EnergyRail";
import { OfflineMode } from "@/components/sections/OfflineMode";
import { ProgrammableValue } from "@/components/sections/ProgrammableValue";
import { Agents } from "@/components/sections/Agents";
import { ApiPlayground } from "@/components/sections/ApiPlayground";
import { AskAero } from "@/components/sections/AskAero";
import { Security } from "@/components/sections/Security";
import { NetworkStatus } from "@/components/sections/NetworkStatus";
import { Patents } from "@/components/sections/Patents";
import { Roadmap } from "@/components/sections/Roadmap";
import { Investors } from "@/components/sections/Investors";
import { Faq } from "@/components/sections/Faq";
import { Access } from "@/components/sections/Access";
import { Footer } from "@/components/Footer";

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
