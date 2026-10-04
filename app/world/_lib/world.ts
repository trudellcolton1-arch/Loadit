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
  { label: "Technology", href: "#technology" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Developers", href: "#developers" },
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

/* ------------------------------------------------------------ the stack */

export interface Layer {
  id: string;
  code: string;
  name: string;
  role: string;
  body: string;
  status: Status;
}

/** Descriptions are drawn from the repo's own published architecture (patent-pending, conceptual level only). */
export const STACK: Layer[] = [
  {
    id: "loadit",
    code: "LOADIT",
    name: "The orchestration layer",
    role: "Captures intent, plans the route, tracks every leg.",
    body: "One transaction object for every movement of value: the source, the destination, the requirements, the plan, and the state of each leg. Non-custodial by design — Loadit routes and verifies; licensed partners execute.",
    status: "building",
  },
  {
    id: "hq",
    code: "HQ",
    name: "Intelligent routing",
    role: "Evaluates possible pathways and selects the most appropriate route.",
    body: "HQ scores every supported path on cost, speed, liquidity, availability, risk, and compliance, then locks a route with a time-to-live. When conditions change mid-flight it re-evaluates what remains under the same identifier. Route selection runs today in the live demo on Loadit Global.",
    status: "building",
  },
  {
    id: "uvce",
    code: "UVCE",
    name: "Universal Value Conversion Engine",
    role: "Normalizes different kinds of value into one settlement-ready object.",
    body: "A card authorization, cash at a counter, a stablecoin on one chain, and an asset on another become the same kind of object the rest of the system can route, price, and audit. Patent pending.",
    status: "building",
  },
  {
    id: "ivor",
    code: "IVOR",
    name: "Identity-Verified Offline Rail",
    role: "Secure financial activity without connectivity.",
    body: "Identity is verified while disconnected — biometrics, decentralized identity, behavioral signatures, secure-enclave attestation — and the transaction is sealed in escrow until it reconciles on reconnection. Part of the patent-pending architecture.",
    status: "vision",
  },
  {
    id: "tsm",
    code: "TSM",
    name: "Temporal Settlement",
    role: "Settlement tied to time and conditions, not only the moment of initiation.",
    body: "Delayed, retroactive, predictive, and condition-based settlement: a transaction can settle when a rate, a liquidity level, or an event is met, with historical state verified by proofs. Part of the patent-pending architecture.",
    status: "vision",
  },
  {
    id: "enm",
    code: "ENM",
    name: "Energy-Native Rail",
    role: "Energy as a first-class representation of value.",
    body: "Energy credits denominated, converted, and settled inside the same conversion engine as currency and digital assets. A Labs track today.",
    status: "vision",
  },
  {
    id: "programmable",
    code: "PROGRAMMABLE VALUE",
    name: "Programmable financial infrastructure",
    role: "Conditional money, programmable settlement, transaction logic.",
    body: "Per-transaction logic — settlement conditions, refunds, disputes, and compliance rules — generated and attached to the transaction object itself, so money carries its own instructions. Long-term architecture.",
    status: "vision",
  },
  {
    id: "compliance",
    code: "COMPLIANCE",
    name: "Geo-temporal compliance",
    role: "Jurisdiction-, asset-, and time-aware rules on every route.",
    body: "Compliance is a scored dimension of the route, not a gate at the end. The licensed party on each rail performs the regulated act; the router only selects paths that pass.",
    status: "building",
  },
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
  { label: "Vision", href: "#vision" },
  { label: "Privacy", href: "https://loadit.net/privacy" },
  { label: "Terms", href: "https://loaditglobal.com/privacy" },
] as const;
