import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P } from "../../_components/PageShell";
import { LiveCall } from "../../_components/LiveCall";

export const metadata: Metadata = {
  title: "Sandbox",
  description: "Try the Loadit routing endpoint live with the demo key — real HQ output, rate-limited.",
  alternates: { canonical: "/developers/sandbox" },
};

export default function Sandbox() {
  return (
    <PageShell eyebrow="Sandbox" title="Try it. Right now." lede="A real request to the routing endpoint from your browser, with the public demo key. Output is live HQ routing; numbers are estimates." status="LIVE · SANDBOX">
      <Prose>
        <div>
          <LiveCall />
          <H3 id="scope">What the sandbox is</H3>
          <P>The same routing engine and the same live fee feeds the product uses, behind a rate-limited public key. It does not move value — it returns the route the engine would select.</P>
          <H3 id="not">What it is not</H3>
          <P>It is not a settlement environment. Transactions, intake, and payout are part of the production build and are provisioned with production keys.</P>
        </div>
        <Aside title="Developers" items={[{ label: "Quickstart", href: "/developers/quickstart" }, { label: "API Reference", href: "/developers/api" }, { label: "Request production access", href: "/access" }]} />
      </Prose>
    </PageShell>
  );
}
