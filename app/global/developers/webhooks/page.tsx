import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P, Code, Table } from "../../_components/PageShell";

export const metadata: Metadata = {
  title: "Webhooks",
  description: "Route and settlement events — planned event catalog and delivery guarantees.",
  alternates: { canonical: "/developers/webhooks" },
};

export default function Webhooks() {
  return (
    <PageShell eyebrow="Webhooks" title="Route and settlement events." lede="Webhooks ship with transactions in the production build. The event catalog and delivery guarantees below are the design, published for review — not yet live." status="PLANNED">
      <Prose>
        <div>
          <H3 id="events">Planned event catalog</H3>
          <Table
            head={["Event", "Fires when"]}
            rows={[
              ["route.selected", "HQ locks a route for a transaction (with TTL)."],
              ["intake.confirmed", "The origin door confirms value has entered."],
              ["route.rerouted", "A leg degraded and an alternative route was selected under the same id."],
              ["settlement.completed", "Value delivered to the destination; receipt attached."],
              ["settlement.failed", "No viable route remained; transaction parked with reason."],
            ]}
          />
          <H3 id="guarantees">Delivery guarantees (design)</H3>
          <P>Signed payloads (HMAC over the raw body with a per-endpoint secret), at-least-once delivery with exponential backoff, and an idempotency key on every event so replays are safe. The runtime already models door webhooks internally with the same idempotent discipline.</P>
          <Code title="Conceptual payload">{`{
  "id": "evt_…",
  "type": "settlement.completed",
  "created": "2026-09-29T14:02:11Z",
  "data": {
    "transaction_id": "pay_…",
    "route_id": "rt_…",
    "destination": { "asset": "USDC", "network": "solana" },
    "receipt": { "ref": "ldi_…", "amount_usd": 1000 }
  }
}`}</Code>
        </div>
        <Aside title="Developers" items={[{ label: "Overview", href: "/developers" }, { label: "API Reference", href: "/developers/api" }, { label: "Sandbox", href: "/developers/sandbox" }]} />
      </Prose>
    </PageShell>
  );
}
