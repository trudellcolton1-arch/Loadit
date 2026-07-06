import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SettlementEstimator } from "@/components/tools/SettlementEstimator";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Settlement Time Estimator",
  description:
    "Free tool: predict how long a payment takes to settle across Bitcoin, Ethereum, Solana, Lightning, and banks versus Loadit's AI-routed path.",
  alternates: { canonical: "/tools/settlement-estimator" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Settlement Time Estimator",
  url: `${SITE.url}/tools/settlement-estimator`,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "Predict settlement/finality times across blockchains, the Lightning Network, and banks, and compare to Loadit's AI-routed path.",
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
            Settlement time estimator
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-white/60">
            Different rails settle at wildly different speeds. Pick the asset you want to receive and see how long each
            path takes — and which one Loadit&apos;s AI router would choose.
          </p>

          <div className="mt-10">
            <SettlementEstimator />
          </div>

          <div className="mt-10 article">
            <h2>Why settlement speed varies so much</h2>
            <p>
              &ldquo;Settlement&rdquo; is when a payment becomes final. The Lightning Network and high-throughput chains
              like Solana reach finality in about a second; Ethereum L1 takes minutes and spikes with congestion; Bitcoin
              on-chain waits for confirmations; bank ACH takes 1–3 business days. The fastest path for a given asset
              changes with network conditions.
            </p>
            <p>
              Loadit&apos;s <a href="/learn/ai-powered-financial-routing">HQ engine</a> evaluates the viable paths for
              each transaction and routes over the fastest one automatically. Curious about the cost side? Use the{" "}
              <a href="/tools/cost-calculator">transaction cost calculator</a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
