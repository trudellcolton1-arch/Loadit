import type { Metadata } from "next";
import { PageShell } from "../_components/PageShell";
import { ProductsGrid } from "../_components/ProductsGrid";
import { Engine } from "../_components/Engine";
import { FinalCta } from "../_components/FinalCta";

export const metadata: Metadata = {
  title: "Products",
  description: "Loadit Global API, UVCE, intelligent routing, settlement, compliance, identity, and resilience — every layer of the route, with its status.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <PageShell
      eyebrow="Products"
      title="Every layer of the route."
      lede="One integration exposes the whole stack. Each layer carries an honest status: running in the live demo today, patent-pending design, or in build for production. The customer-facing actions built on these layers — Load, Send, Connect, Convert, Receive, Cash Out, Loadit One — are on the embedded capabilities page."
    >
      <ProductsGrid full />
      <Engine />
      <FinalCta />
    </PageShell>
  );
}
