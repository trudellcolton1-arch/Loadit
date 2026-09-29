import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P } from "../../_components/PageShell";
import { AccessForm } from "../../_components/AccessForm";

export const metadata: Metadata = {
  title: "Sandbox",
  description: "The Loadit Global sandbox opens with early access. Join the list.",
  alternates: { canonical: "/developers/sandbox" },
};

export default function Sandbox() {
  return (
    <PageShell eyebrow="Sandbox" title="Opens with early access." lede="A sandbox environment — real routing engine, no value movement — will be the first thing early-access partners receive. It is not open yet." status="COMING SOON">
      <Prose>
        <div>
          <H3 id="what">What it will be</H3>
          <P>The same routing engine and fee feeds the product uses, behind a partner key. It returns the route the engine would select and never moves value.</P>
          <H3 id="not">What it will not be</H3>
          <P>A settlement environment. Transactions, intake, and payout are part of the production build and follow separately.</P>
          <H3 id="join">Get in first</H3>
          <div className="mt-4 max-w-xl"><AccessForm source="sandbox" cta="Join the early-access list" /></div>
        </div>
        <Aside title="Developers" items={[{ label: "Quickstart (preview)", href: "/developers/quickstart" }, { label: "API Reference (preview)", href: "/developers/api" }, { label: "Early access", href: "/access" }]} />
      </Prose>
    </PageShell>
  );
}
