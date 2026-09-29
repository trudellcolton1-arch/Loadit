import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P } from "../_components/PageShell";
import { DeveloperExperience } from "../_components/DeveloperExperience";
import { StatusTag, Cta } from "../_components/Bits";

export const metadata: Metadata = {
  title: "Developers",
  description: "A preview of the Loadit Global developer platform: one HTTP interface that returns the selected supported route and a normalized settlement object. Pre-launch — join the early-access list.",
  alternates: { canonical: "/developers" },
};

const NAVI = [
  { label: "Overview", href: "/developers" },
  { label: "Quickstart (preview)", href: "/developers/quickstart" },
  { label: "API Reference (preview)", href: "/developers/api" },
  { label: "Transaction model (preview)", href: "/developers/transaction-model" },
  { label: "Embedded capabilities", href: "/capabilities" },
  { label: "SDKs", href: "/developers/sdks" },
  { label: "Webhooks", href: "/developers/webhooks" },
  { label: "Live demo", href: "/developers/sandbox" },
  { label: "Status", href: "/status" },
];

export default function DevelopersPage() {
  return (
    <PageShell
      eyebrow="Developers · preview"
      title="Your application shouldn't need to understand every rail."
      lede="State the origin and the destination. Loadit returns the route. This is a preview of the developer platform built around that one idea — published early so you can review the interface before it opens."
      status="PREVIEW"
    >
      <Prose>
        <div>
          <div className="rounded-2xl border border-rail-400/30 bg-rail-400/[0.05] p-5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-rail-400">Pre-launch</p>
            <p className="mt-2 text-sm text-white/80">Nothing on these pages is available to integrate yet. Keys are issued to early-access partners first, by a person.</p>
            <div className="mt-4 flex flex-wrap gap-2"><Cta href="/access" className="px-4 py-2.5 text-xs">Join the early-access list</Cta><Cta href="/developers/sandbox" variant="secondary" className="px-4 py-2.5 text-xs">Watch the live demo</Cta></div>
          </div>

          <H3 id="what">What the platform is</H3>
          <P>
            One HTTP interface. Send an amount, a funding method, and a target asset; receive the selected network, the cost,
            the expected time, a confidence score, and the path — as JSON, with no SDK required. Transactions, settlement objects,
            and webhooks follow the same normalized shape.
          </P>

          <H3 id="status">Capability status</H3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["Routing engine — public live demo", "LIVE DEMO"],
              ["Routing API access", "COMING SOON"],
              ["API keys", "EARLY ACCESS"],
              ["Transactions / settlement objects (Load)", "IN BUILD"],
              ["Multi-Asset Load · allocations", "PLANNED"],
              ["Send · Convert · Receive · Connect · Cash Out", "PLANNED"],
              ["Loadit One for platforms (issuing partner required)", "PLANNED"],
              ["Capability registry", "PLANNED"],
              ["Webhooks", "PLANNED"],
              ["SDKs (TypeScript, Python)", "PLANNED"],
              ["White-label components · dashboard", "PLANNED"],
            ].map(([k, s]) => (
              <div key={k} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <span className="text-sm text-white/80">{k}</span>
                <StatusTag status={s as "LIVE DEMO" | "COMING SOON" | "EARLY ACCESS" | "PLANNED" | "IN BUILD"} />
              </div>
            ))}
          </div>

          <H3 id="principles">Principles the platform is built on</H3>
          <P><b className="text-white">Non-custodial.</b> Loadit routes and orchestrates; it never holds customer funds or keys. Delivery is to destinations the customer controls.</P>
          <P><b className="text-white">Honest surfaces.</b> Anything illustrative, conceptual, or planned is labeled that way — in the docs and in the product.</P>
          <P><b className="text-white">Idempotent by construction.</b> Every money-moving side effect carries a deterministic idempotency key; retries and reroutes can never double-execute.</P>
          <P><b className="text-white">Server-side truth.</b> Authorization, fees, and route selection are decided on the server. The client is never the source of truth.</P>
        </div>
        <Aside title="Developers" items={NAVI} />
      </Prose>
      <DeveloperExperience />
    </PageShell>
  );
}
