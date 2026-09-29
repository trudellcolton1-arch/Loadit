import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P, Code, Table } from "../../_components/PageShell";
import { StatusTag, Cta } from "../../_components/Bits";
import { MONEY_MAP } from "../../_lib/site";

export const metadata: Metadata = {
  title: "Transaction model (preview)",
  description:
    "One transaction object for every Loadit capability: parent and child legs, a capability registry, quotes before funding, partial-failure rules, idempotency, and reconciliation. Preview — pre-launch.",
  alternates: { canonical: "/developers/transaction-model" },
};

const NAVI = [
  { label: "One object", href: "#object" },
  { label: "Parent and child legs", href: "#legs" },
  { label: "Types", href: "#types" },
  { label: "Capability registry", href: "#registry" },
  { label: "Quote before funding", href: "#quote" },
  { label: "Partial failure", href: "#failure" },
  { label: "Idempotency", href: "#idempotency" },
  { label: "Reconciliation and receipt", href: "#receipt" },
  { label: "The money map", href: "#money-map" },
];

export default function TransactionModel() {
  return (
    <PageShell
      eyebrow="Transaction model · preview"
      title="One transaction object. Many legs. One receipt."
      lede="Every Loadit capability — Load, Send, Connect, Convert, Receive, Cash Out, Loadit One — is the same object with a different type. This is what we would tell a team of engineers to build, published early so partners can review the shape before access opens."
      status="PREVIEW"
    >
      <Prose>
        <div>
          <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <StatusTag status="CONCEPTUAL" />
            <span className="text-sm text-white/60">Design for review. The route endpoint runs today in the live demo; the transactions interface is not open.</span>
            <Cta href="/access" variant="secondary" className="ml-auto px-3 py-1.5 text-xs">Join the list</Cta>
          </div>

          <H3 id="object">One object</H3>
          <P>
            A transaction records the source value, the amount, the desired output or outputs, the destination or
            destinations, the fees, the partner route HQ selected, and the state. The customer or partner never
            buys &ldquo;orchestration&rdquo; — they state an outcome, and this object carries it end to end.
          </P>
          <Code title="Transaction · conceptual shape">{`{
  "id": "txn_…",
  "type": "load",                          // load | send | convert | receive | cash_out | connect | spend
  "source":  { "kind": "cash", "currency": "USD", "amount": 500 },
  "outputs": [                             // one leg, or many
    { "asset": "USDC", "amount_usd": 200, "destination": "wallet:…" },
    { "asset": "BTC",  "amount_usd": 125, "destination": "wallet:…" },
    { "asset": "ETH",  "amount_usd": 100, "destination": "wallet:…" },
    { "asset": "SOL",  "amount_usd":  75, "destination": "wallet:…" }
  ],
  "constraints": { "max_fee_usd": 12, "prefer": "auto" },
  "quote": { "total_usd": 508.75, "fees": [ … ], "expires_at": "…" },
  "plan":  { "engine": "HQ", "legs": [ … ], "conversions": [ … ] },
  "state": "quoted"                        // quoted → funded → converting → paying_out → settled
}`}</Code>

          <H3 id="legs">Parent and child legs</H3>
          <P>
            One $500 load can contain four output legs and still feel like one customer transaction. The parent
            holds the intent, the quote, and the overall state; each child leg holds its own partner, rail,
            conversion, fee, and state. The partner sees one identifier and one status feed. The ledger sees every leg.
          </P>
          <Table
            head={["Level", "Holds", "State"]}
            rows={[
              ["parent", "intent · quote · funding event · overall state · receipt", "quoted → funded → in_progress → settled | partially_settled | resolved"],
              ["leg", "output · destination · partner · rail · conversion · fee · idempotency key", "planned → executing → settled | failed → rerouted | refunded"],
            ]}
          />

          <H3 id="types">Types</H3>
          <Table
            head={["type", "Source → outputs", "Phase"]}
            rows={[
              ["load", "cash or card funding event → one or many supported digital assets", "1"],
              ["send", "what the sender holds → what the recipient wants (asset or currency may differ)", "2"],
              ["spend", "supported fiat or crypto, possibly several eligible sources → one merchant-facing card settlement (Loadit One)", "3"],
              ["convert", "value already held → one or many supported assets or currencies", "4"],
              ["receive", "a standing rule: how incoming value arrives and is allocated", "4"],
              ["connect", "a source on one supported platform → a destination on another", "5"],
              ["cash_out", "supported digital value → an eligible cash or fiat exit", "6"],
            ]}
          />

          <H3 id="registry">Capability registry</H3>
          <P>
            Exactly which funding methods, assets, networks, partners, and destinations are live right now — machine
            readable, so a partner&apos;s product only offers what HQ can actually route today. Statuses on this site are
            drawn from the same idea: nothing is shown as available that the registry would not return.
          </P>
          <Code title="GET /api/v1/capabilities · planned">{`{
  "funding":      { "cash": "in_build", "debit_card": "in_build", "bank_transfer": "in_build" },
  "assets":       ["USDC", "USDT", "BTC", "ETH", "SOL", "XRP"],
  "networks":     ["solana", "base", "ethereum", "polygon", "xrpl", "lightning", "stellar"],
  "capabilities": { "load": "in_build", "multi_asset_load": "planned", "send": "planned", "spend": "planned",
                    "convert": "planned", "receive": "planned", "connect": "planned", "cash_out": "planned" }
}`}</Code>

          <H3 id="quote">Quote before funding</H3>
          <P>
            The quote engine shows the total cost and the estimated amount of every output before anything is funded.
            A quote carries a time-to-live. The customer funds once, against the quote, and HQ executes the plan that
            was quoted — or re-plans within the disclosed rules if the world changed in between.
          </P>

          <H3 id="failure">Partial failure</H3>
          <P>
            Every output leg must be completed, retried or rerouted where permitted, or resolved and refunded according
            to disclosed rules. There is no state in which a leg silently disappears. When a pipe fails mid-flight the
            payment is parked, the remaining legs are re-scored, and a new route is locked under the same identifier.
          </P>

          <H3 id="idempotency">Idempotency</H3>
          <P>
            Every money-moving side effect carries a deterministic idempotency key derived from the transaction and the
            leg. Retries and reroutes can never double-execute. A double payout is impossible by construction, not by policy.
          </P>

          <H3 id="receipt">Reconciliation and receipt</H3>
          <P>
            Partners execute; Loadit verifies. Each leg&apos;s reported result is reconciled against the plan, and one receipt
            shows every output and every disclosed fee. Your ledger can reconcile it without knowing which rail carried the value.
          </P>

          <H3 id="money-map">The money map</H3>
          <P>Every live route must answer these ten questions in writing. Partners receive the answers for their corridor.</P>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {MONEY_MAP.map((q, i) => (
              <li key={q} className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white/75">
                <span className="font-mono text-[11px] text-rail-400">{String(i + 1).padStart(2, "0")}</span>
                {q}
              </li>
            ))}
          </ol>
        </div>
        <Aside title="On this page" items={NAVI} />
      </Prose>
    </PageShell>
  );
}
