import { SITE } from "./constants";

/** FAQ content — also rendered visibly on the page for users + rich results. */
export const FAQS = [
  {
    q: "What is Loadit?",
    a: "Loadit is an AI-powered financial rail being built to convert cards, cash, and fiat into stablecoins and crypto in seconds. The production app is in development and not live for customers yet; retail cash-in through a licensed national cash network is certified (5/5) and launches with it. Its patent-pending Unified Financial Rail uses its AI, HQ, to route every payment across the cheapest, fastest network available.",
  },
  {
    q: "How will Loadit turn cash into crypto?",
    a: "When the production app launches, card purchases will be completed by licensed partners straight to a wallet you control, and cash-in — certification complete (5/5), launching with the same build — will let a shopper hand cash to a nearby retail counter; the transaction is identity-verified there and routed by HQ across L1s, L2s, Lightning, or banks, settling on-chain in seconds. Neither is live for customers yet.",
  },
  {
    q: "Is Loadit available today?",
    a: "Not yet. A prototype exists for demos and testing; the production app is being engineered now. Card and cash launch with it. Join the waitlist on loadit.net to be first in.",
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
          "The Loadit app (in development — production build being engineered) will turn cards and cash into Bitcoin, Solana, Ethereum, or USDC in seconds. Retail cash-in: certification complete (5/5), launching with it. Non-custodial, AI-routed, with HQ (an in-app AI money assistant), Pulse offline Bluetooth payments, send to any @handle or wallet, and a flat 0.75% fee. Not live yet.",
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
