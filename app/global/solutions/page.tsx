import type { Metadata } from "next";
import { PageShell } from "../_components/PageShell";
import { WhoFor } from "../_components/WhoFor";
import { GpsComparison } from "../_components/GpsComparison";
import { FinalCta } from "../_components/FinalCta";

export const metadata: Metadata = {
  title: "Solutions",
  description: "Fintechs, wallets, merchant platforms, remittance, marketplaces, financial institutions, and AI agents — one routing layer for many business models.",
  alternates: { canonical: "/solutions" },
};

export default function SolutionsPage() {
  return (
    <PageShell
      eyebrow="Solutions"
      title="One routing layer. Built for many business models."
      lede="Whatever your product is, the integration is the same: state what value is coming in and what needs to come out. Loadit handles the supported route between them."
    >
      <WhoFor full />
      <GpsComparison />
      <FinalCta />
    </PageShell>
  );
}
