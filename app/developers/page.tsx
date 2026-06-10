import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ApiDocs } from "@/components/sections/ApiDocs";
import { ApiPlayground } from "@/components/sections/ApiPlayground";

export const metadata: Metadata = {
  title: "AERO Routing API for Developers",
  description:
    "Integrate Loadit's patented AERO routing engine in one HTTP call. Get the cheapest, fastest non-custodial settlement route as JSON. Live playground, docs, and pricing.",
  alternates: { canonical: "/developers" },
};

export default function DevelopersPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <ApiPlayground />
        <ApiDocs />
      </main>
      <Footer />
    </>
  );
}
