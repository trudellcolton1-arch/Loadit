import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P, Code } from "../../_components/PageShell";
import { AccessForm } from "../../_components/AccessForm";

export const metadata: Metadata = {
  title: "SDKs",
  description: "Loadit client libraries — planned. The HTTP API needs no SDK today.",
  alternates: { canonical: "/developers/sdks" },
};

export default function Sdks() {
  return (
    <PageShell eyebrow="SDKs" title="Client libraries." lede="The API is plain JSON over HTTPS and needs no SDK. Typed clients are planned; the intended shape is below so you can review it before it ships." status="PLANNED">
      <Prose>
        <div>
          <H3 id="today">Today</H3>
          <P>Call the routing endpoint directly from any language. See the <a href="/developers/quickstart" className="text-rail-400 underline underline-offset-4">quickstart</a> for cURL and fetch examples.</P>
          <H3 id="planned">Planned: TypeScript</H3>
          <Code title="Conceptual — not published">{`import { Loadit } from "@loadit/global";

const loadit = new Loadit({ apiKey: process.env.LOADIT_API_KEY });

const route = await loadit.routes.find({
  amountUsd: 1000,
  input:  { method: "Bank Transfer" },
  output: { asset: "USDC" },
});

const tx = await loadit.transactions.create({
  amount: 100,
  input:  { asset: "USD" },
  output: { asset: "USDC", network: "stellar" },
});`}</Code>
          <H3 id="planned-py">Planned: Python</H3>
          <Code title="Conceptual — not published">{`from loadit import Loadit

client = Loadit(api_key=os.environ["LOADIT_API_KEY"])
route = client.routes.find(amount_usd=1000, input={"method": "Bank Transfer"}, output={"asset": "USDC"})`}</Code>
          <H3 id="notify">Be first</H3>
          <P>Tell us your stack and we&apos;ll reach out when the client for it is ready.</P>
          <AccessForm source="sdks" cta="Notify me" />
        </div>
        <Aside title="Developers" items={[{ label: "Overview", href: "/developers" }, { label: "Quickstart", href: "/developers/quickstart" }, { label: "API Reference", href: "/developers/api" }]} />
      </Prose>
    </PageShell>
  );
}
