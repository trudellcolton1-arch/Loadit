import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P, Code } from "../_components/PageShell";
import { DeveloperExperience } from "../_components/DeveloperExperience";
import { StatusTag, Cta } from "../_components/Bits";

export const metadata: Metadata = {
  title: "Developers",
  description: "Integrate Loadit's routing layer: one HTTP endpoint returns the selected supported route and a normalized settlement object. Live sandbox with the demo key.",
  alternates: { canonical: "/developers" },
};

const NAVI = [
  { label: "Overview", href: "/developers" },
  { label: "Quickstart", href: "/developers/quickstart" },
  { label: "API Reference", href: "/developers/api" },
  { label: "SDKs", href: "/developers/sdks" },
  { label: "Webhooks", href: "/developers/webhooks" },
  { label: "Sandbox", href: "/developers/sandbox" },
  { label: "Status", href: "/status" },
];

export default function DevelopersPage() {
  return (
    <PageShell
      eyebrow="Developers"
      title="Your application shouldn't need to understand every rail."
      lede="State the origin and the destination. Loadit returns the route. This is the developer platform for that one idea — with every capability labeled by what you can call today."
      status="LIVE · SANDBOX"
    >
      <Prose>
        <div>
          <H3 id="what">What you can integrate today</H3>
          <P>
            The HQ routing endpoint is live. Send an amount, a funding method, and a target asset;
            receive the selected network, the cost, the expected time, a confidence score, and the
            path — as JSON, over CORS, with no SDK required. The public <code className="font-mono text-white">demo</code> key
            works now and is rate-limited to 30 requests a minute.
          </P>
          <Code title="POST /api/v1/route">{`curl -X POST https://loaditglobal.com/api/v1/route \\
  -H "x-api-key: demo" -H "Content-Type: application/json" \\
  -d '{ "amount_usd": 1000, "payment_method": "Bank Transfer", "asset": "USDC" }'`}</Code>

          <H3 id="status">Capability status</H3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["Routing endpoint (/api/v1/route)", "LIVE · SANDBOX"],
              ["Production API keys", "PLANNED"],
              ["Transactions / settlement objects", "IN BUILD"],
              ["Webhooks", "PLANNED"],
              ["SDKs (TypeScript, Python)", "PLANNED"],
              ["Dashboard", "PLANNED"],
            ].map(([k, s]) => (
              <div key={k} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <span className="text-sm text-white/80">{k}</span>
                <StatusTag status={s as "LIVE · SANDBOX" | "PLANNED" | "IN BUILD"} />
              </div>
            ))}
          </div>

          <H3 id="principles">Principles the platform is built on</H3>
          <P><b className="text-white">Non-custodial.</b> Loadit routes and orchestrates; it never holds customer funds or keys. Delivery is to destinations the customer controls.</P>
          <P><b className="text-white">Honest surfaces.</b> Anything illustrative, conceptual, or planned is labeled that way — in the docs and in the product.</P>
          <P><b className="text-white">Idempotent by construction.</b> Every money-moving side effect in the runtime carries a deterministic idempotency key; retries and reroutes can never double-execute.</P>
          <P><b className="text-white">Server-side truth.</b> Authorization, fees, and route selection are decided on the server. The client is never the source of truth.</P>

          <div className="mt-10 flex flex-wrap gap-3">
            <Cta href="/developers/quickstart">Start the quickstart</Cta>
            <Cta href="/access" variant="secondary">Request a production key</Cta>
          </div>
        </div>
        <Aside title="Developers" items={NAVI} />
      </Prose>
      <DeveloperExperience />
    </PageShell>
  );
}
