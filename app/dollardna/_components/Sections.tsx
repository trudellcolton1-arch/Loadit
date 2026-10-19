import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { buildScenario, formatAmount, fmt } from "@/lib/dollardna";
import { Section, StatusTag, EvidenceTag, Rows } from "./Bits";

/* ------------------------------------------------------------- what is it */
export function WhatIs() {
  return (
    <Section id="what" alt>
      <SectionHeading eyebrow="What is DollarDNA?" title={<>The amount says how much. The asset says what kind. DollarDNA adds the story — and the evidence behind it.</>} description="A record layer, not a currency. It travels alongside value as it moves through systems Loadit supports, and it is honest about where it can't see." />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          ["Amount", "How much.", "0.002 BTC. $119.10. 50 USDC. A number with a unit."],
          ["Asset", "What kind of value.", "Bitcoin on its network. Dollars in an account. A stablecoin on a chain. Each lives in its own system with its own rules."],
          ["DollarDNA", "Where it came from, what happened to it, and what supports each claim.", "Entry, transfers, splits, conversions, purposes, and signed notes — linked together, with each segment marked known, unknown, or outside coverage."],
        ].map(([k, h, b], i) => (
          <Reveal key={k} index={i}>
            <div className={`h-full rounded-3xl border p-6 ${i === 2 ? "border-rail-400/40 bg-rail-400/[0.06]" : "border-white/10 bg-white/[0.02]"}`}>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-rail-400">{k}</div>
              <h3 className="mt-2 text-lg font-semibold text-white">{h}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{b}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="mt-8 grid gap-6 rounded-3xl border border-white/10 bg-[#070A12] p-6 sm:p-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <h3 className="text-lg font-semibold text-white">Why a history can outlive the asset</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            When Bitcoin is exchanged for dollars, the Bitcoin is gone from your side and dollars arrive. Nothing about the coin turned into a banknote. What can survive is the <em>record</em>: this dollar parcel exists because that exchange happened, which consumed that Bitcoin parcel, which entered coverage here, for this purpose. The asset changed. The connected record did not.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Three things, kept apart on purpose</h3>
          <ol className="mt-2 space-y-2 text-sm text-white/70">
            <li><b className="text-white">1 · The underlying asset.</b> Bitcoin, a dollar balance, a stablecoin. Governed by its own network or institution. DollarDNA does not change it.</li>
            <li><b className="text-white">2 · Its movement or settlement.</b> The transfer, the exchange, the payout — executed by the relevant network or licensed partner.</li>
            <li><b className="text-white">3 · The provenance record.</b> What DollarDNA adds: a linked account of 1 and 2, with evidence, inside participating systems.</li>
          </ol>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- what survives a conversion */
export function Survives() {
  const s = buildScenario();
  const e = s.events.find((x) => x.id === "E2")!;
  const c = e.conversion!;
  const inP = s.parcels.find((p) => p.id === e.inputs[0])!;
  const outP = s.parcels.find((p) => p.id === e.outputs[0])!;
  return (
    <Section id="survives">
      <SectionHeading eyebrow="What survives a conversion" title="A conversion makes a new asset quantity — and a linked record." description="Preserving provenance across a conversion means linking the records of the exchange. It never means the same literal unit exists on both sides." />
      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <div className="grid gap-3">
            <div className="rounded-2xl border border-dashed border-amber/40 p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">Source parcel · consumed</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-amber/80 line-through decoration-white/20">{fmt(inP.asset, inP.amount)}</div>
              <div className="mt-1 text-xs text-white/50">{inP.label} · <EvidenceTag evidence={inP.evidence} /></div>
            </div>
            <div className="text-center font-mono text-rail-400" aria-hidden>↓ linked by {c.reference}</div>
            <div className="rounded-2xl border border-white/20 bg-white/[0.03] p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">Resulting parcel · current</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-white">{fmt(outP.asset, outP.amount)}</div>
              <div className="mt-1 text-xs text-white/50">{outP.label} · parent {inP.id} · <EvidenceTag evidence={outP.evidence} /></div>
            </div>
          </div>
        </Reveal>
        <Reveal index={1}>
          <div className="rounded-3xl border border-white/10 bg-[#070A12] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white">Conversion record · {c.reference}</h3>
              <StatusTag tag="illustrative" />
            </div>
            <div className="mt-4">
              <Rows
                rows={[
                  ["Source parcel", `${inP.id} · ${fmt(inP.asset, inP.amount)}`],
                  ["Input", `${fmt(c.inputAsset, c.inputMinor)} (${c.inputMinor.toLocaleString("en-US")} satoshis)`],
                  ["Applied rate", c.rate.label],
                  ["Gross", fmt("USD", c.outputMinor + c.feeMinor)],
                  ["Fee", `− ${fmt("USD", c.feeMinor)} · ${c.feeLabel}`],
                  ["Rounding", `${fmt("USD", c.roundingMinor)} · half-up at the cent, shown even when zero`],
                  ["Output", `${fmt(c.outputAsset, c.outputMinor)} → parcel ${outP.id}`],
                  ["Timestamp", c.timestamp],
                  ["Evidence", "Referenced · settlement reference from the exchange partner (example). A bank statement alone does not cryptographically prove the whole cross-system journey; it is one piece of evidence, linked."],
                ]}
              />
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- how it works */
const OPS: { name: string; body: string; evidence: string; tag: "concept" }[] = [
  { name: "Record entry", body: "Create the first tracked record for an asset entering supported coverage. The starting point is established by evidence — a chain transaction reference, a partner settlement reference, or a signed statement — not by minting anything. No government money is created; no Bitcoin is issued.", evidence: "Referenced or attested at entry", tag: "concept" },
  { name: "Transfer", body: "Record a supported movement from one holder to another and its relationship to the events before it. The movement itself is executed by the network or partner; the record links to it.", evidence: "Referenced to the settlement", tag: "concept" },
  { name: "Split", body: "Divide a tracked amount into smaller parcels. Same asset, same total, every child pointing at the parent. Quantities are conserved exactly.", evidence: "Inherited from the parent", tag: "concept" },
  { name: "Merge", body: "Combine compatible parcels of the same asset into one, keeping references to every parent. A merged history is a graph, not a single line.", evidence: "Inherited from all parents", tag: "concept" },
  { name: "Convert", body: "Link an input asset to an output asset through a documented exchange event: rate, fee, rounding, reference, timestamp. The input parcel is consumed; the output parcel is new and linked.", evidence: "Referenced to the exchange", tag: "concept" },
  { name: "Attach context", body: "Associate a purpose, a reference, a note, or a signed attestation with a record. A signature authenticates who said it, not whether it is true.", evidence: "Attested by the signer", tag: "concept" },
  { name: "Evaluate receiving rules", body: "Where implemented, evaluate recipient-defined criteria against the history and evidence actually available. Missing segments read as unknown and are never treated as satisfied.", evidence: "Depends on what the history contains", tag: "concept" },
];

export function HowItWorks() {
  return (
    <Section id="how" alt>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="How DollarDNA works" title="Seven operations on one record model." description="Each is described as designed. None is a shipped integration today; the simulation above shows the model, not a live system." />
        <StatusTag tag="design" className="mb-2" />
      </div>
      <ol className="mt-12 grid gap-3 md:grid-cols-2">
        {OPS.map((o, i) => (
          <Reveal key={o.name} index={i % 2} as="li">
            <div className="h-full rounded-2xl border border-white/10 bg-[#070A12] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] text-white/35">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="mt-1 text-lg font-semibold text-white">{o.name}</h3>
                </div>
                <StatusTag tag={o.tag} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{o.body}</p>
              <p className="mt-3 text-xs text-white/45"><span className="font-mono uppercase tracking-[0.16em] text-white/40">Evidence · </span>{o.evidence}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

/* ------------------------------------------------------------- built for more than dollars */
export function BuiltFor() {
  const cats = [
    { name: "Bitcoin and other native cryptoassets", integ: "Evidence is a chain transaction reference; entry and exit are observable on the network. Different chains need different adapters.", now: "First intended coverage: the assets Loadit's routing engine already handles — BTC, ETH, SOL, XRP." },
    { name: "USD and other fiat currencies", integ: "Evidence comes from licensed partners: settlement references, statements, payout confirmations. No public ledger exists, so coverage depends on the partner relationship.", now: "First intended coverage: USD entering through card and certified cash-network intake." },
    { name: "Stablecoins", integ: "On-chain movement is observable; issuance and redemption references come from the issuer or partner. Multiple networks per coin mean multiple adapters.", now: "First intended coverage: USDC and USDT on the networks the engine routes across today." },
    { name: "Other supported digital or represented assets", integ: "Tokenized assets, loyalty units, energy credits, and other represented value each need their own integration and evidence model before coverage is real.", now: "Illustrative future scope. Nothing here is integrated." },
  ];
  return (
    <Section id="assets">
      <SectionHeading eyebrow="Built for more than dollars" title="The name says dollar. The model says value." description="Every asset family needs its own integration and its own evidence model. The record shape stays the same; the proof behind it does not." />
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {cats.map((c, i) => (
          <Reveal key={c.name} index={i % 2}>
            <div className="h-full rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-lg font-semibold text-white">{c.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60"><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">Integration & evidence · </span>{c.integ}</p>
              <p className="mt-3 rounded-xl border border-white/10 bg-[#070A12] px-4 py-2.5 text-sm text-white/75"><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-rail-400">Scope · </span>{c.now}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <p className="mt-6 text-xs text-white/45">
        Status of the underlying rails is on <a href="/platform" className="text-white underline decoration-white/30 underline-offset-4">the platform page</a>. DollarDNA itself is in design; no asset is under live provenance coverage today.
      </p>
    </Section>
  );
}

/* ------------------------------------------------------------- why it matters */
export function WhyItMatters() {
  const cases = [
    ["Business payments", "Connect a payment to its invoice, the related transactions, and the supporting references — so reconciling means following links, not matching amounts by hand."],
    ["Cross-asset transfers", "Explain, with the records of each exchange, how an original amount in one asset resulted in a different asset and amount at the destination."],
    ["Project and donation reporting", "Give funders a clearer record of documented fund movements within supported coverage — and an honest marker wherever the trail leaves it."],
    ["Personal gifts and milestones", "Attach meaning to a payment: a note, an occasion, a signed message, carried with the parcel rather than lost in a memo field."],
    ["Treasury reconciliation", "Connect records across supported assets and accounts so a close ties parcels to their origins instead of balances to spreadsheets."],
  ];
  return (
    <Section id="why" alt>
      <SectionHeading eyebrow="Why this matters" title="Illustrative uses, kept honest." description="Each of these works only within supported coverage and available evidence. None grants visibility into a recipient's future spending or access to anyone's private records." />
      <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {cases.map(([k, v]) => (
          <div key={k} className="bg-[#04060B] p-6">
            <h3 className="text-base font-semibold text-white">{k}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{v}</p>
          </div>
        ))}
        <div className="flex items-center bg-[#04060B] p-6">
          <p className="text-sm text-white/50">Every example above is a design intention. The simulation on this page is the only place DollarDNA runs today.</p>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- history vs collectible */
export function HistoryVsCollectible() {
  return (
    <Section id="collectible">
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <SectionHeading eyebrow="History versus collectible interest" title="A story can be meaningful. It does not change what the asset is worth." />
          <p className="mt-5 text-sm leading-relaxed text-white/60">
            An authenticated milestone — the first payment a business ever received, a gift sent on a particular day, a note signed by someone who mattered — may be meaningful to people. DollarDNA can carry that. But four different things are at play, and the page keeps them apart.
          </p>
        </div>
        <ol className="grid gap-3">
          {[
            ["Underlying asset amount", "50 USDC is 50 USDC. The story does not add to it, and it is redeemable for exactly what the asset is redeemable for."],
            ["Recorded provenance", "The linked record of where it came from and what happened to it, within coverage."],
            ["Authenticity of an attestation", "Whether a particular signed statement really came from the key that claims it. Verifiable; narrow."],
            ["Collector interest, if any", "Entirely subjective and separate. No premium, resale demand, or return is promised or implied."],
          ].map(([k, v], i) => (
            <li key={k} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="font-mono text-[10px] text-white/35">{String(i + 1).padStart(2, "0")}</div>
              <h3 className="mt-1 text-base font-semibold text-white">{k}</h3>
              <p className="mt-1 text-sm text-white/60">{v}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- trust, privacy, coverage */
export function TrustCoverage() {
  const s = buildScenario();
  const items = [
    ["Coverage is bounded", "Recorded history exists only inside supported systems and only where evidence is available. DollarDNA records what it can see; it does not infer the rest."],
    ["Signatures authenticate signers", "A signed attestation proves which key made a statement. It does not establish that the statement is true, that work was delivered, or that a purpose was honored."],
    ["Unknown is shown as unknown", "A missing segment is displayed as Unknown. It is never filled in, assumed, or rendered as satisfied."],
    ["Leaving coverage creates gaps", "When value moves through a system DollarDNA does not record, the history is marked Outside coverage. If the value re-enters, a new segment begins; the gap stays visible."],
    ["Visibility depends on the implementation", "Who can see what is a property of the deployed system, not a promise on this page. No privacy controls, encryption, or deletion guarantees are claimed here because none are built yet."],
    ["Provenance is not compliance", "A connected record does not by itself prove funds are lawful, prevent every fraud, or replace identity verification and compliance processes performed by licensed partners."],
  ];
  return (
    <Section id="trust" alt>
      <SectionHeading eyebrow="Trust, privacy, and coverage" title="What a record can and cannot tell you." />
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-white/10 bg-[#070A12] p-5">
            <h3 className="text-base font-semibold text-white">{k}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white">Evidence states used on this page</h3>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {(["attested", "referenced", "unknown", "outside_coverage"] as const).map((e) => (
            <li key={e} className="flex gap-3 text-sm text-white/65"><EvidenceTag evidence={e} className="mt-0.5 shrink-0" /><span>{{ attested: "A signed statement by a participant is attached.", referenced: "The record points at an external artifact that can be checked.", unknown: "No evidence is available for this segment.", outside_coverage: "The value moved through a system DollarDNA does not record." }[e]}</span></li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-white/40">All people, references, and rates in the simulation are fictional: {s.people.sender.toLowerCase()}, {s.people.recipient.toLowerCase()}, example transaction refs, example rates.</p>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- faq */
const FAQ: [string, string][] = [
  ["Why is it called DollarDNA if it works with Bitcoin and other assets?", "The name came from the first question it answers — where did this dollar come from? — and it stuck. The model is asset-agnostic: a parcel can be Bitcoin, dollars, a stablecoin, or any supported represented asset. The record shape is the same; the evidence behind it differs by asset."],
  ["Is DollarDNA a currency or a record layer?", "A record layer. It issues nothing, holds nothing, and settles nothing. It describes value that moves through systems Loadit supports."],
  ["How does it relate to Loadit?", "It is a Loadit design: the provenance layer intended to sit alongside the transaction engine that routes value between cash, cards, banks, and digital assets. Where the engine records a transaction object, DollarDNA is the connected history of the parcels inside it."],
  ["What happens when Bitcoin is exchanged for USD?", "The Bitcoin parcel is consumed and a USD parcel is created, linked to it through a conversion record that carries the rate, fee, rounding, reference, and timestamp. The dollars are new; the link is what connects them to the Bitcoin's history."],
  ["Does it change Bitcoin or the underlying asset?", "No. Bitcoin's protocol, a bank's dollars, and a stablecoin's contract are untouched. DollarDNA attaches records inside participating systems; it does not modify assets or create tracking outside those systems."],
  ["Is this an NFT?", "No. Nothing is minted, no token represents the record, and no blockchain is required for the record itself. Evidence may reference on-chain transactions where the asset lives on a chain."],
  ["Does it require everything to use one blockchain?", "No. Different assets live in different systems. DollarDNA's job is to link records across them, with an integration and an evidence model per system."],
  ["Can it track physical banknotes?", "No. A parcel is a tracked quantity within the system's records, not a physical note. Cash enters coverage when a licensed partner records it at a counter; the banknote itself is not followed."],
  ["What happens when value leaves supported coverage?", "The history is marked Outside coverage at that point. If the value re-enters later, a new segment starts with new evidence; the gap remains visible rather than being papered over."],
  ["Can everyone see my financial history?", "Visibility is a property of the implementation, which is not built yet. This page claims no public ledger of your history and no privacy guarantee either. When the system exists, who sees what will be documented plainly."],
  ["Does a recorded purpose prove how money was actually used?", "No. A purpose is a statement by the sender, authenticated by their signature. It proves who said it, not what the recipient did with the funds."],
  ["Which capabilities are available today?", "None of DollarDNA is live. It is in design, and the simulation on this page is the only place it runs. What Loadit has today is a prototype app, a publicly demonstrable routing engine, and a completed cash-network certification — the systems DollarDNA is designed to sit alongside."],
];

export function Faq() {
  return (
    <Section id="faq">
      <SectionHeading eyebrow="FAQ" title="Straight answers." />
      <div className="mt-10 divide-y divide-white/8 rounded-3xl border border-white/10 bg-[#070A12]">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-white">
              {q}
              <span aria-hidden className="font-mono text-white/40 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65">{a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export { formatAmount };
