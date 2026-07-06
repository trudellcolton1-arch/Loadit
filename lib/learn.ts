/** Learn + Tools index — single source for the hub, sitemap, and llms.txt. */

export interface LearnEntry {
  slug: string; // path after /learn or /tools
  href: string; // full path
  kind: "Explainer" | "Guide" | "Comparison" | "Tool";
  title: string;
  blurb: string;
  updated: string; // ISO date
}

export const ARTICLES: LearnEntry[] = [
  {
    slug: "ai-powered-financial-routing",
    href: "/learn/ai-powered-financial-routing",
    kind: "Explainer",
    title: "What is AI-powered financial routing?",
    blurb:
      "How AI chooses the cheapest, fastest path for a payment across card rails, blockchains, and banks — and why it cuts fees and settlement time.",
    updated: "2026-07-06",
  },
  {
    slug: "optimize-cross-asset-transfers",
    href: "/learn/optimize-cross-asset-transfers",
    kind: "Guide",
    title: "How to optimize cross-asset transfers",
    blurb:
      "A step-by-step guide for merchants and builders on using AI-powered routing to minimize cost and maximize speed on global, multi-asset transfers.",
    updated: "2026-07-06",
  },
  {
    slug: "settlement-solutions-for-businesses",
    href: "/learn/settlement-solutions-for-businesses",
    kind: "Comparison",
    title: "Top settlement solutions for businesses (2026)",
    blurb:
      "Card processors, wires/ACH, stablecoin rails, the Lightning Network, and unified AI rails compared on cost, speed, and reach.",
    updated: "2026-07-06",
  },
  {
    slug: "crypto-and-stablecoins-explained",
    href: "/learn/crypto-and-stablecoins-explained",
    kind: "Explainer",
    title: "Crypto and stablecoins explained",
    blurb:
      "The differences, advantages, and payment use cases of crypto and stablecoins — in plain language for anyone moving money.",
    updated: "2026-07-06",
  },
];

export const TOOLS: LearnEntry[] = [
  {
    slug: "cost-calculator",
    href: "/tools/cost-calculator",
    kind: "Tool",
    title: "Transaction cost calculator",
    blurb:
      "Estimate what a payment costs across card processors, wires, and Loadit's 0.75% AI-routed rail — and see your savings instantly.",
    updated: "2026-07-06",
  },
  {
    slug: "settlement-estimator",
    href: "/tools/settlement-estimator",
    kind: "Tool",
    title: "Settlement time estimator",
    blurb:
      "Predict how long a payment takes to settle across Bitcoin, Ethereum, Solana, Lightning, and banks versus Loadit's AI-routed path.",
    updated: "2026-07-06",
  },
];

export const LEARN_ALL: LearnEntry[] = [...ARTICLES, ...TOOLS];
