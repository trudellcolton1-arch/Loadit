/**
 * DOLLARDNA — educational provenance model and the deterministic demo scenario.
 *
 * Pure, dependency-free, integer-only. Every amount is an integer count of an
 * asset's minor unit (satoshis, cents, micro-USDC). Conversions use BigInt
 * multiply/divide with explicit half-up rounding and report any rounding they
 * applied, so input, output, rate, fee, and rounding always reconcile.
 *
 * This file never touches money. It describes records.
 */

export type AssetCode = "BTC" | "USD" | "USDC";
export type AssetKind = "crypto" | "fiat" | "stablecoin";

export interface Asset {
  code: AssetCode;
  name: string;
  kind: AssetKind;
  /** Number of decimals in the minor unit (BTC 8 = satoshi, USD 2 = cent, USDC 6). */
  decimals: number;
  minorName: string;
}

export const ASSETS: Record<AssetCode, Asset> = {
  BTC: { code: "BTC", name: "Bitcoin", kind: "crypto", decimals: 8, minorName: "satoshis" },
  USD: { code: "USD", name: "US dollar", kind: "fiat", decimals: 2, minorName: "cents" },
  USDC: { code: "USDC", name: "USD Coin", kind: "stablecoin", decimals: 6, minorName: "micro-USDC" },
};

/** Render an integer minor-unit amount as an exact decimal string. */
export function formatAmount(asset: AssetCode, minor: bigint | number, opts: { trim?: boolean } = {}): string {
  const a = ASSETS[asset];
  const neg = BigInt(minor) < 0n;
  const abs = neg ? -BigInt(minor) : BigInt(minor);
  const base = 10n ** BigInt(a.decimals);
  const whole = abs / base;
  let frac = (abs % base).toString().padStart(a.decimals, "0");
  if (opts.trim) frac = frac.replace(/0+$/, "");
  const wholeStr = whole.toLocaleString("en-US");
  return `${neg ? "-" : ""}${wholeStr}${frac ? "." + frac : ""}`;
}

export function fmt(asset: AssetCode, minor: bigint | number): string {
  return `${formatAmount(asset, minor)} ${asset}`;
}

/** Multiply then divide with half-up rounding; returns the rounding applied in minor units. */
export function mulDivRound(amount: bigint, num: bigint, den: bigint): { value: bigint; rounding: bigint } {
  const product = amount * num;
  const q = product / den;
  const r = product % den;
  const roundedUp = r * 2n >= den ? q + 1n : q;
  // rounding = what we reported minus the exact quotient, expressed in output minor units (±1 or 0)
  const exactIsInteger = r === 0n;
  return { value: roundedUp, rounding: exactIsInteger ? 0n : roundedUp - q === 1n ? 1n : 0n };
}

/* ------------------------------------------------------------------ records */

export type Evidence = "attested" | "referenced" | "unknown" | "outside_coverage";

export const EVIDENCE_LABEL: Record<Evidence, string> = {
  attested: "Attested",
  referenced: "Referenced",
  unknown: "Unknown",
  outside_coverage: "Outside coverage",
};

export const EVIDENCE_HELP: Record<Evidence, string> = {
  attested: "A signed statement by a participant is attached. The signature authenticates the signer; it does not prove the statement is true.",
  referenced: "The record points at an external artifact (for example a chain transaction or a settlement reference) that can be checked.",
  unknown: "No evidence is available for this segment. It is shown as unknown, not assumed.",
  outside_coverage: "The value moved through a system DollarDNA does not record. History resumes only if it re-enters coverage.",
};

export interface Parcel {
  id: string;
  asset: AssetCode;
  /** Minor units, integer. */
  amount: bigint;
  holder: string;
  parents: string[];
  children: string[];
  /** A parcel that has been split, merged, converted, or transferred away is consumed: history, not a holding. */
  status: "current" | "consumed";
  createdAt: string;
  evidence: Evidence;
  label: string;
}

export interface Rate {
  /** Output minor units per `den` input minor units, as an exact fraction. */
  num: bigint;
  den: bigint;
  /** Human label, e.g. "1 BTC = $60,000.00 (example)". */
  label: string;
}

export interface Conversion {
  inputAsset: AssetCode;
  outputAsset: AssetCode;
  inputMinor: bigint;
  feeMinor: bigint;
  feeLabel: string;
  netInputMinor: bigint;
  rate: Rate;
  outputMinor: bigint;
  roundingMinor: bigint;
  reference: string;
  timestamp: string;
}

export type EventKind = "entry" | "convert" | "split" | "transfer" | "context" | "rule";

export interface JourneyEvent {
  n: number;
  id: string;
  kind: EventKind;
  title: string;
  summary: string;
  inputs: string[];
  outputs: string[];
  details: [string, string][];
  conversion?: Conversion;
  evidence: Evidence;
  /** Everything in this demo is conceptual; the field exists so a real implementation can flip it. */
  status: "conceptual";
}

export interface Scenario {
  parcels: Parcel[];
  events: JourneyEvent[];
  /** Example USD rates used only for the labeled example valuation. */
  exampleRates: { BTC: Rate; USDC: Rate };
  people: { sender: string; recipient: string };
}

/* ------------------------------------------------------------------ scenario */

const T0 = "2026-10-19T14:00:00Z";
const t = (m: number) => new Date(Date.parse(T0) + m * 60_000).toISOString();

/** 0.002 BTC → USD → USDC → a payment to a fictional recipient. Deterministic. */
export function buildScenario(): Scenario {
  const sender = "You (demo)";
  const recipient = "Maria R. (fictional recipient)";
  const parcels = new Map<string, Parcel>();
  const events: JourneyEvent[] = [];

  const add = (p: Omit<Parcel, "children" | "status">): Parcel => {
    const full: Parcel = { ...p, children: [], status: "current" };
    parcels.set(p.id, full);
    for (const pid of p.parents) {
      const parent = parcels.get(pid);
      if (parent) parent.children.push(p.id);
    }
    return full;
  };
  const consume = (...ids: string[]) => ids.forEach((id) => { const p = parcels.get(id); if (p) p.status = "consumed"; });

  // 1 — record entry: 0.002 BTC enters coverage.
  const btc = add({ id: "P1", asset: "BTC", amount: 200_000n, holder: sender, parents: [], createdAt: t(0), evidence: "referenced", label: "BTC parcel · entry" });
  events.push({
    n: 1, id: "E1", kind: "entry", title: "Record entry", status: "conceptual", evidence: "referenced",
    summary: "0.002 BTC enters supported coverage. The starting record points at an example on-chain transaction reference. No Bitcoin is created; a record is.",
    inputs: [], outputs: [btc.id],
    details: [["Asset", "Bitcoin (BTC)"], ["Amount", `${fmt("BTC", btc.amount)} · ${btc.amount.toLocaleString("en-US")} satoshis`], ["Evidence", "Referenced · example tx ref 7f3a…c91e"], ["Holder", sender], ["Timestamp", t(0)]],
  });

  // 2 — convert BTC → USD at an example rate, minus an example fee.
  const btcUsd: Rate = { num: 6_000_000n, den: 100_000_000n, label: "1 BTC = $60,000.00 · example rate, not a quote" };
  const gross = mulDivRound(btc.amount, btcUsd.num, btcUsd.den); // 12,000 cents
  const fee1 = mulDivRound(gross.value, 75n, 10_000n); // 0.75% example convenience fee = 90 cents
  const net1 = gross.value - fee1.value; // 11,910 cents
  const usd = add({ id: "P2", asset: "USD", amount: net1, holder: sender, parents: [btc.id], createdAt: t(3), evidence: "referenced", label: "USD parcel · from conversion" });
  consume(btc.id);
  const conv1: Conversion = {
    inputAsset: "BTC", outputAsset: "USD", inputMinor: btc.amount, feeMinor: fee1.value, feeLabel: "0.75% example convenience fee, charged in USD",
    netInputMinor: gross.value - fee1.value, rate: btcUsd, outputMinor: net1, roundingMinor: gross.rounding + fee1.rounding,
    reference: "CNV-0001 (example)", timestamp: t(3),
  };
  events.push({
    n: 2, id: "E2", kind: "convert", title: "Convert BTC → USD", status: "conceptual", evidence: "referenced",
    summary: "The BTC parcel is consumed and a USD parcel is created, linked to it. The Bitcoin did not become a dollar — an exchange happened, and both sides of it are recorded.",
    inputs: [btc.id], outputs: [usd.id], conversion: conv1,
    details: [["Input", fmt("BTC", btc.amount)], ["Example rate", btcUsd.label], ["Gross", fmt("USD", gross.value)], ["Example fee", `− ${fmt("USD", fee1.value)}`], ["Rounding", `${fmt("USD", conv1.roundingMinor)} (half-up, in cents)`], ["Output", fmt("USD", net1)], ["Reference", conv1.reference]],
  });

  // 3 — split USD: $80.00 to convert, $39.10 kept.
  const usdA = add({ id: "P3", asset: "USD", amount: 8_000n, holder: sender, parents: [usd.id], createdAt: t(5), evidence: "referenced", label: "USD parcel · to convert" });
  const usdB = add({ id: "P4", asset: "USD", amount: usd.amount - 8_000n, holder: sender, parents: [usd.id], createdAt: t(5), evidence: "referenced", label: "USD parcel · kept" });
  consume(usd.id);
  events.push({
    n: 3, id: "E3", kind: "split", title: "Split USD", status: "conceptual", evidence: "referenced",
    summary: "One USD parcel becomes two. Same asset, same total, both children point at the same parent.",
    inputs: [usd.id], outputs: [usdA.id, usdB.id],
    details: [["Parent", fmt("USD", usd.amount)], ["Child A", fmt("USD", usdA.amount)], ["Child B", fmt("USD", usdB.amount)], ["Conservation", `${fmt("USD", usdA.amount + usdB.amount)} = parent`]],
  });

  // 4 — convert USD → USDC at an example 1:1 rate, minus an example swap fee.
  const usdUsdc: Rate = { num: 1_000_000n, den: 100n, label: "1 USD = 1.000000 USDC · example rate, not a quote" };
  const fee2 = mulDivRound(usdA.amount, 25n, 10_000n); // 0.25% = 20 cents
  const net2 = usdA.amount - fee2.value; // 7,980 cents
  const out2 = mulDivRound(net2, usdUsdc.num, usdUsdc.den); // 79,800,000 micro-USDC
  const usdc = add({ id: "P5", asset: "USDC", amount: out2.value, holder: sender, parents: [usdA.id], createdAt: t(7), evidence: "referenced", label: "USDC parcel · from conversion" });
  consume(usdA.id);
  const conv2: Conversion = {
    inputAsset: "USD", outputAsset: "USDC", inputMinor: usdA.amount, feeMinor: fee2.value, feeLabel: "0.25% example swap fee, charged in USD",
    netInputMinor: net2, rate: usdUsdc, outputMinor: out2.value, roundingMinor: fee2.rounding + out2.rounding, reference: "CNV-0002 (example)", timestamp: t(7),
  };
  events.push({
    n: 4, id: "E4", kind: "convert", title: "Convert USD → USDC", status: "conceptual", evidence: "referenced",
    summary: "A second linked exchange. The USDC parcel's history now reaches back through the USD parcel to the original Bitcoin entry.",
    inputs: [usdA.id], outputs: [usdc.id], conversion: conv2,
    details: [["Input", fmt("USD", usdA.amount)], ["Example fee", `− ${fmt("USD", fee2.value)}`], ["Net input", fmt("USD", net2)], ["Example rate", usdUsdc.label], ["Rounding", `${fmt("USDC", conv2.roundingMinor)} (half-up, in micro-USDC)`], ["Output", fmt("USDC", out2.value)], ["Reference", conv2.reference]],
  });

  // 5 — transfer: split USDC and send 50 to the recipient with context attached.
  const sent = add({ id: "P6", asset: "USDC", amount: 50_000_000n, holder: recipient, parents: [usdc.id], createdAt: t(9), evidence: "attested", label: "USDC parcel · paid to recipient" });
  const kept = add({ id: "P7", asset: "USDC", amount: usdc.amount - 50_000_000n, holder: sender, parents: [usdc.id], createdAt: t(9), evidence: "referenced", label: "USDC parcel · kept" });
  consume(usdc.id);
  events.push({
    n: 5, id: "E5", kind: "transfer", title: "Transfer with context", status: "conceptual", evidence: "attested",
    summary: "50 USDC moves to the recipient as a new parcel; the remainder stays with the sender. A purpose, a reference, and a signed note travel with the paid parcel.",
    inputs: [usdc.id], outputs: [sent.id, kept.id],
    details: [["Parent", fmt("USDC", usdc.amount)], ["Paid", `${fmt("USDC", sent.amount)} → ${recipient}`], ["Kept", fmt("USDC", kept.amount)], ["Purpose", "Invoice #1042 — brand design (example)"], ["Reference", "INV-1042 (example)"], ["Attestation", "Signed by the sender's key (example). Authenticates the sender's statement; does not prove the work was delivered."], ["Conservation", `${fmt("USDC", sent.amount + kept.amount)} = parent`]],
  });

  // 6 — receiving rule evaluation on the recipient's side.
  events.push({
    n: 6, id: "E6", kind: "rule", title: "Evaluate receiving rule", status: "conceptual", evidence: "attested",
    summary: "The recipient's rule — accept parcels with a recorded origin and a stated purpose — is evaluated against the history that is actually available. Here it passes. Where evidence is missing, the rule would see 'unknown', not 'fine'.",
    inputs: [sent.id], outputs: [sent.id],
    details: [["Rule (example)", "Accept if: origin recorded AND purpose present"], ["Origin", "BTC entry P1 · referenced"], ["Linked exchanges", "CNV-0001, CNV-0002 · referenced"], ["Purpose", "Present · attested by sender"], ["Result", "Pass — on the available evidence"], ["Not proven", "That the invoice was real, or how the funds are used next"]],
  });

  return {
    parcels: [...parcels.values()],
    events,
    exampleRates: { BTC: btcUsd, USDC: { num: 100n, den: 1_000_000n, label: "1 USDC = $1.00 · example" } },
    people: { sender, recipient },
  };
}

/* ------------------------------------------------------------------ queries */

/** Current holdings by asset: consumed parcels are history and never counted. */
export function holdings(parcels: Parcel[], holder?: string): Record<AssetCode, bigint> {
  const out: Record<AssetCode, bigint> = { BTC: 0n, USD: 0n, USDC: 0n };
  for (const p of parcels) {
    if (p.status !== "current") continue;
    if (holder && p.holder !== holder) continue;
    out[p.asset] += p.amount;
  }
  return out;
}

/** Example valuation in USD cents at the scenario's labeled example rates. */
export function exampleValuationCents(h: Record<AssetCode, bigint>, rates: Scenario["exampleRates"]): bigint {
  const btc = mulDivRound(h.BTC, rates.BTC.num, rates.BTC.den).value;
  const usdc = mulDivRound(h.USDC, rates.USDC.num, rates.USDC.den).value;
  return btc + h.USD + usdc;
}

/** Walk ancestry: every parcel id that contributed to `id`, nearest first. */
export function ancestors(parcels: Parcel[], id: string): string[] {
  const byId = new Map(parcels.map((p) => [p.id, p]));
  const seen: string[] = [];
  const stack = [...(byId.get(id)?.parents ?? [])];
  while (stack.length) {
    const cur = stack.shift()!;
    if (seen.includes(cur)) continue;
    seen.push(cur);
    stack.push(...(byId.get(cur)?.parents ?? []));
  }
  return seen;
}

/** Depth of each parcel from its roots — used to lay out the lineage diagram. */
export function depths(parcels: Parcel[]): Record<string, number> {
  const byId = new Map(parcels.map((p) => [p.id, p]));
  const memo: Record<string, number> = {};
  const d = (id: string): number => {
    if (memo[id] !== undefined) return memo[id];
    const p = byId.get(id)!;
    memo[id] = p.parents.length ? 1 + Math.max(...p.parents.map(d)) : 0;
    return memo[id];
  };
  parcels.forEach((p) => d(p.id));
  return memo;
}

/** State after applying the first `n` events — parcels created later are hidden, status recomputed. */
export function stateAt(s: Scenario, n: number): Parcel[] {
  const visibleIds = new Set<string>();
  const consumedIds = new Set<string>();
  for (const e of s.events.slice(0, n)) {
    e.outputs.forEach((id) => visibleIds.add(id));
    if (e.kind === "convert" || e.kind === "split" || e.kind === "transfer") e.inputs.forEach((id) => consumedIds.add(id));
  }
  return s.parcels
    .filter((p) => visibleIds.has(p.id))
    .map((p) => ({ ...p, status: consumedIds.has(p.id) ? "consumed" : "current", children: p.children.filter((c) => visibleIds.has(c)) }));
}
