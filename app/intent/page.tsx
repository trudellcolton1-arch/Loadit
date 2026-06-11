import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { IntentRouter } from "@/components/sections/IntentRouter";

export const metadata: Metadata = {
  title: "AI Intent Router — Just Say It",
  description:
    "Tell AERO what you want to do with your money in plain language. The AI understands, finds the cheapest real route across 14+ networks, and explains it. The first payment rail you can talk to.",
  alternates: { canonical: "/intent" },
};

export default function IntentPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <IntentRouter />
      </main>
      <Footer />
    </>
  );
}
