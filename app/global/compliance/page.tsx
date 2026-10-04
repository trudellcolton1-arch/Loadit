import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P } from "../_components/PageShell";
import { StatusTag } from "../_components/Bits";

export const metadata: Metadata = {
  title: "Compliance",
  description: "How the Loadit model is structured for compliance: non-custodial orchestration, licensed partners on every rail, and jurisdiction-aware routing.",
  alternates: { canonical: "/compliance" },
};

export default function CompliancePage() {
  return (
    <PageShell eyebrow="Compliance" title="Compliance is a routing dimension, not an afterthought." lede="Loadit does not claim licenses it does not hold. The model is built so the regulated act on each rail is performed by the party licensed to perform it.">
      <Prose>
        <div>
          <H3 id="model">The model</H3>
          <P><b className="text-white">Non-custodial.</b> Loadit never holds customer funds or keys. It routes and orchestrates; licensed partners execute.</P>
          <P><b className="text-white">Card and bank rails.</b> Purchases will be completed by licensed card and bank partners directly to a destination the customer controls. Those partners carry the money-transmission and KYC obligations for the purchase they execute.</P>
          <P><b className="text-white">Cash rail.</b> The licensed money transmitter performs identity verification at the retail counter and executes the cash-to-USDC conversion; Loadit orchestrates routing and delivery only. Certification with a licensed national cash network is complete (5/5); cash-in is not yet live.</P>
          <P><b className="text-white">Routing.</b> Compliance is scored on every candidate route alongside cost, speed, liquidity, and risk. A route that fails compliance is not selected.</P>

          <H3 id="claims">What we do not claim</H3>
          <div className="mt-4 grid gap-3">
            {[
              ["Money transmitter licenses", "Loadit Inc. does not hold money transmitter licenses. The licensed party on each rail performs the regulated act."],
              ["Regulatory approvals", "No regulatory approval of the Loadit platform is claimed."],
              ["Legal opinions", "Formal opinions and state-by-state analysis are in preparation and will be available to enterprise customers under NDA."],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3.5">
                <div className="max-w-xl"><div className="text-sm text-white/85">{k}</div><div className="text-xs text-white/45">{v}</div></div>
                <StatusTag status="PLANNED" />
              </div>
            ))}
          </div>

          <H3 id="availability">Faster availability and who takes the risk</H3>
          <P>
            Loadit cannot tell a bank that uncleared money is cleared, and it will not. Faster availability exists only
            where an approved partner or facility provides value before the original funding source is final — a
            prefunded settlement pool, a credit facility, or a guarantee, with explicit risk ownership, transaction
            limits, and fraud controls. HQ can decide whether that faster path is eligible; the contract decides who
            absorbs a failed incoming payment.
          </P>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3.5">
            <StatusTag status="PLANNED" />
            <span className="text-sm text-white/60">No &ldquo;instant finality&rdquo; is promised until the facility and the contractual risk allocation are actually live.</span>
          </div>

          <H3 id="honesty">Honesty policy</H3>
          <P>Every capability on this site carries a status label. Illustrative visualizations are labeled illustrative. Planned endpoints are labeled planned. Estimates are called estimates. Enterprise diligence materials are available under NDA on request.</P>
        </div>
        <Aside title="Trust" items={[{ label: "Security", href: "/security" }, { label: "Privacy", href: "/privacy" }, { label: "Contact", href: "/contact" }]} />
      </Prose>
    </PageShell>
  );
}
