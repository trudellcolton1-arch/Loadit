import type { Metadata } from "next";
import { PageShell } from "../_components/PageShell";
import { WhoFor } from "../_components/WhoFor";
import { Segments } from "../_components/Segments";
import { GpsComparison } from "../_components/GpsComparison";
import { FinalCta } from "../_components/FinalCta";

export const metadata: Metadata = {
  title: "Solutions",
  description: "Banks, exchanges, wallets, fintechs, payroll and payout platforms, remittance, merchant platforms, and AI agents — what problem each has today that Loadit fixes, and when not to use it.",
  alternates: { canonical: "/solutions" },
};

export default function SolutionsPage() {
  return (
    <PageShell
      eyebrow="Solutions"
      title="One routing layer. Built for many business models."
      lede="Whatever your product is, the integration is the same: state what value is coming in and what needs to come out. Loadit handles the supported route between them — and stays out of the transactions you already do well."
    >
      <WhoFor full />
      <Segments />
      <GpsComparison />
      <FinalCta />
    </PageShell>
  );
}
