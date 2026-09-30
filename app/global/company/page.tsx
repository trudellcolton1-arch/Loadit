import type { Metadata } from "next";
import { PageShell } from "../_components/PageShell";
import { Section, Kicker, H2, Lede, Cta } from "../_components/Bits";
import { Labs } from "../_components/Labs";
import { Roadmap } from "../_components/Roadmap";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Company",
  description: "Loadit Inc. — a Delaware corporation building the routing and orchestration layer for value movement. GPS for money.",
  alternates: { canonical: "/company" },
};

const FACTS = [
  ["Entity", "Loadit Inc., Delaware C corporation"],
  ["Founded", "August 2025"],
  ["Colton Trudell", "CEO, Founder & Chairman"],
  ["Location", "Mansfield, Texas"],
  ["Intellectual property", "Unified Financial Rail — patent pending (application filed; no patent granted)"],
  ["Model", "Non-custodial infrastructure. Loadit routes and orchestrates; it never holds customer funds."],
  ["Consumer brand", "Loadit (loadit.net) — the same rail, for people"],
];

export default function CompanyPage() {
  return (
    <PageShell eyebrow="Company" title="The internet routes information. Loadit routes value." lede="Earlier infrastructure companies abstracted payment acceptance, bank connectivity and messaging. Loadit is building the abstraction and routing layer for value movement.">
      <Section tight>
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <Kicker>Why we exist</Kicker>
            <H2>Your application shouldn&apos;t need to understand every rail underneath it.</H2>
            <Lede>
              Financial infrastructure is fragmented by design — card networks, bank rails, a dozen
              blockchains, liquidity venues, and a different rulebook in every jurisdiction. Every
              company integrating them rebuilds the same routing logic, badly, under deadline.
            </Lede>
            <Lede className="mt-4">
              We think value should work like navigation. State where it is and where it needs to
              go; let an intelligent layer find the supported route and adapt when the road changes.
            </Lede>
            <Lede className="mt-4">
              The destination we are building toward: any form of money a customer has, converted or
              routed into any form the other side needs — every currency on earth, over every supported
              rail — through one interface. Opened one corridor at a time, each with its real status.
            </Lede>
            <div className="mt-8 flex flex-wrap gap-3">
              <Cta href="/contact">Talk to Loadit</Cta>
              <Cta href="https://loadit.net" variant="secondary">Loadit for people →</Cta>
            </div>
          </div>
          <Reveal>
            <dl className="divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              {FACTS.map(([k, v]) => (
                <div key={k} className="grid gap-1 px-5 py-4 sm:grid-cols-[150px_1fr]">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</dt>
                  <dd className="text-sm text-white/80">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </Section>
      <Roadmap />
      <Labs />
    </PageShell>
  );
}
