import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Problem } from "@/components/sections/Problem";
import { RoutingEngine } from "@/components/sections/RoutingEngine";
import { RailArchitecture } from "@/components/sections/RailArchitecture";
import { Comparison } from "@/components/sections/Comparison";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FutureOfMoney } from "@/components/sections/FutureOfMoney";
import { AeroLiveMind } from "@/components/sections/AeroLiveMind";
import { ProgrammableValue } from "@/components/sections/ProgrammableValue";
import { AskAero } from "@/components/sections/AskAero";
import { Faq } from "@/components/sections/Faq";

export const metadata: Metadata = {
  title: "Platform — How the Loadit Rail Works",
  description:
    "How Loadit turns cash, cards, and fiat into stablecoins and crypto in seconds — the HQ routing engine, the unified rail architecture, and how it compares to legacy payments.",
  alternates: { canonical: "/platform" },
};

export default function PlatformPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <Problem />
        <RoutingEngine />
        <RailArchitecture />
        <Comparison />
        <HowItWorks />
        <FutureOfMoney />
        <AeroLiveMind />
        <ProgrammableValue />
        <AskAero />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
