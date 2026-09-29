import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P, Code } from "../../_components/PageShell";
import { LiveCall } from "../../_components/LiveCall";

export const metadata: Metadata = {
  title: "Quickstart",
  description: "Your first Loadit route in five minutes: one HTTP call with the demo key.",
  alternates: { canonical: "/developers/quickstart" },
};

const NAVI = [
  { label: "1 · Get a key", href: "#key" },
  { label: "2 · Make the call", href: "#call" },
  { label: "3 · Read the route", href: "#route" },
  { label: "4 · Go to production", href: "#prod" },
];

export default function Quickstart() {
  return (
    <PageShell eyebrow="Quickstart" title="Your first route in five minutes." lede="No SDK, no account. One HTTP request." status="LIVE · SANDBOX">
      <Prose>
        <div>
          <H3 id="key">1 · Get a key</H3>
          <P>
            The public sandbox key is <code className="font-mono text-white">demo</code>. It is rate-limited to 30 requests a minute and
            returns real HQ routing output. Production keys are issued through an <a href="/access" className="text-rail-400 underline underline-offset-4">access request</a>.
          </P>

          <H3 id="call">2 · Make the call</H3>
          <P>Send the origin (a funding method), the destination (an asset), and an amount in USD.</P>
          <Code title="cURL">{`curl -X POST https://loaditglobal.com/api/v1/route \\
  -H "x-api-key: demo" \\
  -H "Content-Type: application/json" \\
  -d '{ "amount_usd": 1000, "payment_method": "Bank Transfer", "asset": "USDC" }'`}</Code>
          <Code title="JavaScript (fetch)">{`const res = await fetch("https://loaditglobal.com/api/v1/route", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": "demo" },
  body: JSON.stringify({ amount_usd: 1000, payment_method: "Bank Transfer", asset: "USDC" }),
});
const { route, meta } = await res.json();`}</Code>
          <P>Or try it right here — this is a real request from your browser:</P>
          <LiveCall />

          <H3 id="route">3 · Read the route</H3>
          <P>
            <code className="font-mono text-white">route.network</code> is the selected rail; <code className="font-mono text-white">route.eta</code> and{" "}
            <code className="font-mono text-white">route.total_usd</code> are the expected time and all-in cost;{" "}
            <code className="font-mono text-white">route.path</code> lists the legs; <code className="font-mono text-white">route.confidence</code> is HQ&apos;s
            confidence in the selection. <code className="font-mono text-white">meta.fees_live</code> tells you whether live network-fee feeds were available for this response.
            All values are estimates dependent on live market and network conditions.
          </P>

          <H3 id="prod">4 · Go to production</H3>
          <P>
            Production keys, transaction objects, settlement, and webhooks are provisioned as part of the production build.
            Request access and tell us what value needs to move — a person replies.
          </P>
        </div>
        <Aside title="On this page" items={NAVI} />
      </Prose>
    </PageShell>
  );
}
