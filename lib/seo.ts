import { SITE } from "./constants";

/** FAQ content — also rendered visibly on the page for users + rich results. */
export const FAQS = [
  {
    q: "What is Loadit?",
    a: "Loadit is an AI-powered financial rail built to convert cash, cards, and fiat into stablecoins and crypto. Its patent-pending Unified Financial Rail uses its AI, HQ, to route every payment across the cheapest, fastest network available. Cash-in launches through Loadit's signed MoneyGram partnership once certification completes.",
  },
  {
    q: "How will Loadit turn cash into crypto?",
    a: "At launch, you pay cash at a MoneyGram counter. MoneyGram — the licensed money-transmitter — verifies your identity and converts the cash to USDC on Stellar, and HQ routes it into the asset you chose, delivered to a wallet you control. The partnership is signed and the integration has passed end-to-end tests on MoneyGram's test network; cash-in goes live when certification completes.",
  },
  {
    q: "Is Loadit's cash-in live today?",
    a: "Not yet. The MoneyGram partnership agreement is signed and the integration works end to end on MoneyGram's test network, but cash-in certification is still in progress. No customer cash is moving through the rail until it completes. Request access at loadit.net to be first in.",
  },
  {
    q: "How does HQ route payments?",
    a: "HQ is Loadit's AI routing engine. It scores routes across legacy processors, blockchains, and liquidity pools, choosing the optimal settlement path on every transaction — cutting modeled fees by up to 86% versus legacy rails.",
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
          "The Loadit app is built to turn cash and cards into Bitcoin, Solana, Ethereum, or USDC. Non-custodial, AI-routed, with HQ (an in-app AI money assistant), Pulse offline Bluetooth payments, send to any @handle or wallet, and a flat 0.75% fee. MoneyGram cash-in launches when certification completes.",
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
