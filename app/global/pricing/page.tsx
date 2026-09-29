import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P } from "../_components/PageShell";
import { StatusTag, Cta } from "../_components/Bits";
import { ECONOMICS } from "../_lib/site";
import { AccessForm } from "../_components/AccessForm";

export const metadata: Metadata = {
  title: "Pricing & economics",
  description:
    "How Loadit makes money: disclosed transaction fees, contracted partner revenue share, conversion economics, API and enterprise pricing, and card-program economics — defined route by route and product by product.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <PageShell
      eyebrow="Pricing & economics"
      title="Disclosed, route by route."
      lede="Loadit earns only through disclosed transaction economics and signed commercial arrangements. The exact model is defined for each route and each product — never hidden inside a spread, never a fee for standing in the way."
      status="COMING SOON"
    >
      <Prose>
        <div>
          <H3 id="how">How Loadit makes money</H3>
          <div className="mt-4 grid gap-3">
            {ECONOMICS.map((e) => (
              <div key={e.name} className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-white">{e.name}</div>
                  <StatusTag status={e.status} />
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{e.body}</p>
              </div>
            ))}
          </div>

          <H3 id="principle">The principle</H3>
          <P>
            Loadit is better or cheaper only when it removes real steps, combines actions, unlocks useful
            destinations, reduces integration work, improves route economics, or makes an outcome possible
            that the customer or provider does not already have. When a direct provider already does the
            exact job better, Loadit should not add itself just to add a fee.
          </P>
          <P>
            Every live route comes with a transaction-level money map: who accepts the funding, who is
            custodian if anyone, who converts, which rail moves each leg, who bears fraud and settlement
            risk, what partner and network fees apply, and what Loadit earns. Partners receive it in writing
            for their corridor.
          </P>

          <H3 id="today">What you can see today</H3>
          <P>
            The live demo returns Loadit&apos;s fee lines on every route it selects — the convenience fee and,
            where the destination asset differs from what is received, the swap fee — alongside the estimated
            network cost. Those are the same fee rules the consumer product uses. Estimates, not quotes.
          </P>
          <div className="mt-4 flex flex-wrap gap-3">
            <Cta href="/developers/sandbox" variant="secondary">Watch the live demo</Cta>
            <Cta href="/developers/api" variant="secondary">Fee fields in the API preview</Cta>
          </div>

          <H3 id="enterprise">Enterprise and white-label</H3>
          <P>
            Per-key limits, volume tiers, revenue share, and white-label terms are agreed with each early-access
            partner. There is no public price list yet because there is no open platform yet. Tell us the
            corridor, the volume, and the customer outcome, and we will come back with the economics for that route.
          </P>
          <div className="mt-6 max-w-xl"><AccessForm source="pricing" cta="Request the economics for my corridor" /></div>
        </div>
        <Aside
          title="On this page"
          items={[
            { label: "How Loadit makes money", href: "#how" },
            { label: "The principle", href: "#principle" },
            { label: "What you can see today", href: "#today" },
            { label: "Enterprise and white-label", href: "#enterprise" },
            { label: "Embedded capabilities", href: "/capabilities" },
          ]}
        />
      </Prose>
    </PageShell>
  );
}
