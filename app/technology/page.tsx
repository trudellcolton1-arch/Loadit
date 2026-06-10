import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TemporalVault } from "@/components/sections/TemporalVault";
import { EnergyRail } from "@/components/sections/EnergyRail";
import { OfflineMode } from "@/components/sections/OfflineMode";
import { Agents } from "@/components/sections/Agents";
import { MultiReality } from "@/components/sections/MultiReality";
import { SelfHealing } from "@/components/sections/SelfHealing";
import { Security } from "@/components/sections/Security";
import { NetworkStatus } from "@/components/sections/NetworkStatus";
import { Roadmap } from "@/components/sections/Roadmap";

export const metadata: Metadata = {
  title: "Technology — The Patented Loadit Architecture",
  description:
    "The advanced subsystems behind Loadit's patent-pending unified rail: temporal settlement, energy rails, offline mode, autonomous agents, multi-reality input, self-healing, security, and live network status.",
  alternates: { canonical: "/technology" },
};

export default function TechnologyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <TemporalVault />
        <EnergyRail />
        <OfflineMode />
        <Agents />
        <MultiReality />
        <SelfHealing />
        <Security />
        <NetworkStatus />
        <Roadmap />
      </main>
      <Footer />
    </>
  );
}
