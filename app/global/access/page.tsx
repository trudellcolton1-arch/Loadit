import type { Metadata } from "next";
import { PageShell, Prose, H3, P, Code } from "../_components/PageShell";
import { AccessForm } from "../_components/AccessForm";
import { StatusTag } from "../_components/Bits";

export const metadata: Metadata = {
  title: "Get API access",
  description: "Start with the demo key today; request a production key for higher limits and the transaction API as it ships.",
  alternates: { canonical: "/access" },
};

export default function AccessPage() {
  return (
    <PageShell eyebrow="API access" title="Start building." lede="The sandbox works this minute with the demo key. Production keys are issued by hand while the platform is in build — tell us what you're routing and we'll set you up.">
      <Prose>
        <div>
          <div className="flex items-center gap-2"><StatusTag status="LIVE · SANDBOX" /><span className="text-sm text-white/55">Available now, no signup</span></div>
          <Code title="Try it">{`curl -X POST https://loaditglobal.com/api/v1/route \\
  -H "x-api-key: demo" -H "Content-Type: application/json" \\
  -d '{ "amount_usd": 1000, "payment_method": "Bank Transfer", "asset": "USDC" }'`}</Code>
          <H3 id="prod">Production access</H3>
          <P>A production key raises the rate limit to 600 requests per minute and puts you first in line for transactions, settlement, and webhooks as they ship from the production build. Keys are provisioned by a person after a short conversation about your use case.</P>
          <div className="mt-6 max-w-xl"><AccessForm source="access" /></div>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">What you get</p>
          <ul className="mt-3 space-y-2 text-sm text-white/60">
            <li>— Production API key (600 req/min)</li>
            <li>— Direct line to the engineering team</li>
            <li>— Early access to transactions &amp; webhooks</li>
            <li>— Diligence materials under NDA</li>
          </ul>
        </div>
      </Prose>
    </PageShell>
  );
}
