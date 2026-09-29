import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P, Code } from "../../_components/PageShell";
import { Cta } from "../../_components/Bits";

export const metadata: Metadata = {
  title: "Quickstart (preview)",
  description: "What integrating Loadit Global will look like: one HTTP request in, a selected route out. Pre-launch preview.",
  alternates: { canonical: "/developers/quickstart" },
};

const NAVI = [
  { label: "1 · Get a key", href: "#key" },
  { label: "2 · Make the call", href: "#call" },
  { label: "3 · Read the route", href: "#route" },
  { label: "4 · Early access", href: "#access" },
];

export default function Quickstart() {
  return (
    <PageShell eyebrow="Quickstart · preview" title="What your first route will look like." lede="Pre-launch. This walks through the intended integration so you can review it now — the endpoint is not open yet." status="PREVIEW">
      <Prose>
        <div>
          <H3 id="key">1 · Get a key</H3>
          <P>Keys are issued to early-access partners by a person. There is no self-serve or public key yet.</P>

          <H3 id="call">2 · Make the call</H3>
          <P>Send the origin (a funding method), the destination (an asset), and an amount in USD.</P>
          <Code title="cURL · preview">{`curl -X POST https://loaditglobal.com/api/v1/route \\
  -H "x-api-key: $LOADIT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "amount_usd": 1000, "payment_method": "Bank Transfer", "asset": "USDC" }'`}</Code>
          <Code title="JavaScript (fetch) · preview">{`const res = await fetch("https://loaditglobal.com/api/v1/route", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": process.env.LOADIT_API_KEY },
  body: JSON.stringify({ amount_usd: 1000, payment_method: "Bank Transfer", asset: "USDC" }),
});
const { route, meta } = await res.json();`}</Code>

          <H3 id="route">3 · Read the route</H3>
          <P>
            <code className="font-mono text-white">route.network</code> is the selected rail; <code className="font-mono text-white">route.eta</code> and{" "}
            <code className="font-mono text-white">route.total_usd</code> are the expected time and all-in cost;{" "}
            <code className="font-mono text-white">route.path</code> lists the legs; <code className="font-mono text-white">route.confidence</code> is HQ&apos;s
            confidence in the selection. All values will be estimates dependent on live market and network conditions.
          </P>

          <H3 id="access">4 · Early access</H3>
          <P>Tell us what value needs to move. We bring partners in as the platform opens, with keys, a direct line to engineering, and diligence materials under NDA.</P>
          <div className="mt-4"><Cta href="/access">Join the early-access list</Cta></div>
        </div>
        <Aside title="On this page" items={NAVI} />
      </Prose>
    </PageShell>
  );
}
