import { SITE } from "./constants";

/** FAQ content — also rendered visibly on the page for users + rich results. */
export const FAQS = [
  {
    q: "What is Loadit?",
    a: "Loadit is an AI-powered financial rail that converts cash, cards, and fiat into stablecoins and crypto in seconds. Its patent-pending Unified Financial Rail uses AI Enhanced Routing Optimization (AERO) to route every payment across the cheapest, fastest network available.",
  },
  {
    q: "How does Loadit turn cash into crypto?",
    a: "A shopper pays with cash or card at a merchant on the Loadit network. The transaction is tokenized, identity-verified, and routed by AERO across L1s, L2s, Lightning, or banks — settling on-chain in seconds while the merchant still receives familiar fiat.",
  },
  {
    q: "What is AERO?",
    a: "AERO (AI Enhanced Routing Optimization) is Loadit's routing engine. It scores routes across legacy processors, blockchains, and liquidity pools in real time, choosing the optimal settlement path on every transaction — cutting fees by up to 86%.",
  },
  {
    q: "Which networks does Loadit support?",
    a: "Loadit arbitrates across Bitcoin, Ethereum, Solana, Base, XRPL, Polygon, the Lightning Network, and traditional banks — treating them as one unified rail.",
  },
  {
    q: "Is Loadit secure?",
    a: "Yes. Loadit uses end-to-end encryption, identity verification bound to every transaction, in-rail compliance with cryptographic audit trails, continuous AI monitoring, a self-healing network, and post-quantum-ready primitives.",
  },
];

/** Combined JSON-LD graph for the homepage. */
export function buildJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        slogan: SITE.tagline,
        logo: `${SITE.url}/icon.svg`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        publisher: { "@id": `${SITE.url}/#organization` },
      },
      {
        "@type": "Product",
        name: `${SITE.name} — Unified Financial Rail`,
        brand: { "@id": `${SITE.url}/#organization` },
        description:
          "AI-powered financial rail connecting cash, cards, crypto, stablecoins, and the future of money with real-time AERO routing.",
        category: "Financial Infrastructure",
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}
