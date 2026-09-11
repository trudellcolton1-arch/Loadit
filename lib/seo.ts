import { SITE } from "./constants";

/** FAQ content — also rendered visibly on the page for users + rich results. */
export const FAQS = [
  {
    q: "What is Loadit?",
    a: "Loadit is an AI-powered financial rail that converts cards and fiat into stablecoins and crypto in seconds; cash-in via MoneyGram's 350,000+ retail locations is in final testing under a signed partnership and launches soon. Its patent-pending Unified Financial Rail uses its AI, HQ, to route every payment across the cheapest, fastest network available.",
  },
  {
    q: "How will Loadit turn cash into crypto?",
    a: "Card purchases work today through licensed partners. Cash-in — in final certification with MoneyGram — will let a shopper hand cash to any MoneyGram counter; the transaction is identity-verified there and routed by HQ across L1s, L2s, Lightning, or banks, settling on-chain in seconds.",
  },
  {
    q: "How does HQ route payments?",
    a: "HQ is Loadit's AI routing engine. It scores routes across legacy processors, blockchains, and liquidity pools in real time, choosing the optimal settlement path on every transaction — cutting fees by up to 86%.",
  },
  {
    q: "Which networks does Loadit support?",
    a: "Loadit arbitrates across Bitcoin, Ethereum, Solana, Base, XRPL, Polygon, the Lightning Network, and traditional banks — treating them as one unified rail.",
  },
  {
    q: "Is Loadit secure?",
    a: "Yes. Loadit uses end-to-end encryption, identity verification bound to every transaction, in-rail compliance with cryptographic audit trails, continuous AI monitoring, a self-healing network, and post-quantum-ready primitives.",
  },
  {
    q: "What does Loadit charge?",
    a: "Loadit charges a flat 0.75% convenience fee ($1 minimum), plus a visible 0.25% when HQ swaps into another asset — built to compete with banks, not to extract from users. Its HQ engine routes the underlying network fees to the cheapest available path.",
  },
  {
    q: "Is Loadit custodial?",
    a: "No. Loadit is non-custodial and never holds user funds. Keys and signing stay with the user's wallet; Loadit only routes and settles payments.",
  },
  {
    q: "What is HQ?",
    a: "HQ is Loadit's AI. In the app, you tell it what you want to do with your money in plain language; on the rail, the same intelligence scores every network and executes the cheapest real route.",
  },
  {
    q: "What is Pulse?",
    a: "Pulse is Loadit's offline payments feature. You can send money to any phone nearby over Bluetooth with no internet; funds are locked in escrow and a cryptographically signed claim settles the moment either phone reconnects.",
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
        logo: `${SITE.url}/icon-512.png`,
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
          "AI-powered financial rail connecting cash, cards, crypto, stablecoins, and the future of money with real-time HQ routing.",
        category: "Financial Infrastructure",
      },
      {
        "@type": "SoftwareApplication",
        name: "Loadit",
        operatingSystem: "iOS, Android",
        applicationCategory: "FinanceApplication",
        url: `${SITE.url}/install`,
        description:
          "The Loadit app turns cards into Bitcoin, Solana, Ethereum, or USDC in seconds — cash-in at MoneyGram locations launching soon. Non-custodial, AI-routed, with HQ (an in-app AI money assistant), Pulse offline Bluetooth payments, send to any @handle or wallet, and a flat 0.75% fee.",
        publisher: { "@id": `${SITE.url}/#organization` },
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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
