/**
 * LOADIT.INFO — the single source of investor-facing claims.
 *
 * SERVER-ONLY BY CONVENTION. Import this module from server components and
 * routes only; never from a "use client" file. Each claim carries internal
 * sourcing fields (source, asOf, approved) that must not reach the browser —
 * only the rendered `text` of approved claims does. The runtime guard below
 * fails loudly if this file is ever bundled for the client.
 */
if (typeof window !== "undefined") {
  throw new Error("app/info/_lib/claims.ts is server-only: it holds internal sourcing notes.");
}

import type { Status } from "./content";

export type ClaimStatus = Status | "unverified";

export interface Claim {
  id: string;
  /** Public sentence. */
  text: string;
  /** Internal: where this was verified. */
  source: string;
  /** Internal: as-of date (ISO) where relevant. */
  asOf?: string;
  status: ClaimStatus;
  /** Internal: cleared for public display. Unapproved claims never render. */
  approved: boolean;
}

export const CLAIMS: Claim[] = [
  { id: "entity", text: "Loadit, Inc. is a Delaware C corporation founded in August 2025, based in Mansfield, Texas.", source: "app/global/company/page.tsx (founder-authored, commit d24fd1e); formation papers in the data room", asOf: "2026-09-30", status: "today", approved: true },
  { id: "founder", text: "Colton Trudell — Founder, CEO & Chairman.", source: "app/global/company/page.tsx (founder-authored, commit d24fd1e)", asOf: "2026-09-30", status: "today", approved: true },
  { id: "patent", text: "A U.S. patent application for the Loadit Unified Financial Rail has been filed (25 claims). Patent pending; no patent has been granted.", source: "LOADIT_UNIFIED_PATENT_MAIN_1.docx in the data room; app/global/company FACTS", status: "today", approved: true },
  { id: "cash-cert", text: "Certification for retail cash-in with a licensed national cash network is complete (5 of 5 stages). Consumer cash-in launches with the production application.", source: "lib/rail/copy.ts; founder statement 2026-09 ('MoneyGram is now step 5/5'). Partner is not named on public surfaces.", asOf: "2026-09-29", status: "testing", approved: true },
  { id: "prototype", text: "A prototype of the consumer app runs on iOS (TestFlight) and Android and is used for demos and testing. It is not a customer launch.", source: "Codemagic builds + App Store Connect (TestFlight build 7), 2026-09; founder statement 2026-10-04 ('we have to get our engineers to build the app')", asOf: "2026-10-04", status: "testing", approved: true },
  { id: "routing-demo", text: "The routing engine is publicly demonstrable: a live request on loaditglobal.com returns the selected network, estimated cost and time, and a confidence score.", source: "app/api/v1/route; app/global/developers/sandbox", asOf: "2026-10-04", status: "today", approved: true },
  { id: "self-heal", text: "When a leg of a transaction fails in the engine, the remaining legs are re-scored and a new route is locked under the same identifier, with deterministic idempotency keys.", source: "lib/rail (heal), rail demo failure drill, tests", asOf: "2026-10-04", status: "testing", approved: true },
  { id: "pqc", text: "Settlement objects in the engine are signed with a post-quantum signature scheme (ML-DSA).", source: "@noble/post-quantum dependency; LOADIT_MLDSA_SEED env", asOf: "2026-10-04", status: "testing", approved: true },
  { id: "data-room", text: "An investor data room with an NDA click-through is live; access is granted individually.", source: "app/data-room; lib/dataroom.ts; lib/nda.ts", asOf: "2026-09-29", status: "today", approved: true },
  { id: "properties", text: "Loadit operates loadit.net (consumer), loaditglobal.com (business and developer platform, pre-launch), loadit.world (vision), load.club (rewards), and load.money (pay links).", source: "middleware.ts; Vercel project domains", asOf: "2026-10-05", status: "today", approved: true },
  { id: "custody", text: "Loadit is designed to be non-custodial: it coordinates and verifies, and licensed partners execute. Loadit does not hold customer funds and does not hold money-transmitter licenses.", source: "app/global/compliance/page.tsx; HQ grounding prompt", asOf: "2026-10-04", status: "today", approved: true },
  { id: "pricing-intent", text: "Intended pricing: a 0.75% convenience fee ($1 minimum) on the amount converted, plus a visible 0.25% when the engine swaps into another asset. Published design intent, subject to change before launch.", source: "lib/seo.ts FAQ; app/api/v1/route fee rules (public on loadit.net)", asOf: "2026-10-04", status: "planned", approved: true },
  { id: "pre-revenue", text: "Loadit is pre-launch and has no customer revenue yet.", source: "Follows from: no product is live for customers (founder, 2026-10-04)", asOf: "2026-10-04", status: "today", approved: true },
  { id: "production-build", text: "The next milestone is assembling the engineering team and building the production application; card and cash purchases launch with it.", source: "founder statements 2026-09-29 and 2026-10-04", asOf: "2026-10-04", status: "planned", approved: true },
  { id: "b2b-prelaunch", text: "Loadit Global, the business and developer platform, is pre-launch with an early-access list and a published API preview.", source: "app/global", asOf: "2026-10-04", status: "today", approved: true },

  // ---- Not approved: never rendered. Kept here so the gap is explicit. ----
  { id: "partner-name", text: "", source: "Cash-network partner name — founder asked that it not appear on public surfaces (2026-09-11).", status: "unverified", approved: false },
  { id: "patent-date", text: "", source: "Filing date / application number not in a public-approved source.", status: "unverified", approved: false },
  { id: "team", text: "", source: "No verified roster beyond the founder; no approved bios or photos.", status: "unverified", approved: false },
  { id: "traction", text: "", source: "No verified users, transactions, volume, or revenue.", status: "unverified", approved: false },
  { id: "round", text: "", source: "No approved round size, valuation, instrument, or use of funds.", status: "unverified", approved: false },
  { id: "market-size", text: "", source: "No sourced TAM/SAM figures approved for display.", status: "unverified", approved: false },
  { id: "launch-date", text: "", source: "No committed production-app or cash-in launch date.", status: "unverified", approved: false },
];

const byId = new Map(CLAIMS.map((c) => [c.id, c]));

/** Public text of an approved claim — empty string if unapproved or unknown. */
export function claim(id: string): string {
  const c = byId.get(id);
  return c && c.approved ? c.text : "";
}

/** Status of a claim for a label; defaults to planned so nothing reads as live by accident. */
export function claimStatus(id: string): Status {
  const s = byId.get(id)?.status;
  return s === "today" || s === "testing" || s === "planned" ? s : "planned";
}

/* ------------------------------------------------------------ section content */

export const PROBLEM = [
  { k: "Different systems carry different forms of value.", v: "Cash, card networks, bank rails, stablecoins, and blockchains each have their own rules for who can hold value, how it settles, and what it costs." },
  { k: "Crossing between them takes separate providers and steps.", v: "A person with cash who wants a digital asset in their own wallet, or a business that wants to be paid in one form while customers pay in another, has to assemble the journey themselves." },
  { k: "Customers care about three things.", v: "What it costs, whether it is available where they are, and what actually arrives at the destination." },
  { k: "Businesses carry the coordination.", v: "Each new form of value means another provider, another integration, another reconciliation process to run and support." },
];

export const MARKET_ENTRY = [
  { k: "Initial customer", v: "People who hold cash, or prefer to pay with a card, and want a digital asset or stablecoin delivered to a wallet they control — without opening an exchange account first.", status: "planned" as Status },
  { k: "Their specific need", v: "One funded transaction that ends with the asset in their own wallet, with the cost shown before they commit, and identity verification handled where the money changes hands.", status: "planned" as Status },
  { k: "Distribution channel", v: "Retail counters of a licensed national cash network, where certification is complete, plus the Loadit app for card-funded purchases.", status: "testing" as Status },
  { k: "First product", v: "Load: cash or card in, one supported digital asset out, non-custodial. It works in the prototype and launches with the production application.", status: "testing" as Status },
  { k: "What would validate it", v: "Completed cash-in transactions through the certified network after launch, repeat use, counter-level conversion, and unit cost per transaction that covers provider, network, compliance, and support costs.", status: "planned" as Status },
  { k: "How it supports expansion", v: "The same transaction object then carries more outputs (multi-asset), more directions (send, receive, cash out), and more channels (businesses embedding it through Loadit Global).", status: "planned" as Status },
];

export interface Milestone {
  when: string;
  title: string;
  detail: string;
  status: Status;
  link?: { label: string; href: string };
}

export const MILESTONES: Milestone[] = [
  { when: "Aug 2025", title: "Loadit, Inc. incorporated", detail: "Delaware C corporation, based in Mansfield, Texas.", status: "today" },
  { when: "Filed", title: "Patent application: Loadit Unified Financial Rail", detail: "25 claims covering intake, universal value conversion, AI-orchestrated routing, temporal settlement, offline identity-verified transactions, compliance, and more. Patent pending; nothing granted.", status: "today", link: { label: "Overview", href: "https://loadit.net/#patents" } },
  { when: "Sep 2026", title: "Cash-network certification complete (5 of 5)", detail: "Retail cash-in certified with a licensed national cash network. Consumer cash-in launches with the production application.", status: "testing" },
  { when: "Sep 2026", title: "Prototype app on iOS and Android", detail: "Used for demos and testing. Shows the full Load journey: intent, conversion plan, route, delivery. Not a customer launch.", status: "testing", link: { label: "Prototype preview", href: "https://loadit.net/install" } },
  { when: "Sep 2026", title: "Routing engine demonstrable in public", detail: "A real request on loaditglobal.com returns the selected network, estimated cost and time, and a confidence score. Estimates, not quotes.", status: "today", link: { label: "Live demo", href: "https://loaditglobal.com/developers/sandbox" } },
  { when: "Sep 2026", title: "Investor data room live", detail: "Formation papers, the patent filing, the deck, certification records, and the domain portfolio, behind an NDA click-through. Access granted individually.", status: "today", link: { label: "Request access", href: "#contact" } },
  { when: "Sep–Oct 2026", title: "Three public properties for three audiences", detail: "loadit.net for people, loaditglobal.com for businesses and developers (pre-launch, early-access list open), loadit.world for the long-term vision.", status: "today" },
  { when: "Next", title: "Production application build", detail: "Assemble the engineering team and build the production app. Card and cash purchases launch with it. No date is committed.", status: "planned" },
];

export const REVENUE_NOW = [
  { k: "Transaction fee (intended)", v: "A 0.75% convenience fee with a $1 minimum on the amount converted, shown before the customer confirms.", status: "planned" as Status },
  { k: "Conversion fee (intended)", v: "A visible 0.25% when the engine swaps into an asset other than the one received. No hidden spread.", status: "planned" as Status },
];

export const REVENUE_LATER = [
  { k: "Partner revenue share", v: "Contracted share with the cash, card, liquidity, and network partners that execute each leg — set in each partner agreement." },
  { k: "Platform and enterprise pricing", v: "Per-key limits, volume tiers, and white-label terms for businesses embedding Loadit through Loadit Global." },
  { k: "Card-program economics", v: "Only if and when a consumer card product launches with an issuing partner." },
];

export const COSTS = [
  "Licensed partner fees for cash intake, card processing, and payout",
  "Network and liquidity costs on each conversion and delivery",
  "Compliance operations and identity verification performed by partners",
  "Customer support and transaction reconciliation",
];

export interface RoadmapStep {
  n: string;
  title: string;
  body: string;
  depends: string;
  horizon: "near" | "later";
  status: Status;
}

export const ROADMAP: RoadmapStep[] = [
  { n: "01", title: "Validate the initial workflow", body: "Build the production application and launch Load — cash or card to one supported digital asset — through the certified cash network and the app.", depends: "Engineering team in place; production build complete; partner go-live.", horizon: "near", status: "planned" },
  { n: "02", title: "Establish repeatable distribution", body: "Measure counter-level conversion and repeat use; refine the retail journey; grow coverage within the existing network.", depends: "Live transactions; partner reporting.", horizon: "near", status: "planned" },
  { n: "03", title: "Expand supported routes and providers", body: "Multi-asset allocation on one transaction, standalone conversion, additional networks and payout partners, corridor by corridor.", depends: "Validated unit economics on the first route; additional partner agreements.", horizon: "later", status: "planned" },
  { n: "04", title: "Open the platform to businesses", body: "Loadit Global early-access partners embed the same transaction object through the API; white-label experiences follow.", depends: "Production engine hardening; first design partners from the early-access list.", horizon: "later", status: "planned" },
  { n: "05", title: "Broader payment coordination", body: "Send, receive, connect, cash out, and merchant settlement on the same infrastructure, as described in the long-term vision.", depends: "Each capability's licensed partners and its own validation.", horizon: "later", status: "planned" },
];

export const DIFFERENTIATION = [
  { k: "Coordination across providers", v: "Loadit's job is the journey between cash agents, card partners, liquidity, networks, and payout partners — one transaction object with every leg tracked — rather than being one more provider in the chain." },
  { k: "A consistent experience across routes", v: "The customer states what they have and what should arrive. The same screens and the same receipt shape apply whether the route crossed one network or three." },
  { k: "Routing on the transaction's requirements", v: "The engine scores supported paths on cost, speed, liquidity, availability, risk, and compliance for each request, and re-plans a failed leg under the same identifier. This is demonstrable today." },
  { k: "A distribution relationship in place", v: "Certification with a licensed national cash network is complete before launch, which puts physical cash intake at retail counters inside the first product rather than on a wish list." },
  { k: "Operating knowledge compounds", v: "Every real transaction teaches the engine about partner behaviour, failure modes, and corridor economics — knowledge that lives in the coordination layer, not in any single rail." },
  { k: "Patent-pending architecture", v: "The filed application describes the whole system — from intake to settlement — at the architecture level. It is pending, not granted, and is one input to defensibility, not the whole of it." },
];

export const FAQ = [
  { q: "What does Loadit do today?", a: "Today Loadit has a working prototype of its consumer app, a routing engine that can be demonstrated publicly, a completed certification with a licensed national cash network for retail cash-in, a filed patent application, and an investor data room. There is no product live for customers yet." },
  { q: "What remains under development?", a: "The production application. The next milestone is assembling the engineering team and building it; card and cash purchases launch with that build. Beyond it, multi-asset routing, sending and receiving, payouts, merchant settlement, and the business platform are planned in sequence." },
  { q: "Who is the initial customer?", a: "People who hold cash or prefer to pay by card and want a digital asset or stablecoin delivered to a wallet they control, reached through retail counters of the certified cash network and through the app." },
  { q: "How does Loadit intend to earn revenue?", a: "A disclosed transaction fee on conversions Loadit coordinates (intended: 0.75% with a $1 minimum, plus a visible 0.25% on asset swaps), and later partner revenue share and platform pricing for businesses. Loadit is pre-launch and has no customer revenue yet. Transaction fees are not profit: provider, network, compliance, and support costs sit against them." },
  { q: "What role do external providers play?", a: "They execute the regulated and physical parts of each transaction: a licensed cash network collects cash and verifies identity at the counter, licensed card and liquidity partners complete purchases, and networks deliver value. Loadit coordinates the route and verifies the result." },
  { q: "Does Loadit hold customer funds?", a: "The model is non-custodial. Value is delivered to a destination the customer controls, and the licensed partner on each rail performs the regulated act. Loadit does not hold customer funds and does not hold money-transmitter licenses." },
  { q: "How are identity verification and compliance handled?", a: "By the licensed partner on each rail — at the retail counter for cash, and by the card and liquidity partners for card-funded purchases. Compliance is also a scored dimension of route selection in the engine. Formal legal opinions and state-by-state analysis are in preparation and are available to investors under NDA when ready." },
  { q: "What are the next milestones?", a: "Build the production application, launch Load through the certified cash network and the app, and validate the first route: completed transactions, repeat use, and unit costs. Dates are not committed and are not published." },
  { q: "What does the patent cover, and what does \"pending\" mean?", a: "The application describes a single system with ten parts — from the front door that accepts cash and cards, through a universal value translator and an AI routing engine, to compliance, offline operation, self-healing, and post-quantum security — in 25 claims. Pending means it has been filed and awaits examination: nothing is granted or enforceable yet, and claims may narrow. It is one input to defensibility, not the whole case." },
  { q: "What is the difference between Loadit.net and Loadit Global?", a: "Same engine, two front doors. Loadit.net is the consumer app, where a person loads cash or a card into a digital asset in their own wallet — prototype today, production app next. Loadit Global is the business and developer platform, where a bank, wallet, or fintech embeds the same capabilities through an API behind their own brand — pre-launch, with a live routing demo and an early-access list." },
  { q: "How can I request further information?", a: "Use the form below or email colt@loadit.net. Investor materials and data-room access are provided individually after a conversation; submitting the form does not grant access on its own." },
];

export const LEADERSHIP = [
  { name: "Colton Trudell", role: "Founder, CEO & Chairman", note: "Mansfield, Texas. Full background and team information are provided in the investor materials." },
];

export const LEGAL_NOTE =
  "This website is for informational purposes only and does not constitute an offer to sell, or a solicitation of an offer to buy, any securities. Statements about plans, milestones, and intended pricing are forward-looking, describe intentions rather than commitments, and may change. Patent pending; no patent has been granted. Loadit, Inc. does not hold money-transmitter licenses; regulated activities are performed by licensed partners.";

/* ------------------------------------------------------------ the patent, in plain words */

export const PATENT = {
  shortTitle: "Loadit Unified Financial Rail",
  title:
    "Self-Healing, AI-Orchestrated, Quantum-Optimized, Temporally Programmable, Offline-Resilient, Multi-Reality Transaction and Universal Value Conversion Architecture for Global Financial Settlement",
  claims: 25,
  parts: 10,
  figures: 4,
  independentClaim:
    "A unified financial settlement system comprising an AI-orchestrated routing engine, a universal value conversion engine, a quantum optimization layer, a temporal settlement subsystem, an identity-verified offline transaction subsystem, a multi-reality transaction interface layer, a geo-temporal compliance engine, and a point-of-sale transaction intake layer — ingesting cash, card, fiat, and digital-asset payments and executing settlement across heterogeneous financial rails.",
  /** The whole invention, for a five-year-old. */
  kid: "Money comes in lots of shapes: paper cash, a plastic card, numbers in a bank, coins that live on the internet. Loadit's invention is a machine with a front door that takes any shape of money in, a translator that changes it into the shape the other person wants, a GPS that picks the best road to get it there, and a bunch of helpers that keep it working even when a road is closed, the internet is off, or the rules are different in another town.",
  /** What \"pending\" means, for an investor. */
  pendingMeans:
    "An application has been filed and is awaiting examination. Nothing has been granted, nothing is enforceable yet, and the claims may narrow before any grant. The filing describes the architecture at a conceptual level; it is one input to defensibility, alongside partner relationships and operating knowledge, not the whole case.",
  source: "LOADIT_UNIFIED_PATENT_MAIN_1.docx (data room); patent-pending language approved on loadit.net and loaditglobal.com",
} as const;

export interface PatentPart {
  n: string;
  code: string;
  name: string;
  /** The five-year-old version. */
  kid: string;
  /** One plain sentence of what the filing describes. */
  filing: string;
  /** Why an investor should care. */
  why: string;
  claims: string;
  status: Status;
  today: string;
}

export const PATENT_PARTS: PatentPart[] = [
  {
    n: "7.1", code: "INTAKE", name: "Transaction intake layer",
    kid: "The front door. Cash, a card tap, a QR code, or a tap from an app all walk in the same door and get the same kind of envelope.",
    filing: "Point-of-sale, card-present, card-not-present, QR, NFC, remote, and later immersive inputs each produce one standardized transaction object.",
    why: "One shape in means one engine downstream, however the customer paid.",
    claims: "Claims 1–4", status: "testing",
    today: "Card intake works in the prototype; cash intake is certified with a licensed cash network and launches with the production app.",
  },
  {
    n: "7.2", code: "UVCE", name: "Universal Value Conversion Engine",
    kid: "The translator. It can turn dollars into internet coins, internet coins into dollars, or one kind of coin into another — and it checks a few shops for the best deal first.",
    filing: "Fiat-to-digital, digital-to-fiat, and cross-asset translation through one normalization model, with liquidity sourcing, forecasting, programmable conversion rules, and fee normalization.",
    why: "This is what lets the sender pay in one form and the recipient receive another.",
    claims: "Claims 5, 8", status: "testing",
    today: "Runs inside every prototype transaction: venue sourcing, forecast, fee breakdown, conversion plan.",
  },
  {
    n: "7.3", code: "HQ · AORE", name: "AI-Orchestrated Routing Engine",
    kid: "The GPS. It looks at every road, picks the best one right now, and if there is traffic it turns around and takes another.",
    filing: "A real-time network analyzer, multi-rail path evaluation, a learning routing model, predictive pre-settlement, risk and compliance scoring, deterministic path selection, and live re-routing.",
    why: "Routing is the product's intelligence and the part that is already demonstrable.",
    claims: "Claims 7, 17", status: "today",
    today: "A public demo on loaditglobal.com returns the selected network, estimated cost and time, and a confidence score for any request.",
  },
  {
    n: "7.4", code: "QOL", name: "Quantum Optimization Layer",
    kid: "A much faster calculator for when the map gets enormous. If it isn't around, the normal calculator still works.",
    filing: "Quantum-assisted pathfinding, risk evaluation, and key distribution in a hybrid classical–quantum model with deterministic classical fallback.",
    why: "Future-proofs the routing problem as the number of networks and venues grows; optional by design.",
    claims: "Claims 9, 18", status: "planned",
    today: "A research track. Classical routing is always the live path.",
  },
  {
    n: "7.5", code: "TSM", name: "Temporal Settlement Subsystem",
    kid: "A timer on the money. Send it now, but let it land later, or only when something happens, or as if it had been sent yesterday at yesterday's price.",
    filing: "Retroactive, delayed, predictive, and condition-based settlement with verifiable historical and future state proofs.",
    why: "Opens programmable settlement products that conventional real-time rails cannot offer.",
    claims: "Claims 10, 19, 20", status: "planned",
    today: "Designed and claimed; not in the runtime.",
  },
  {
    n: "7.6", code: "IVOR", name: "Identity-Verified Offline Rail",
    kid: "Works when the internet is off. You hand over a sealed envelope that proves it is really you; when the lights come back on, it gets opened and counted.",
    filing: "Biometric and behavioral identity bound to a decentralized identifier, a local post-quantum escrow vault, deferred synchronization over mobile, satellite, or mesh, and replay prevention.",
    why: "Extends the rail to disasters, remote regions, and travel without data — places existing payment systems do not reach.",
    claims: "Claims 11, 12, 21", status: "planned",
    today: "Designed and claimed; not in the runtime.",
  },
  {
    n: "7.7", code: "SHF", name: "Self-healing architecture",
    kid: "If a road closes halfway there, the package does not get lost. The machine notices, picks another road, and the package still arrives once.",
    filing: "Fault detection across rails, failure classification, autonomous re-routing, settlement packet replication with deterministic deduplication, chain-health prediction, and post-recovery reconciliation.",
    why: "Reliability is what partners and regulators will ask about first.",
    claims: "Claims 16, 24", status: "testing",
    today: "In the engine: a failed leg is parked, the rest re-scored, and a new route locked under the same identifier with idempotency keys.",
  },
  {
    n: "7.8", code: "MRTI", name: "Multi-Reality Transaction Interface",
    kid: "New ways to say \"pay\": pointing in a headset, or someday just thinking it, each tied to proof it is really you.",
    filing: "AR, VR, XR, and brain–computer interface inputs captured as transaction intent, continuously authenticated, and normalized into the same transaction object.",
    why: "Anchors the architecture's forward boundary; it is explicitly vision.",
    claims: "Claims 13, 14, 22", status: "planned",
    today: "Nothing in the product today.",
  },
  {
    n: "7.9", code: "GTCE", name: "Geo-Temporal Compliance Engine",
    kid: "The rulebook that knows where you are. Every town has its own rules, so the machine only picks roads that follow the rules for both ends of the trip.",
    filing: "Jurisdiction-, asset-, and time-aware compliance rules enforced on every route, online or offline, with privacy-preserving proofs.",
    why: "Compliance as a routing input rather than a gate at the end is central to operating across rails and borders.",
    claims: "Claims 15, 23", status: "testing",
    today: "Compliance is a scored dimension of route selection in the engine; the licensed party on each rail performs the regulated act.",
  },
  {
    n: "7.10", code: "SECURITY", name: "Security and post-quantum cryptography",
    kid: "Locks that even tomorrow's super-computers can't pick, on every envelope and every door.",
    filing: "Post-quantum signatures and encryption, quantum-secure channels where supported, tiered identity integrity, secure enclaves, anomaly detection, and cross-ledger integrity proofs.",
    why: "Long-lived financial records need protection against attackers who do not exist yet.",
    claims: "Claims 18, 25", status: "testing",
    today: "Settlement objects in the engine are signed with ML-DSA, a post-quantum scheme.",
  },
];

/* ------------------------------------------------------------ two front doors */

export interface ProductDoor {
  name: string;
  audience: string;
  url: string;
  kid: string;
  what: string;
  status: Status;
  now: string;
  items: { label: string; status: Status }[];
}

export const PRODUCTS: ProductDoor[] = [
  {
    name: "Loadit.net",
    audience: "For people · B2C",
    url: "https://loadit.net",
    kid: "The app a person uses. Put money in, pick what you want it to become, and it shows up in your own wallet.",
    what: "The consumer product. Seven planned actions on one engine — Load, Send, Connect, Convert, Receive, Cash Out, and a card called Loadit One — starting with Load: cash or card in, one supported digital asset out, delivered to a wallet the customer controls.",
    status: "testing",
    now: "A prototype exists for demos and testing. The production app is the next milestone; card and cash purchases launch with it. Not live for customers yet.",
    items: [
      { label: "Load — cash or card to a digital asset", status: "testing" },
      { label: "Convert — conversion engine runs inside Load", status: "testing" },
      { label: "Send · Receive · Connect · Cash Out", status: "planned" },
      { label: "Loadit One card (issuing partner required)", status: "planned" },
      { label: "Load.club rewards program", status: "testing" },
    ],
  },
  {
    name: "Loadit Global",
    audience: "For businesses and developers · B2B",
    url: "https://loaditglobal.com",
    kid: "The same machine, but a bank or an app plugs it in behind their own screen so their customers never see Loadit.",
    what: "The business and developer platform. Banks, exchanges, wallets, fintechs, payroll and remittance platforms, and merchants embed the same capabilities through one API and one transaction object, with white-label experiences to follow.",
    status: "testing",
    now: "Pre-launch. A live routing demo, an API preview, a published transaction model, segment-by-segment solutions, and an early-access list are public; keys go to early-access partners first.",
    items: [
      { label: "Live routing demo", status: "today" },
      { label: "API preview and transaction model", status: "testing" },
      { label: "Early-access list open", status: "today" },
      { label: "Embedded capabilities for partners", status: "planned" },
      { label: "White-label experiences", status: "planned" },
    ],
  },
];
