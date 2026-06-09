import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TemporalExchange } from "@/components/sections/TemporalExchange";

export const metadata: Metadata = {
  title: "Temporal Exchange",
  description:
    "Trade the timing and conditions of settlement — rate locks, gas futures, and conditional releases on Loadit's patented temporal settlement rail. Live prices.",
  alternates: { canonical: "/exchange" },
};

export default function ExchangePage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <TemporalExchange />
      </main>
      <Footer />
    </>
  );
}
