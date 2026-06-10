/**
 * Single source of truth for site content.
 * Keeping copy here makes the marketing site easy to iterate on.
 */

export const SITE = {
  name: "Loadit",
  domain: "loadit.net",
  tagline: "Move Value. Anywhere.",
  description:
    "The AI-powered financial rail connecting cash, cards, crypto, stablecoins, and the future of money.",
  url: "https://loadit.net",
} as const;

// Full list — used by the mobile menu and footer.
// Page tabs use real routes; homepage sections use /#anchor so they work
// from any page.
export const NAV_LINKS = [
  { label: "Demo", href: "/#demo" },
  { label: "Exchange", href: "/exchange" },
  { label: "Energy", href: "/energy" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Earn", href: "/earn" },
  { label: "Live Mind", href: "/#live-mind" },
  { label: "Resilience", href: "/#resilience" },
  { label: "Reality", href: "/#reality" },
  { label: "Developers", href: "/#api" },
  { label: "Patents", href: "/#patents" },
  { label: "Investors", href: "/#investors" },
] as const;

// Curated subset for the desktop bar.
export const NAV_PRIMARY = [
  { label: "Exchange", href: "/exchange" },
  { label: "Energy", href: "/energy" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Earn", href: "/earn" },
  { label: "Developers", href: "/#api" },
  { label: "Patents", href: "/#patents" },
  { label: "Investors", href: "/#investors" },
] as const;

/** Networks the AI routing engine arbitrates across. */
export const NETWORKS = [
  { id: "btc", name: "Bitcoin", short: "BTC", color: "#F7931A" },
  { id: "eth", name: "Ethereum", short: "ETH", color: "#627EEA" },
  { id: "sol", name: "Solana", short: "SOL", color: "#14F195" },
  { id: "base", name: "Base", short: "BASE", color: "#0052FF" },
  { id: "xrpl", name: "XRPL", short: "XRP", color: "#23292F" },
  { id: "matic", name: "Polygon", short: "POL", color: "#8247E5" },
  { id: "ln", name: "Lightning", short: "LN", color: "#FDB813" },
  { id: "bank", name: "Banks", short: "ACH", color: "#64748B" },
] as const;

/** Section 2 — the problem timeline. */
export const TIMELINE: ReadonlyArray<{
  year: string;
  name: string;
  desc: string;
  highlight?: boolean;
}> = [
  {
    year: "1871",
    name: "The Wire",
    desc: "Western Union moves money by telegraph. One rail, one purpose.",
  },
  {
    year: "1973",
    name: "SWIFT",
    desc: "Banks agree on messages — not money. Settlement stays slow and siloed.",
  },
  {
    year: "1974",
    name: "Card Networks",
    desc: "Visa & Mastercard scale plastic. Built for retail, not for everything.",
  },
  {
    year: "2009",
    name: "Crypto",
    desc: "Bitcoin proves money can be a protocol — but each chain is an island.",
  },
  {
    year: "2018",
    name: "Stablecoins",
    desc: "Dollars go on-chain. Liquidity fragments across dozens of networks.",
  },
  {
    year: "2025",
    name: "Loadit",
    desc: "One rail that routes across all of them. Built for everything.",
    highlight: true,
  },
] as const;

/** Section 4 — the rail architecture stack. */
export const RAIL_LAYERS = [
  {
    id: "pos",
    name: "POS & Mobile",
    desc: "Cash, card, and QR captured at the edge — in-store or online.",
  },
  {
    id: "identity",
    name: "Identity",
    desc: "Verified, offline-capable identity bound to every transaction.",
  },
  {
    id: "routing",
    name: "AERO — AI Routing",
    desc: "Real-time scoring across processors, L1s, L2s, and liquidity pools.",
  },
  {
    id: "settlement",
    name: "Settlement & Temporal Engine",
    desc: "Decoupled initiation and settlement. Trade on time, not just price.",
  },
  {
    id: "compliance",
    name: "Compliance",
    desc: "Cryptographic audit trails and policy enforced in the rail itself.",
  },
  {
    id: "networks",
    name: "Blockchain Networks",
    desc: "Bitcoin, Ethereum, Solana, Base, XRPL, Polygon, Lightning, and banks.",
  },
] as const;

/** Section 5 — how it works steps. */
export const HOW_STEPS = [
  { n: 1, title: "Walk into a store", desc: "Any merchant on the Loadit network." },
  { n: 2, title: "Scan the QR", desc: "Your wallet meets the rail in one tap." },
  { n: 3, title: "Pay with cash or card", desc: "The merchant still settles in familiar fiat." },
  { n: 4, title: "AI routes the transaction", desc: "AERO finds the cheapest, fastest path." },
  { n: 5, title: "Crypto arrives", desc: "On-chain value lands in seconds." },
  { n: 6, title: "Done", desc: "No bank account. No friction. No borders." },
] as const;

/** Section 6 — the future of money cards. */
export const FUTURE_CARDS = [
  {
    id: "ai-settlement",
    title: "AI Settlement",
    tag: "AERO",
    blurb: "Every payment scored and routed in real time for cost and speed.",
    detail:
      "AI Enhanced Routing Optimization ingests cash, card, and QR-triggered payments, tokenizes them, and runs continuous scoring across legacy processors, L1s, L2s, and liquidity pools — choosing the optimal path on every single transaction.",
  },
  {
    id: "offline",
    title: "Offline Payments",
    tag: "Resilience",
    blurb: "Move value during outages with cryptographic escrow.",
    detail:
      "Identity-verified offline settlement binds value to a verified identity and clears when connectivity returns — with a full cryptographic audit trail. Disasters and dead zones stop being a reason payments fail.",
  },
  {
    id: "identity",
    title: "Identity Verification",
    tag: "Trust",
    blurb: "Verified identity bound to every transaction object.",
    detail:
      "Identity is a first-class layer of the rail, not an afterthought. Each transaction carries a verifiable identity claim, enabling compliant settlement without surrendering the speed of crypto.",
  },
  {
    id: "quantum",
    title: "Quantum Optimization",
    tag: "QFR",
    blurb: "Explore millions of routing paths in parallel.",
    detail:
      "The Quantum Financial Router explores millions of candidate paths simultaneously when quantum hardware is available — with classical AERO as the always-on fallback. The rail gets smarter as the hardware arrives.",
  },
  {
    id: "temporal",
    title: "Temporal Settlement",
    tag: "Time",
    blurb: "Lock yesterday's rate. Release on tomorrow's conditions.",
    detail:
      "Temporal settlement decouples initiation from settlement. Lock yesterday's FX rate, target tomorrow's gas window, or trigger release on verified future conditions — all with cryptographic audit trails. Trade on time, not just price.",
  },
  {
    id: "stablecoin",
    title: "Global Stablecoin Rails",
    tag: "Liquidity",
    blurb: "Unified liquidity across fragmented dollar networks.",
    detail:
      "Stablecoin liquidity is scattered across dozens of chains. Loadit treats it as one pool — sourcing the best rate and route across every network, so a dollar is a dollar wherever it needs to land.",
  },
  {
    id: "universal",
    title: "Universal Value Conversion",
    tag: "Rail",
    blurb: "Cash, card, crypto, energy — one settlement object.",
    detail:
      "The Rail Orchestrator combines AI routing, quantum optimization, temporal rules, energy denomination, and offline identity into a single transaction object. Any form of value in, any form of value out.",
  },
] as const;

/** Section 8 — security pillars. */
export const SECURITY_PILLARS = [
  { title: "Encryption", desc: "End-to-end, key-isolated, hardware-backed." },
  { title: "Identity", desc: "Verified identity bound to every transaction." },
  { title: "Compliance", desc: "Policy and audit trails enforced in the rail." },
  { title: "AI Monitoring", desc: "Continuous anomaly detection on every route." },
  { title: "Self-Healing Network", desc: "Failed paths reroute automatically." },
  { title: "Quantum Ready", desc: "Post-quantum primitives, ready for QFR." },
] as const;

/** Section 9 — roadmap. */
export const ROADMAP = [
  { year: "2025", title: "Loadit Launch", desc: "Unified Rail MVP live with pilot merchants." },
  { year: "2026", title: "Texas Expansion", desc: "Regional merchant network and ATM scanner rollout." },
  { year: "2027", title: "National Expansion", desc: "Coast-to-coast rail coverage and partners." },
  { year: "2028", title: "Global Stablecoin Rails", desc: "Cross-border settlement across dollar networks." },
  { year: "2030+", title: "Universal Value Layer", desc: "Cash, crypto, and energy on one protocol." },
] as const;

/** Section 10 — investor metrics. */
export const METRICS = [
  { value: 86, suffix: "%", label: "Lower settlement fees", sub: "$3.20 → $0.45 per transaction" },
  { value: 8, suffix: "+", label: "Networks arbitrated", sub: "L1s, L2s, Lightning & banks" },
  { value: 6, suffix: "", label: "Core patents pending", sub: "Routing, temporal, quantum, offline" },
  { value: 2, suffix: "s", label: "Median settlement", sub: "Cash to on-chain value" },
] as const;
