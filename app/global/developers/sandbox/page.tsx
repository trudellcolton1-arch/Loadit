import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P } from "../../_components/PageShell";
import { LiveDemo } from "../../_components/LiveDemo";
import { AccessForm } from "../../_components/AccessForm";

export const metadata: Metadata = {
  title: "Live demo",
  description: "Watch Loadit's real routing engine select a route. A demo of the technology — the platform is pre-launch and opens to early-access partners first.",
  alternates: { canonical: "/developers/sandbox" },
};

export default function Sandbox() {
  return (
    <PageShell
      eyebrow="Live demo"
      title="See the engine work."
      lede="A real request to Loadit's routing engine, from this page. It returns the route the engine would select — network, cost, time, confidence. It never moves value, and it isn't an open API: the platform is pre-launch."
      status="LIVE DEMO"
    >
      <Prose>
        <div>
          <LiveDemo />
          <H3 id="what">What you&apos;re looking at</H3>
          <P>The same routing engine and fee feeds the product uses, answering a real request. That is the technology — and it is running today.</P>
          <H3 id="not">What this is not</H3>
          <P>An integration. Keys, transactions, intake, and payout open to early-access partners first, provisioned by a person. Nothing here is a production quote.</P>
          <H3 id="join">Get in first</H3>
          <div className="mt-4 max-w-xl"><AccessForm source="sandbox" cta="Join the early-access list" /></div>
        </div>
        <Aside title="Developers" items={[{ label: "Quickstart (preview)", href: "/developers/quickstart" }, { label: "API Reference (preview)", href: "/developers/api" }, { label: "Early access", href: "/access" }]} />
      </Prose>
    </PageShell>
  );
}
