/**
 * LOADIT.WORLD — structured content and the network data model.
 *
 * Everything the site says about routes, networks, layers, phases, and use
 * cases lives here, not in components. Every claim carries a status so the
 * site can never visually imply a future capability exists today.
 */

export const WORLD = {
  name: "Loadit.world",
  domain: "loadit.world",
  url: "https://loadit.world",
  title: "Loadit.world — The World Where Money Works Like the Internet",
  description:
    "Explore Loadit's vision for an intelligent financial routing layer connecting cash, banks, digital assets, merchants, and financial networks.",
  tagline: "The world where money works like the internet.",
  parent: { name: "Loadit, Inc.", url: "https://loadit.net" },
  global: { name: "Loadit Global", url: "https://loaditglobal.com" },
  contact: "colt@loadit.net",
} as const;

export const NAV = [
  { label: "Vision", href: "#vision" },
  { label: "Network", href: "#network" },
  { label: "Patent", href: "#technology" },
  { label: "People", href: "#people" },
  { label: "Business", href: "#business" },
  { label: "Roadmap", href: "#roadmap" },
] as const;

/* ------------------------------------------------------------ truthfulness */

/** LIVE — available today. BUILDING — actively in development. VISION — long-term architecture. */
export type Status = "live" | "building" | "vision";

export const STATUS_LABEL: Record<Status, string> = {
  live: "LIVE",
  building: "BUILDING",
  vision: "VISION",
};

export const STATUS_HELP: Record<Status, string> = {
  live: "Currently available.",
  building: "Actively being developed.",
  vision: "Long-term Loadit architecture.",
};

/* ------------------------------------------------------------ network model */

export type NodeCategory = "cash" | "bank" | "asset" | "merchant" | "wallet" | "network";

export interface FinancialNode {
  id: string;
  label: string;
  category: NodeCategory;
  /** Geographic anchor for the globe and the map (illustrative placement). */
  lat: number;
  lon: number;
}

export interface FinancialRoute {
  from: string;
  to: string;
  status: Status;
  description?: string;
}

/** The nodes of the world — placed on real cities so the globe reads as a planet, not a diagram. */
export const NODES: FinancialNode[] = [
  { id: "cash", label: "Cash", category: "cash", lat: 32.78, lon: -96.8 }, // Dallas
  { id: "bank", label: "Bank", category: "bank", lat: 40.71, lon: -74.0 }, // New York
  { id: "intl-bank", label: "International bank", category: "bank", lat: 51.51, lon: -0.13 }, // London
  { id: "usdc", label: "USDC", category: "asset", lat: 37.77, lon: -122.42 }, // San Francisco
  { id: "btc", label: "Bitcoin", category: "asset", lat: 47.37, lon: 8.54 }, // Zurich
  { id: "stablecoin", label: "Stablecoin", category: "asset", lat: 1.35, lon: 103.82 }, // Singapore
  { id: "wallet", label: "Wallet", category: "wallet", lat: 19.43, lon: -99.13 }, // Mexico City
  { id: "merchant", label: "Merchant", category: "merchant", lat: 35.68, lon: 139.69 }, // Tokyo
  { id: "blockchain", label: "Blockchain", category: "network", lat: -23.55, lon: -46.63 }, // São Paulo
  { id: "payment-network", label: "Payment network", category: "network", lat: 25.2, lon: 55.27 }, // Dubai
  { id: "remittance", label: "Remittance network", category: "network", lat: 14.6, lon: 120.98 }, // Manila
  { id: "mobile-money", label: "Mobile money", category: "wallet", lat: -1.29, lon: 36.82 }, // Nairobi
];

/** Routes drawn on the globe and the map. Illustrative corridors, labeled. */
export const ROUTES: FinancialRoute[] = [
  { from: "bank", to: "usdc", status: "building", description: "Bank account → USDC in a wallet the recipient controls." },
  { from: "cash", to: "wallet", status: "building", description: "Cash at a counter → a digital wallet. Certified; launching with the production build." },
  { from: "usdc", to: "merchant", status: "vision", description: "USDC paid → USD settlement for the merchant." },
  { from: "btc", to: "bank", status: "vision", description: "Bitcoin → a bank account." },
  { from: "intl-bank", to: "stablecoin", status: "vision", description: "International bank → digital asset." },
  { from: "blockchain", to: "stablecoin", status: "building", description: "One chain → another, via the conversion engine." },
  { from: "stablecoin", to: "remittance", status: "vision", description: "Stablecoin → local settlement through a remittance partner." },
  { from: "intl-bank", to: "mobile-money", status: "vision", description: "Bank → mobile money." },
  { from: "cash", to: "usdc", status: "building", description: "Cash → USDC. The first corridor." },
  { from: "payment-network", to: "merchant", status: "vision", description: "Card network → merchant settlement in the currency they choose." },
];

/* ------------------------------------------------------------ route builder */

export interface ValueForm {
  id: string;
  label: string;
  short: string;
  category: NodeCategory;
}

export const PAY_WITH: ValueForm[] = [
  { id: "cash", label: "Cash", short: "CASH", category: "cash" },
  { id: "bank", label: "Bank account", short: "BANK", category: "bank" },
  { id: "card", label: "Card", short: "CARD", category: "bank" },
  { id: "btc", label: "Bitcoin", short: "BTC", category: "asset" },
  { id: "eth", label: "Ethereum", short: "ETH", category: "asset" },
  { id: "sol", label: "Solana", short: "SOL", category: "asset" },
  { id: "usdc", label: "USDC", short: "USDC", category: "asset" },
];

export const RECEIVE: ValueForm[] = [
  { id: "cash", label: "Cash", short: "CASH", category: "cash" },
  { id: "bank", label: "Bank account", short: "BANK", category: "bank" },
  { id: "btc", label: "Bitcoin", short: "BTC", category: "asset" },
  { id: "eth", label: "Ethereum", short: "ETH", category: "asset" },
  { id: "sol", label: "Solana", short: "SOL", category: "asset" },
  { id: "usdc", label: "USDC", short: "USDC", category: "asset" },
  { id: "merchant", label: "Merchant settlement", short: "MERCHANT", category: "merchant" },
];

const DIGITAL = new Set(["btc", "eth", "sol", "usdc"]);

export interface BuiltRoute {
  id: string;
  status: Status;
  legs: string[];
  settlement: string;
  networks: string;
  note: string;
}

/**
 * Status for a pay-with → receive pair. Derived from what actually exists:
 *  - card → digital asset: live today on loadit.net (licensed partners, non-custodial delivery)
 *  - cash → digital asset: certified with a licensed cash network; launches with the production build
 *  - bank → digital asset, chain → chain: in the routing engine, not yet a customer surface
 *  - anything that ends in cash, a bank account, or merchant settlement: vision
 */
export function buildRoute(from: ValueForm, to: ValueForm): BuiltRoute {
  const id = `${from.short}-${to.short}`.toLowerCase();
  const same = from.id === to.id;
  if (same) {
    return { id, status: "live", legs: [from.label, "Loadit", to.label], settlement: "No conversion required", networks: "—", note: "Same form in and out. Loadit is only needed when the two sides differ." };
  }
  if (from.id === "card" && DIGITAL.has(to.id)) {
    return { id, status: "live", legs: [from.label, "Loadit · HQ", `${to.label} network`, to.label], settlement: "Non-custodial, to a wallet the recipient controls", networks: "Licensed card partner → selected chain", note: "Available today through Loadit. Card purchases are completed by licensed partners; HQ selects the network." };
  }
  if (from.id === "cash" && DIGITAL.has(to.id)) {
    return { id, status: "building", legs: [from.label, "Licensed cash network", "Loadit · HQ", to.label], settlement: "Non-custodial, to a wallet the recipient controls", networks: "Cash network → conversion → selected chain", note: "Certification with a licensed national cash network is complete. Consumer cash-in launches with the production build." };
  }
  if (from.id === "bank" && DIGITAL.has(to.id)) {
    return { id, status: "building", legs: [from.label, "Loadit · HQ", to.label], settlement: "Non-custodial, to a wallet the recipient controls", networks: "Bank rail → conversion → selected chain", note: "Bank-funded routes exist in the routing engine today; the customer surface is in build." };
  }
  if (DIGITAL.has(from.id) && DIGITAL.has(to.id)) {
    return { id, status: "building", legs: [from.label, "Loadit · UVCE", to.label], settlement: "Converted and delivered on the destination network", networks: "Source chain → conversion engine → destination chain", note: "The conversion engine already plans these legs inside a load; a standalone convert surface is next." };
  }
  if (to.id === "merchant") {
    return { id, status: "vision", legs: [from.label, "Loadit · HQ + UVCE", "Merchant settlement"], settlement: "Merchant receives the currency it chose", networks: "Source → conversion → card or bank settlement", note: "The customer pays with what they have; the merchant receives what it wants. Requires issuing and settlement partners. Vision." };
  }
  if (to.id === "cash" || to.id === "bank") {
    return { id, status: "vision", legs: [from.label, "Loadit · HQ + UVCE", to.label], settlement: to.id === "cash" ? "Local cash access through a licensed partner" : "Bank settlement through a licensed partner", networks: "Source → conversion → exit partner", note: "An exit path, not just an entry. Depends on off-ramp partners per corridor. Vision." };
  }
  return { id, status: "vision", legs: [from.label, "Loadit", to.label], settlement: "—", networks: "—", note: "Part of the long-term network vision." };
}

/* ------------------------------------------------------------ fragmentation */

export const SYSTEMS = [
  "Banks",
  "Cash",
  "Cards",
  "Blockchains",
  "Stablecoins",
  "Wallets",
  "Payment processors",
  "Remittance networks",
  "Merchant systems",
] as const;

export const FRICTIONS = [
  "exchanges",
  "settlement",
  "liquidity",
  "network compatibility",
  "banking rails",
  "wallets",
  "conversion",
  "fees",
  "compliance",
  "routing",
] as const;

/* ------------------------------------------------------------ intent */

export const YOU_TELL = [
  "What am I sending?",
  "Where should it go?",
  "What should the recipient receive?",
  "What requirements matter?",
] as const;

export const LOADIT_DETERMINES = [
  "Possible route",
  "Network",
  "Conversion",
  "Liquidity path",
  "Settlement mechanism",
  "Cost",
  "Speed",
  "Risk",
  "Availability",
  "Compliance requirements",
  "Final delivery method",
] as const;

/* ------------------------------------------------------------ the patent */

/** The Loadit Unified Financial Rail — patent pending. Public filing facts only. */
export const PATENT = {
  shortTitle: "Loadit Unified Financial Rail",
  title:
    "Self-Healing, AI-Orchestrated, Quantum-Optimized, Temporally Programmable, Offline-Resilient, Multi-Reality Transaction and Universal Value Conversion Architecture for Global Financial Settlement",
  status: "Patent pending — application filed; no patent granted.",
  claims: 25,
  subsystems: 10,
  figures: 4,
  independentClaim:
    "A unified financial settlement system comprising an AI-orchestrated routing engine, a universal value conversion engine, a quantum optimization layer, a temporal settlement subsystem, an identity-verified offline transaction subsystem, a multi-reality transaction interface layer, a geo-temporal compliance engine, and a point-of-sale transaction intake layer — ingesting cash, card, fiat, and digital-asset payments and executing settlement across heterogeneous financial rails.",
  links: {
    overview: "https://loadit.net/#patents",
    dataRoom: "https://loadit.net/data-room",
  },
} as const;

export interface Layer {
  id: string;
  code: string;
  section: string;
  name: string;
  role: string;
  body: string;
  today: string;
  claims: string;
  status: Status;
}

/**
 * The ten subsystems of the unified rail, in the order the patent describes
 * them (§7.1–§7.10). Conceptual level only — the filing is public; the
 * implementation is not. "today" says what actually exists in the runtime.
 */
export const STACK: Layer[] = [
  {
    id: "intake",
    code: "INTAKE",
    section: "7.1",
    name: "Transaction intake layer",
    role: "Where value enters: cash, card, fiat, QR, NFC, remote invoicing — and, later, immersive interfaces.",
    body: "Every entry point produces the same standardized transaction object: a cash counter binding a cash event to a merchant identity, a card tap tokenized at the terminal, a QR code carrying merchant, asset preference, and settlement instructions, or an API-initiated request. Intent is captured once, in one shape, whatever the medium.",
    today: "Card intake is live on loadit.net through licensed partners. Cash intake is certified with a licensed national cash network and launches with the production build. POS and QR flows are in build; immersive intake is vision.",
    claims: "Claims 1–4",
    status: "building",
  },
  {
    id: "uvce",
    code: "UVCE",
    section: "7.2",
    name: "Universal Value Conversion Engine",
    role: "Translates any form of value into any other through one normalization model.",
    body: "Fiat-to-digital, digital-to-fiat, and cross-asset translation across currencies, stablecoins, tokenized assets, loyalty units, energy credits, and programmable instruments. Liquidity is sourced and allocated across venues on price, depth, slippage, and counterparty risk; a forecasting layer can shift execution timing; programmable conversion logic lets a transaction say \"convert to this stablecoin\", \"split across these assets\", or \"wait for better conditions\". Fees are normalized and minimized across every leg.",
    today: "Runs inside every load today: venue sourcing, forecast, fee breakdown, and the conversion plan are produced by the engine in the live demo. Non-custodial throughout.",
    claims: "Claims 5, 8",
    status: "building",
  },
  {
    id: "aore",
    code: "HQ · AORE",
    section: "7.3",
    name: "AI-Orchestrated Routing Engine",
    role: "The central intelligence. Evaluates every possible settlement path and selects one.",
    body: "A real-time network state analyzer, a multi-rail path evaluator over the whole combinatorial space of routes, a learning routing model, a predictive pre-settlement engine that anticipates congestion and fee spikes before they land, a risk and compliance scorer, and a deterministic selection unit weighing cost, speed, compliance, security, counterparty exposure, temporal constraints, and liquidity reliability. If a chosen path degrades mid-flight, it re-routes live.",
    today: "This is HQ. Route scoring across six networks with cost, time, liquidity, risk, and certification weights, locked with a time-to-live, runs today in the live demo on Loadit Global.",
    claims: "Claims 7, 17",
    status: "building",
  },
  {
    id: "qol",
    code: "QOL",
    section: "7.4",
    name: "Quantum Optimization Layer",
    role: "Quantum-assisted pathfinding, risk evaluation, and key distribution — optional, with classical fallback.",
    body: "Quantum annealing, amplitude amplification, and variational algorithms applied to large settlement graphs; quantum-enhanced risk sampling; quantum key distribution where supported; a hybrid controller that decides what runs classically and what is delegated, with deterministic fallback; and post-quantum hashing and signatures throughout.",
    today: "A Labs track. Hybrid evaluation experiments publish verification receipts at loadit.net/quantum; classical routing is always the live path.",
    claims: "Claims 9, 18",
    status: "vision",
  },
  {
    id: "tsm",
    code: "TSM",
    section: "7.5",
    name: "Temporal Settlement Subsystem",
    role: "Decouples when a transaction is initiated from when — and on what conditions — it settles.",
    body: "Retroactive settlement against verifiable historical ledger states, predictive settlement under forecast conditions, condition-based settlement on rate, liquidity, fee, volatility, or event triggers, and a programming layer for delayed, staged, partial, or time-bounded settlement. Historical states are verified with authenticated checkpoints and zero-knowledge proofs; future commitments with verifiable delay functions.",
    today: "Designed and claimed; not in the runtime. Route locks with a time-to-live are the only temporal behaviour live today.",
    claims: "Claims 10, 19, 20",
    status: "vision",
  },
  {
    id: "ivor",
    code: "IVOR",
    section: "7.6",
    name: "Identity-Verified Offline Rail",
    role: "Authenticated, escrow-secured transactions with no connectivity at all.",
    body: "Biometrics bound to a decentralized identity, a behavioral fingerprint as a second factor, a local post-quantum escrow vault that makes offline double-spend and forgery impossible, deferred synchronization over mobile, Wi-Fi, satellite, or mesh when connectivity returns, an offline compliance buffer, and replay prevention. Built for disasters, remote regions, and travel without data.",
    today: "Designed and claimed; not in the runtime.",
    claims: "Claims 11, 12, 21",
    status: "vision",
  },
  {
    id: "shf",
    code: "SHF",
    section: "7.7",
    name: "Self-healing, fault-tolerant architecture",
    role: "Detects, isolates, and recovers from rail failures without the customer noticing.",
    body: "Global fault detection across chains, bridges, processors, liquidity endpoints, and relays; failure classification by severity; autonomous re-routing that preserves compliance, identity continuity, and temporal conditions; settlement packet replication with deterministic deduplication; chain-health prediction; adaptive liquidity redistribution; graceful degradation instead of shutdown; and post-recovery reconciliation.",
    today: "In the runtime: when a leg fails the payment is parked, the remaining legs are re-scored, and a new route is locked under the same identifier with deterministic idempotency keys. Shown in the rail demo's failure drill.",
    claims: "Claims 16, 24",
    status: "building",
  },
  {
    id: "mrti",
    code: "MRTI",
    section: "7.8",
    name: "Multi-Reality Transaction Interface",
    role: "Transactions initiated from AR, VR, XR, and brain–computer interfaces.",
    body: "Gesture, gaze, spatial, and controller interactions captured as transaction intent; mixed-reality overlays mapped to real merchants and SKUs; neural-intent signals converted into cryptographically signed instructions bound to the user's identity; continuous biometric authentication across a session; and a reality-abstraction layer that normalizes all of it into the same transaction object as a card tap.",
    today: "Vision. Claimed to anchor the architecture's forward boundary; nothing in the product today.",
    claims: "Claims 13, 14, 22",
    status: "vision",
  },
  {
    id: "gtce",
    code: "GTCE",
    section: "7.9",
    name: "Geo-Temporal Compliance Engine",
    role: "Jurisdiction-, asset-, and time-aware rules enforced on every route, online or offline.",
    body: "Resolves where payer and merchant actually are, applies a codified policy matrix of national, regional, cross-border, and sanctions rules, and selects only settlement rails that pass. Compliance proofs can be produced without disclosing underlying user data.",
    today: "Compliance is a scored dimension of every route in the engine today; the licensed party on each rail performs the regulated act. The full policy matrix is in build.",
    claims: "Claims 15, 23",
    status: "building",
  },
  {
    id: "pqc",
    code: "SECURITY",
    section: "7.10",
    name: "Security architecture and post-quantum cryptography",
    role: "Defense in depth against present and future attackers, including quantum ones.",
    body: "Lattice-, code-, and hash-based signatures and encryption securing transaction signing, escrow commitments, identity bindings, and routing payloads; quantum-secure channels where supported; tiered identity integrity that requires factors to converge; secure-enclave execution; multi-layer anomaly detection; and cross-ledger integrity verification with Merkle proofs and tamper-evident receipts.",
    today: "Post-quantum (ML-DSA) signing already runs in the runtime for settlement objects. The broader tiered identity and anomaly stack is in build.",
    claims: "Claims 18, 25",
    status: "building",
  },
];

/* ------------------------------------------------------------ B2C — loadit.net */

export interface ConsumerAction {
  verb: string;
  name: string;
  line: string;
  status: Status;
  now: string;
  href: string;
}

/** The seven money actions of the consumer product, as they stand today. */
export const CONSUMER_ACTIONS: ConsumerAction[] = [
  { verb: "LOAD", name: "Load", line: "Turn card or cash into one supported digital asset, delivered to a wallet you control.", status: "live", now: "Card is live today. Cash-in is certified with a licensed national cash network and launches with the production build.", href: "https://loadit.net/install" },
  { verb: "LOAD · MIX", name: "Multi-Asset Load", line: "One funding event, several assets, by dollar or percentage — a saved Load Mix.", status: "vision", now: "Phase 1 scope; not yet in the runtime.", href: "https://loadit.net/#how" },
  { verb: "SEND", name: "Send", line: "Send what you have; the other person receives what they want.", status: "vision", now: "Phase 2.", href: "https://loadit.net/intent" },
  { verb: "RECEIVE", name: "Receive", line: "Set how incoming value should arrive — one asset, one currency, or an allocation rule.", status: "vision", now: "Phase 4.", href: "https://loadit.net/intent" },
  { verb: "CONVERT", name: "Convert", line: "Change value you already hold into one or many other supported assets.", status: "building", now: "The conversion engine runs inside every load today; a standalone convert screen is next.", href: "https://loadit.net/exchange" },
  { verb: "CASH OUT", name: "Cash Out", line: "Digital value back to cash or fiat through an eligible exit path.", status: "vision", now: "Depends on off-ramp partners per corridor.", href: "https://loadit.net/#how" },
  { verb: "CONNECT", name: "Connect", line: "Move value between financial apps, even when sender and recipient use different ones.", status: "vision", now: "Phase 5.", href: "https://loadit.net/#how" },
  { verb: "LOADIT ONE", name: "Loadit One", line: "A debit card that spends supported fiat or crypto, with several sources behind one purchase.", status: "vision", now: "Phase 3 pilot with an issuing partner. Credit is a later, separate product.", href: "https://loadit.net/#how" },
];

export const CONSUMER_FACTS = [
  ["Where", "loadit.net · iOS and Android app · pay links on load.money"],
  ["Custody", "Non-custodial. Value is delivered to a wallet the person controls; Loadit never holds funds."],
  ["Fees", "Disclosed on every route before you confirm. Estimates, never hidden spreads."],
  ["Rewards", "Load.club — earn your way in; membership is earned, not bought."],
] as const;

/* ------------------------------------------------------------ B2B — loaditglobal.com */

export interface BusinessEntry {
  label: string;
  desc: string;
  href: string;
  status: Status;
}

export const BUSINESS: BusinessEntry[] = [
  { label: "Live routing demo", desc: "A real request to HQ from the page: network, cost, time, confidence.", href: "https://loaditglobal.com/developers/sandbox", status: "live" },
  { label: "Embedded capabilities", desc: "Load, Send, Connect, Convert, Receive, Cash Out, and spend — inside your product.", href: "https://loaditglobal.com/capabilities", status: "building" },
  { label: "API & transaction model", desc: "One endpoint today; one transaction object with many legs, published for review.", href: "https://loaditglobal.com/developers/api", status: "building" },
  { label: "Solutions by segment", desc: "Banks, exchanges, wallets, fintechs, payroll, remittance, merchants — and when not to use Loadit.", href: "https://loaditglobal.com/solutions", status: "building" },
  { label: "Pricing & economics", desc: "Disclosed, route by route. No fee for standing in the way.", href: "https://loaditglobal.com/pricing", status: "building" },
  { label: "Early access", desc: "Keys go to early-access partners first, by a person.", href: "https://loaditglobal.com/access", status: "building" },
];

/* ------------------------------------------------------------ use cases */

export interface Example {
  pays: string;
  receives: string;
  status: Status;
}

export const MERCHANT_EXAMPLES: Example[] = [
  { pays: "BTC", receives: "USD", status: "vision" },
  { pays: "USDC", receives: "Bank settlement", status: "vision" },
  { pays: "Cash", receives: "Digital balance", status: "vision" },
];

export const BANK_EXAMPLES: Example[] = [
  { pays: "Bank", receives: "USDC", status: "building" },
  { pays: "Bank", receives: "BTC", status: "building" },
  { pays: "Stablecoin", receives: "Bank", status: "vision" },
  { pays: "International bank", receives: "Digital asset", status: "vision" },
  { pays: "Digital asset", receives: "Merchant settlement", status: "vision" },
  { pays: "Chain", receives: "Chain", status: "building" },
];

export const PEOPLE_QUESTIONS = [
  "Which blockchain?",
  "Which wallet?",
  "Which bank?",
  "Which network?",
  "Which exchange?",
  "Which processor?",
] as const;

/* ------------------------------------------------------------ world map */

export interface Corridor {
  id: string;
  from: string; // NODES id
  to: string; // NODES id
  steps: string[];
  status: Status;
}

export const CORRIDORS: Corridor[] = [
  { id: "tx-mx", from: "cash", to: "wallet", steps: ["Texas", "Loadit routing", "Mexico", "Local settlement"], status: "building" },
  { id: "ny-tokyo", from: "bank", to: "merchant", steps: ["United States bank", "Loadit", "Digital asset", "Merchant overseas"], status: "vision" },
  { id: "ldn-nbo", from: "intl-bank", to: "mobile-money", steps: ["London bank", "Loadit", "Stablecoin", "Mobile money"], status: "vision" },
  { id: "dxb-mnl", from: "payment-network", to: "remittance", steps: ["Card network", "Loadit", "Stablecoin", "Local payout"], status: "vision" },
  { id: "sf-sgp", from: "usdc", to: "stablecoin", steps: ["USDC", "Loadit · UVCE", "Another chain"], status: "building" },
  { id: "zrh-ny", from: "btc", to: "bank", steps: ["Bitcoin", "Loadit", "Bank account"], status: "vision" },
  { id: "sp-dxb", from: "blockchain", to: "payment-network", steps: ["Chain", "Loadit", "Payment network"], status: "vision" },
];

/* ------------------------------------------------------------ roadmap */

export interface Phase {
  n: string;
  title: string;
  body: string;
  status: Status;
  now: string;
}

export const PHASES: Phase[] = [
  { n: "01", title: "Cash → Digital", body: "Connecting physical cash users with digital financial networks.", status: "building", now: "Card to digital asset is live. Cash-in is certified with a licensed cash network and launches with the production build." },
  { n: "02", title: "Multi-asset routing", body: "Allowing value to move across different assets and networks.", status: "building", now: "HQ selects among six networks today; multi-asset allocation on one transaction is in build." },
  { n: "03", title: "Merchant settlement", body: "Abstracting how customers pay from how businesses receive value.", status: "vision", now: "Requires issuing and settlement partners. Designed, not built." },
  { n: "04", title: "Financial institution integration", body: "Giving banks, fintechs, wallets, and platforms a common routing layer.", status: "building", now: "Loadit Global is pre-launch with an early-access list and a published API preview." },
  { n: "05", title: "Programmable value", body: "Transactions become conditional, intelligent, and programmable.", status: "vision", now: "Temporal settlement and per-transaction logic are part of the patent-pending architecture." },
  { n: "06", title: "Global value interoperability", body: "Users interact with value. Loadit handles the rails.", status: "vision", now: "The destination state. Every corridor opens with a licensed partner and its own status." },
];

/* ------------------------------------------------------------ footer */

export const FOOTER_LINKS = [
  { label: "Loadit.net", href: "https://loadit.net" },
  { label: "Developers", href: "https://loaditglobal.com/developers" },
  { label: "Company", href: "https://loaditglobal.com/company" },
  { label: "Patent", href: "https://loadit.net/#patents" },
  { label: "Investor data room", href: "https://loadit.net/data-room" },
  { label: "Privacy", href: "https://loadit.net/privacy" },
  { label: "Terms", href: "https://loaditglobal.com/privacy" },
] as const;
