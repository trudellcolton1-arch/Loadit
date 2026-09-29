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
    { label: "Embedded capabilities", href: "/capabilities", desc: "Load, Send, Connect, Convert, Receive, Cash Out, Loadit One." },
    { label: "Global API", href: "/products#api", desc: "One interface into the routing layer." },
    { label: "UVCE", href: "/products#uvce", desc: "Universal Value Conversion Engine." },
    { label: "Routing", href: "/products#routing", desc: "Route evaluation and selection." },
    { label: "Settlement", href: "/products#settlement", desc: "Normalized execution layer." },
    { label: "Compliance", href: "/products#compliance", desc: "Jurisdiction-aware controls." },
    { label: "Identity", href: "/products#identity", desc: "Verification and authorization." },
    { label: "Resilience", href: "/products#resilience", desc: "Alternative-route evaluation." },
    { label: "Pricing & economics", href: "/pricing", desc: "How Loadit earns, route by route." },
  ],
  developers: [
    { label: "Overview", href: "/developers", desc: "Start here." },
    { label: "Quickstart", href: "/developers/quickstart", desc: "Preview of the first route." },
    { label: "API Reference", href: "/developers/api", desc: "Preview of the interface." },
    { label: "Transaction model", href: "/developers/transaction-model", desc: "One object, many legs." },
    { label: "SDKs", href: "/developers/sdks", desc: "Client libraries." },
    { label: "Webhooks", href: "/developers/webhooks", desc: "Route and settlement events." },
    { label: "Live demo", href: "/developers/sandbox", desc: "Watch the real engine route." },
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
      { label: "Embedded capabilities", href: "/capabilities" },
      { label: "Global API", href: "/products#api" },
      { label: "UVCE", href: "/products#uvce" },
      { label: "Routing", href: "/products#routing" },
      { label: "Settlement", href: "/products#settlement" },
      { label: "Compliance", href: "/products#compliance" },
      { label: "Identity", href: "/products#identity" },
      { label: "Resilience", href: "/products#resilience" },
      { label: "Pricing & economics", href: "/pricing" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Overview", href: "/developers" },
      { label: "Quickstart", href: "/developers/quickstart" },
      { label: "API Reference", href: "/developers/api" },
      { label: "Transaction model", href: "/developers/transaction-model" },
      { label: "SDKs", href: "/developers/sdks" },
      { label: "Webhooks", href: "/developers/webhooks" },
      { label: "Live demo", href: "/developers/sandbox" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/company" },
      { label: "Solutions", href: "/solutions" },
      { label: "Network", href: "/network" },
      { label: "Roadmap", href: "/company#roadmap" },
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
  { path: "/capabilities", priority: 0.9 },
  { path: "/pricing", priority: 0.7 },
  { path: "/solutions", priority: 0.9 },
  { path: "/developers", priority: 0.9 },
  { path: "/developers/quickstart", priority: 0.8 },
  { path: "/developers/api", priority: 0.9 },
  { path: "/developers/transaction-model", priority: 0.8 },
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
    body: "One authenticated interface. Your application states the origin and the destination; the API returns the selected supported route, its cost, its expected time, and a normalized settlement object. Opening to early-access partners first.",
    status: "COMING SOON" as const,
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
    status: "IN BUILD" as const,
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

/* ------------------------------------------------- B2B capability model */

/**
 * The seven customer actions, as a partner embeds them. The same transaction
 * engine powers loadit.net for people and these modules for businesses.
 * Statuses follow the launch sequence in PHASES — nothing is presented as
 * open for integration before it is.
 */
export type CapabilityStatus = "LIVE DEMO" | "IN BUILD" | "PLANNED";
export const CAPABILITIES = [
  {
    id: "load",
    name: "Load",
    verb: "LOAD",
    line: "Supported cash or card funds → one supported digital asset, in one funded transaction.",
    embed: "\"Add cash\" or \"Buy with card\" inside your app. Your customer funds once; Loadit coordinates intake, conversion, and delivery to the destination they chose.",
    example: "A wallet adds \"Load $300 cash into USDC.\" It submits the intent, receives a quote and a funding location, and the customer never opens a Loadit screen.",
    status: "IN BUILD" as const,
    phase: 1,
    note: "Route selection runs today in the live demo. Cash intake is certified with a licensed cash network and launches with the production build.",
  },
  {
    id: "multi-asset-load",
    name: "Multi-Asset Load",
    verb: "LOAD · ALLOCATED",
    line: "One funding event → several supported digital assets, by dollar or percentage allocation.",
    embed: "A saved \"Load Mix\": every incoming load follows the same split. One customer transaction, several output legs, one receipt.",
    example: "$500 cash → $200 USDC + $125 BTC + $100 ETH + $75 SOL. Or a treasury rule: for every $10,000 received, $8,000 operating cash, $1,500 USDC reserve, $500 BTC.",
    status: "PLANNED" as const,
    phase: 1,
    note: "Phase 1 scope. Not yet in the runtime — shown as the intended shape of the transaction object.",
  },
  {
    id: "send",
    name: "Send",
    verb: "SEND",
    line: "Sender pays with what they have; the recipient receives the supported asset or currency they want.",
    embed: "A \"Send Anywhere\" experience: your customer picks a supported source, the recipient picks an available destination, and HQ selects an eligible path between them.",
    example: "Your customer sends USD; the recipient receives USDC in a wallet they control. Or they send BTC and the landlord receives dollars.",
    status: "PLANNED" as const,
    phase: 2,
    note: "The mismatch between what the sender holds and what the recipient needs is the core problem Loadit is built to solve.",
  },
  {
    id: "receive",
    name: "Receive",
    verb: "RECEIVE",
    line: "Programmable rules for how incoming value arrives and is allocated.",
    embed: "Let recipients on your platform declare a preference — one asset, one currency, or an allocation rule — that every incoming payment follows.",
    example: "A recipient sets 50% USD / 25% BTC / 15% ETH / 10% SOL. A payout platform applies it to every disbursement without building the split itself.",
    status: "PLANNED" as const,
    phase: 4,
    note: "Pairs with Convert: one-to-many outputs and recipient preferences on the same transaction object.",
  },
  {
    id: "convert",
    name: "Convert",
    verb: "CONVERT",
    line: "Value already held → one or many other supported assets or currencies — and, corridor by corridor, toward any currency on earth.",
    embed: "Standalone conversion for balances your customers already hold, including one-to-many allocations, coordinated by the UVCE across supported liquidity.",
    example: "$1,000 USDC → $400 BTC + $300 ETH + $200 SOL + $100 USDC, as one instruction with one receipt.",
    status: "PLANNED" as const,
    phase: 4,
    note: "Conversion planning (venues, forecast, fees) already runs inside the routing engine for Load; standalone Convert is the next surface.",
  },
  {
    id: "cash-out",
    name: "Cash Out",
    verb: "CASH OUT",
    line: "Supported digital value → cash or fiat through an eligible exit path.",
    embed: "Give holders on your platform a way out, not just a way in — an eligible cash or fiat destination selected by HQ from the partners live for that corridor.",
    example: "A customer holding USDC on your exchange chooses an available cash or fiat exit instead of staying trapped in digital value.",
    status: "PLANNED" as const,
    phase: 6,
    note: "Depends on off-ramp partners live per corridor; each exit path carries its own status.",
  },
  {
    id: "connect",
    name: "Connect",
    verb: "CONNECT",
    line: "Supported value between financial platforms, even when sender and recipient prefer different apps.",
    embed: "Cross-platform movement: your customer's source and the recipient's destination live in different products; Loadit uses an authorized path between them.",
    example: "Your customer uses one supported app; their brother uses another. Neither has to switch. Loadit finds the authorized path.",
    status: "PLANNED" as const,
    phase: 5,
    note: "Requires authorized integrations or eligible underlying transfer rails for each platform pair.",
  },
  {
    id: "loadit-one",
    name: "Loadit One for platforms",
    verb: "LOADIT ONE",
    line: "Card spend from supported fiat or crypto, and multi-source funding behind one merchant-facing payment.",
    embed: "Let your users spend supported holdings at everyday merchants. HQ applies the user's funding rule; the UVCE converts where required; the merchant receives normal card-network settlement.",
    example: "A $300 purchase funded $100 from Card A + $75 from Card B + $125 from a supported balance. The merchant sees one $300 card transaction.",
    status: "PLANNED" as const,
    phase: 3,
    note: "Requires an issuing and processing partner. Loadit One Credit is a later, separate product that needs a lending partner and a real credit facility.",
  },
  {
    id: "white-label",
    name: "White-label",
    verb: "INVISIBLE MODE",
    line: "Any of the above inside your brand, with Loadit invisible to the end customer.",
    embed: "APIs, SDKs, and hosted components that stay in your experience. Same transaction model, same status feeds, your name on the screen.",
    example: "A bank offers \"checking → USDC in an external wallet\" as its own feature. The bank keeps ACH and wires; Loadit handles the edge its core stack does not.",
    status: "PLANNED" as const,
    phase: 7,
    note: "Early-access partners integrate first, by a person. Join the list to be in the first cohort.",
  },
] as const;

/** Who sits where on the whiteboard. */
export const ROLES = [
  { name: "HQ", role: "The orchestration brain. Understands the requested outcome and decides among eligible routes, providers, liquidity, funding sources, networks, and destinations. If a route fails or fees and liquidity change, HQ evaluates what remains instead of making the customer rebuild the transaction.", status: "IN BUILD" as const },
  { name: "UVCE", role: "The Universal Value Conversion Engine. Performs or coordinates the conversion whenever the input and the output are different kinds of value — USD → USDC, BTC → USD, or one value split across several supported outputs.", status: "PATENT PENDING" as const },
  { name: "Partners + rails", role: "Connected cash networks, card processors, liquidity and conversion partners, blockchains, banks, and issuing programs execute the actual funding, conversion, card, payout, or network movement under their role and license.", status: "IN BUILD" as const },
  { name: "Loadit ledger", role: "Records the instruction, the route, every leg's state, and the receipt. Verifies status, settlement, and reconciliation. Loadit never hides custody, settlement responsibility, or fees from itself or from the customer.", status: "IN BUILD" as const },
] as const;

/** The ten questions every live route must answer — the money map. */
export const MONEY_MAP = [
  "Who has or controls the value before funding?",
  "Who accepts or authorizes the funding source?",
  "Who is custodian, if anyone?",
  "Who performs each conversion?",
  "Which rail or network moves each leg?",
  "Who bears fraud, chargeback, or settlement risk?",
  "What partner and network fees are charged?",
  "What Loadit fee, revenue share, API, or card-program economics apply?",
  "What exact output does the customer or merchant receive?",
  "What happens if one leg fails?",
] as const;

/** Launch sequence. The platform is the whole system; each phase proves one behavior. */
export const PHASES = [
  { n: 1, name: "Load", body: "Cash and card → supported digital assets, including Multi-Asset Load. Proves the shared transaction engine.", status: "IN BUILD" as const },
  { n: 2, name: "Send", body: "Sender holds supported asset or currency A; recipient receives supported asset or currency B.", status: "PLANNED" as const },
  { n: 3, name: "Loadit One Debit pilot", body: "With an issuing and processing partner: supported fiat and crypto spend, multi-source funding behind one merchant-facing payment.", status: "PLANNED" as const },
  { n: 4, name: "Convert + Receive", body: "More currencies and assets, one-to-many conversions, allocations, and recipient preferences.", status: "PLANNED" as const },
  { n: 5, name: "Connect", body: "First supported cross-platform money movement using authorized integrations or eligible underlying rails.", status: "PLANNED" as const },
  { n: 6, name: "Deeper HQ orchestration", body: "More liquidity providers, exchanges, networks, cash rails, financial platforms, issuing and processing partners, and cash-out paths.", status: "PLANNED" as const },
  { n: 7, name: "White-label APIs and SDKs at scale", body: "Banks, wallets, fintechs, payroll and remittance products, merchants, and other platforms embed Loadit inside their own experience.", status: "PLANNED" as const },
  { n: 8, name: "Loadit One Credit", body: "Only after debit is proven and an appropriate issuing and lending facility exists. A different product from Loadit One Debit.", status: "PLANNED" as const },
] as const;

/**
 * Segment-by-segment: the honest before / after, and the answer to
 * "what problem do I have today that Loadit fixes?"
 */
export const SEGMENTS = [
  {
    id: "banks",
    name: "Banks",
    problem: "Your bank is already good at bank rails. The gap appears when customers want value types, destinations, or spending behaviors your core stack does not natively support.",
    answer: "Keep the banking capabilities you already have. Use Loadit for the supported transaction types, assets, and destinations you do not want to build one by one.",
    before: "Build and operate liquidity, blockchain, wallet, compliance, and monitoring connections yourself for each new destination.",
    after: "Submit the intent — checking → supported USDC in an external wallet — through one common infrastructure, and keep ACH and wires exactly where they are.",
    not: "Checking → another U.S. bank account should use your existing rails. Loadit should not add itself to that transaction.",
  },
  {
    id: "exchanges",
    name: "Exchanges",
    problem: "Your exchange already trades crypto. What is missing or fragmented is everything around it: cash and card entry points, external destinations, cash-out paths, spending.",
    answer: "You do not need Loadit to trade assets you already support. Use Loadit where customers need additional ways to enter, leave, spend, or move value beyond your current product.",
    before: "No retail cash network. Customers who want to fund with cash, cash out to fiat, or spend holdings at a merchant leave the product to do it.",
    after: "A supported cash-in path through connected partners, eligible cash-out destinations, and — with an issuing partner — spend at everyday merchants through Loadit One.",
    not: "Buying BTC, USDC, or SOL on your own venue is already solved. Loadit earns a place only at the edges.",
  },
  {
    id: "wallets",
    name: "Wallets",
    problem: "Every new funding method, conversion, network, or off-ramp is another vendor API, another state machine, another reconciliation model.",
    answer: "Add \"Add cash,\" \"Buy multiple assets,\" and \"Send Anywhere\" without leaving your brand. Your customer stays in the wallet; the wallet submits supported intents to Loadit.",
    before: "Four customer flows — cash → USDC, card → BTC/SOL, cash out, cross-platform send — mean four integrations and four ways to fail.",
    after: "One normalized transaction model for the routes Loadit actually supports, with one identifier, one status feed, and one receipt shape.",
    not: "If a single direct provider already covers your one corridor cheaper and better, use them. Loadit is for the routes that cross boundaries.",
  },
  {
    id: "fintechs",
    name: "Fintechs",
    problem: "You want retail cash funding, card funding, delivery on two or three networks, and a fiat off-ramp — and you want to ship this quarter.",
    answer: "One connection exposes those supported capabilities through one interface instead of separate vendor APIs, monitoring, and reconciliation.",
    before: "Separate vendor contracts and integrations for cash collection, card processing, liquidity, each blockchain, and KYC — orchestrated by code you maintain.",
    after: "State the origin, the destination, and the constraints. HQ selects the eligible path; the settlement object comes back normalized.",
    not: "Loadit is not a bank, an exchange, or a wallet. It routes and orchestrates; licensed partners execute.",
  },
  {
    id: "payroll",
    name: "Payroll & payout platforms",
    problem: "Workers, creators, and vendors want to be paid in different forms — dollars here, stablecoins there, a split for some — and you are building each preference by hand.",
    answer: "Recipient rules and allocations on the transaction object: one disbursement run, many supported outputs, every leg tracked.",
    before: "A separate purchase, transfer, and reconciliation entry for every recipient preference, every pay cycle.",
    after: "A saved allocation per recipient — 40% USDC, 25% BTC, 20% ETH, 15% USD, for example — applied to one funded transaction.",
    not: "Recipients who simply want dollars in a bank account should get exactly that, on your existing rails.",
  },
  {
    id: "remittance",
    name: "Remittance platforms",
    problem: "The sender has cash or a card; the recipient wants a specific digital asset in a wallet they control, or a form of value your corridor does not natively deliver.",
    answer: "Coordinate supported origin and destination assets across networks from one integration, with the licensed partner performing the regulated act on each rail.",
    before: "Cash-to-cash is solved. Cash-to-a-specific-wallet, one payment to several assets, or a recipient who wants something different is not.",
    after: "\"I have $100 cash and Mom wants USDC in her wallet\" becomes one instruction with one receipt.",
    not: "If the customer's only goal is cash pickup and a direct provider does that job well, Loadit should not force itself into the transaction.",
  },
  {
    id: "merchants",
    name: "Merchant platforms & marketplaces",
    problem: "Payers and merchants want different things: the payer holds USDC or splits a purchase across sources; the merchant wants normal settlement.",
    answer: "Let settlement preferences differ on each side while the infrastructure handles supported conversion and routing between them — and treasury rules on what comes in.",
    before: "Either force the payer to convert first, or build conversion, card, and split-funding logic into your checkout.",
    after: "With an issuing partner, one merchant-facing card transaction funded by eligible sources behind it; treasury allocations applied to what the merchant receives.",
    not: "Loadit One Debit is planned and needs an issuing and processing partner. Loadit One Credit comes later and is a separate product.",
  },
  {
    id: "agents",
    name: "AI agents",
    problem: "Software agents acting for businesses need to move value under clear governance, not with a human's card on file.",
    answer: "Key-scoped APIs with server-side authorization, deterministic idempotency, and a normalized settlement object the agent's principal can audit.",
    before: "Bespoke permissions and reconciliation per agent, per rail.",
    after: "Governed intents through the same transaction model every other partner uses.",
    not: "Agent payments are a Labs track and an early-access conversation, not a shipped capability.",
  },
] as const;

/** How Loadit earns — defined route by route, product by product, and always disclosed. */
export const ECONOMICS = [
  { name: "Transaction fees", body: "A disclosed Loadit fee on transactions Loadit coordinates. In the live demo today: a 0.75% convenience fee with a $1 minimum, and a 0.25% swap fee when the destination asset differs from what is received.", status: "LIVE DEMO" as const },
  { name: "Partner revenue share", body: "Contracted share with the cash, card, liquidity, and network partners that execute each leg. Set in the partner agreement for that rail.", status: "IN BUILD" as const },
  { name: "Conversion economics", body: "Where the UVCE coordinates conversion across supported liquidity, disclosed conversion economics apply to that leg.", status: "IN BUILD" as const },
  { name: "API and enterprise pricing", body: "Per-key limits and volume tiers agreed with each early-access partner; enterprise terms for white-label deployments.", status: "PLANNED" as const },
  { name: "Card-program economics", body: "Under Loadit One partner agreements, where applicable, once an issuing and processing partner is in place.", status: "PLANNED" as const },
] as const;
