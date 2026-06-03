import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/sections/Problem";
import { RoutingEngine } from "@/components/sections/RoutingEngine";
import { RailArchitecture } from "@/components/sections/RailArchitecture";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FutureOfMoney } from "@/components/sections/FutureOfMoney";
import { LiveDemo } from "@/components/sections/LiveDemo";
import { Security } from "@/components/sections/Security";
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
        <HowItWorks />
        <FutureOfMoney />
        <LiveDemo />
        <Security />
        <Roadmap />
        <Investors />
        <Faq />
        <Access />
      </main>
      <Footer />
    </>
  );
}
