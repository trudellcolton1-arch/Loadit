/**
 * LOADIT GLOBAL — site constants. Independent from loadit.net's SITE object:
 * different domain, metadata, navigation, and copy. Shares the repo's design
 * tokens and backends, nothing else.
 */

export const GLOBAL = {
  name: "Loadit Global",
  domain: "loaditglobal.com",
  url: "https://loaditglobal.com",
  tagline: "GPS for money.",
  title: "Loadit Global | Intelligent Value Routing Infrastructure",
  description:
    "Loadit provides businesses and developers with infrastructure for routing, converting, and settling value across supported traditional and digital financial networks.",
  contact: "colt@loadit.net",
  parent: { name: "Loadit Inc.", url: "https://loadit.net" },
} as const;

/** Header navigation. Root-relative — the loaditglobal.com host resolves them. */
export const NAV = {
  products: [
    { label: "Global API", href: "/products#api", desc: "One interface into the routing layer." },
    { label: "UVCE", href: "/products#uvce", desc: "Universal Value Conversion Engine." },
    { label: "Routing", href: "/products#routing", desc: "Route evaluation and selection." },
    { label: "Settlement", href: "/products#settlement", desc: "Normalized execution layer." },
    { label: "Compliance", href: "/products#compliance", desc: "Jurisdiction-aware controls." },
    { label: "Identity", href: "/products#identity", desc: "Verification and authorization." },
    { label: "Resilience", href: "/products#resilience", desc: "Alternative-route evaluation." },
  ],
  developers: [
    { label: "Overview", href: "/developers", desc: "Start here." },
    { label: "Quickstart", href: "/developers/quickstart", desc: "First route in five minutes." },
    { label: "API Reference", href: "/developers/api", desc: "Endpoints, params, responses." },
    { label: "SDKs", href: "/developers/sdks", desc: "Client libraries." },
    { label: "Webhooks", href: "/developers/webhooks", desc: "Route and settlement events." },
    { label: "Sandbox", href: "/developers/sandbox", desc: "Try it with the demo key." },
    { label: "Status", href: "/status", desc: "System status." },
  ],
  top: [
    { label: "Solutions", href: "/solutions" },
    { label: "Network", href: "/network" },
    { label: "Company", href: "/company" },
  ],
} as const;

export const FOOTER = [
  {
    title: "Products",
    links: [
      { label: "Global API", href: "/products#api" },
      { label: "UVCE", href: "/products#uvce" },
      { label: "Routing", href: "/products#routing" },
      { label: "Settlement", href: "/products#settlement" },
      { label: "Compliance", href: "/products#compliance" },
      { label: "Identity", href: "/products#identity" },
      { label: "Resilience", href: "/products#resilience" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Overview", href: "/developers" },
      { label: "Quickstart", href: "/developers/quickstart" },
      { label: "API Reference", href: "/developers/api" },
      { label: "SDKs", href: "/developers/sdks" },
      { label: "Webhooks", href: "/developers/webhooks" },
      { label: "Sandbox", href: "/developers/sandbox" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/company" },
      { label: "Solutions", href: "/solutions" },
      { label: "Network", href: "/network" },
      { label: "Loadit Labs", href: "/company#labs" },
      { label: "Contact", href: "/contact" },
      { label: "Loadit.net", href: "https://loadit.net" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Security", href: "/security" },
      { label: "Compliance", href: "/compliance" },
      { label: "Privacy", href: "/privacy" },
      { label: "System Status", href: "/status" },
      { label: "Documentation", href: "/developers" },
    ],
  },
] as const;

/** Every indexable route — drives the sitemap. */
export const ROUTES: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/products", priority: 0.9 },
  { path: "/solutions", priority: 0.9 },
  { path: "/developers", priority: 0.9 },
  { path: "/developers/quickstart", priority: 0.8 },
  { path: "/developers/api", priority: 0.9 },
  { path: "/developers/sdks", priority: 0.6 },
  { path: "/developers/webhooks", priority: 0.6 },
  { path: "/developers/sandbox", priority: 0.8 },
  { path: "/network", priority: 0.7 },
  { path: "/company", priority: 0.7 },
  { path: "/security", priority: 0.7 },
  { path: "/compliance", priority: 0.7 },
  { path: "/privacy", priority: 0.4 },
  { path: "/status", priority: 0.5 },
  { path: "/contact", priority: 0.6 },
  { path: "/access", priority: 0.8 },
];

/* ------------------------------------------------------------- content */

export const PRODUCTS = [
  {
    id: "api",
    name: "Loadit Global API",
    line: "Universal interface into Loadit's business-facing infrastructure.",
    body: "One authenticated interface. Your application states the origin and the destination; the API returns the selected supported route, its cost, its expected time, and a normalized settlement object. Today that interface is the HQ routing endpoint — live, with a demo key.",
    status: "LIVE · SANDBOX" as const,
  },
  {
    id: "uvce",
    name: "UVCE",
    line: "Universal Value Conversion Engine.",
    body: "Different representations of value — a card authorization, cash at a counter, a stablecoin on one network, an asset on another — are normalized into a single settlement-ready object the rest of the system can route, price, and audit.",
    status: "PATENT PENDING" as const,
  },
  {
    id: "routing",
    name: "Intelligent Routing",
    line: "Evaluation and selection of supported transaction routes.",
    body: "The orchestration layer scores every supported path on cost, settlement speed, liquidity, network availability, risk, and compliance, then locks a route with a time-to-live — instead of your team hard-coding one rail per corridor.",
    status: "LIVE · SANDBOX" as const,
  },
  {
    id: "settlement",
    name: "Settlement",
    line: "Normalized transaction execution and settlement layer.",
    body: "Execution across the selected infrastructure returns through one Loadit interface: one payment identifier for the whole lifecycle, idempotent side effects, and a receipt your ledger can reconcile without knowing which rail carried the value.",
    status: "IN BUILD" as const,
  },
  {
    id: "compliance",
    name: "Compliance",
    line: "Infrastructure for jurisdiction-aware transaction controls.",
    body: "Routes carry compliance as a scored dimension, not an afterthought. Identity verification and money-transmission obligations sit with licensed partners on each rail; Loadit orchestrates non-custodially and never holds customer funds.",
    status: "IN BUILD" as const,
  },
  {
    id: "identity",
    name: "Identity",
    line: "Identity verification architecture and transaction authorization.",
    body: "Verified identity is bound to the transaction object and travels with it. Authorization is checked server-side on every request — the client is never the source of truth for who is allowed to move what.",
    status: "IN BUILD" as const,
  },
  {
    id: "resilience",
    name: "Resilience",
    line: "Infrastructure designed for alternative-route evaluation and fault tolerance.",
    body: "When a pipe fails mid-flight the payment is parked, the remaining legs are re-scored, and a new route is locked under the same identifier. Deterministic idempotency keys make a double payout impossible by construction.",
    status: "IN BUILD" as const,
  },
] as const;

export const SOLUTIONS = [
  { name: "Fintechs", body: "Use Loadit as an infrastructure layer for value conversion, routing, and settlement — without owning every rail relationship yourself." },
  { name: "Wallets", body: "Give users additional supported ways to enter, move, convert, and exit value behind the interface they already know." },
  { name: "Merchant platforms", body: "Let payer and merchant settlement preferences differ while the infrastructure handles supported conversion and routing between them." },
  { name: "Remittance platforms", body: "Coordinate supported origin and destination assets across financial networks from one integration." },
  { name: "Marketplaces", body: "Create programmable settlement flows between buyers, sellers, and the platform itself." },
  { name: "Financial institutions", body: "Connect existing products to modern settlement infrastructure through a unified, auditable interface." },
  { name: "AI agents", body: "Let software agents interact with programmable financial infrastructure through clearly governed, key-scoped APIs." },
] as const;

export const LABS = [
  { name: "Temporal settlement", body: "Decoupling when a transaction is initiated from when — and on what conditions — it settles." },
  { name: "Offline / resilient settlement", body: "Identity-verified, escrow-secured transactions in degraded or disconnected environments, reconciled when connectivity returns." },
  { name: "Post-quantum financial infrastructure", body: "Post-quantum signature and hashing primitives for settlement objects and routing instructions." },
  { name: "Quantum-assisted routing", body: "Hybrid classical–quantum evaluation of large settlement graphs, with classical routing as the always-on fallback. Public verification receipts at loadit.net/quantum." },
  { name: "Energy-native settlement", body: "Energy credits as a first-class value representation inside the conversion engine." },
  { name: "Autonomous agent payments", body: "Governed payment capabilities for software agents acting on behalf of businesses." },
] as const;
