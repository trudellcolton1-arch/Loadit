import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CostCalculator } from "@/components/tools/CostCalculator";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Transaction Cost Calculator",
  description:
    "Free calculator: estimate what a payment costs across card processors, wires, and Loadit's 0.75% AI-routed rail — and see your savings instantly.",
  alternates: { canonical: "/tools/cost-calculator" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Transaction Cost Calculator",
  url: `${SITE.url}/tools/cost-calculator`,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "Estimate and compare transaction costs across card processors, bank wires, and Loadit's 0.75% AI-routed financial rail.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="px-5 pb-24 pt-24">
        <div className="mx-auto max-w-3xl">
          <Link href="/learn" className="text-sm text-white/50 transition-colors hover:text-rail">
            ← Learn
          </Link>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-rail/30 bg-rail/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rail-400">
            Free tool
          </div>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Transaction cost calculator
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-white/60">
            See what a payment actually costs on legacy rails versus Loadit&apos;s flat 0.75% AI-routed rail. Change the
            amount and method to estimate your fees and savings.
          </p>

          <div className="mt-10">
            <CostCalculator />
          </div>

          <div className="mt-10 article">
            <h2>How transaction costs add up</h2>
            <p>
              Every payment method bundles a percentage fee, a fixed fee, and often hidden costs like FX markups and
              multi-day settlement delays. Card processors typically charge around 2.9% + $0.30 and take 1–3 days to
              settle; international cards add FX markups; wires cost a flat ~$25. Loadit charges a flat{" "}
              <strong>0.75%</strong> and its <a href="/learn/ai-powered-financial-routing">HQ routing engine</a> sends
              the underlying settlement over the cheapest network available, cutting network fees by up to 86% while
              settling on-chain in seconds.
            </p>
            <p>
              Want to know how long those payments take to settle too? Try the{" "}
              <a href="/tools/settlement-estimator">settlement time estimator</a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
