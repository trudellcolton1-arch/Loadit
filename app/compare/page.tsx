import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AffiliateRouter } from "@/components/sections/AffiliateRouter";

export const metadata: Metadata = {
  title: "Cheapest Way to Move Money & Buy Crypto",
  description:
    "Compare the real cost of moving money. AERO scores every network and on-ramp in real time, shows your exact savings, and routes you to the best provider to finish the job.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <AffiliateRouter />
      </main>
      <Footer />
    </>
  );
}
