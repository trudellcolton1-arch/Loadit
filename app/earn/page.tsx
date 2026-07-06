import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RebateEngine } from "@/components/sections/RebateEngine";

export const metadata: Metadata = {
  title: "Get Paid to Move Money",
  description:
    "Loadit Rewards — HQ routes every transfer the cheapest way and pays a share of the savings back to you. The first payment rail that earns you money.",
  alternates: { canonical: "/earn" },
};

export default function EarnPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <RebateEngine />
      </main>
      <Footer />
    </>
  );
}
