import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EnergyMarketplace } from "@/components/sections/EnergyMarketplace";

export const metadata: Metadata = {
  title: "Energy Marketplace",
  description:
    "A live two-sided market for kilowatt-hours — producers list real generation, anyone buys energy-backed value, priced off live power markets and settled against the grid.",
  alternates: { canonical: "/marketplace" },
};

export default function MarketplacePage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <EnergyMarketplace />
      </main>
      <Footer />
    </>
  );
}
