import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EnergyDesk } from "@/components/sections/EnergyDesk";

export const metadata: Metadata = {
  title: "Energy-Backed Money",
  description:
    "Mint value backed by real kilowatt-hours, priced off live power markets and settled against the live grid — the first currency collateralized by electricity.",
  alternates: { canonical: "/energy" },
};

export default function EnergyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <EnergyDesk />
      </main>
      <Footer />
    </>
  );
}
