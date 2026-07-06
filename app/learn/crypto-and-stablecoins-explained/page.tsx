import type { Metadata } from "next";
import { ArticleLayout } from "@/components/ArticleLayout";

export const metadata: Metadata = {
  title: "Crypto and Stablecoins Explained",
  description:
    "The differences, advantages, and payment use cases of crypto and stablecoins — in plain language for anyone moving money, sending remittances, or accepting payments.",
  alternates: { canonical: "/learn/crypto-and-stablecoins-explained" },
};

const faqs = [
  {
    q: "What is the difference between crypto and stablecoins?",
    a: "A stablecoin is a type of cryptocurrency pegged to a stable asset — usually the US dollar — so 1 unit stays worth about $1. Other crypto like Bitcoin or Ethereum floats freely in price. Stablecoins are used for payments and saving in dollars; volatile crypto is used for investing and as network fuel.",
  },
  {
    q: "Are stablecoins safe to use for payments?",
    a: "Reputable, fully-backed stablecoins like USDC are widely used for payments because they hold their value, settle in seconds, and cost pennies to move. Safety depends on the issuer's reserves and the network used — a good rail handles network selection and compliance for you.",
  },
  {
    q: "Can I use stablecoins to send money internationally?",
    a: "Yes. Stablecoins settle globally in seconds for a few cents, making them ideal for remittances and cross-border payments versus multi-day, high-fee wires. Loadit lets you turn cash into stablecoins or any crypto and send to a @handle or wallet.",
  },
];

export default function Page() {
  return (
    <ArticleLayout
      slug="crypto-and-stablecoins-explained"
      kind="Explainer"
      title="Crypto and stablecoins explained"
      description="The differences, advantages, and payment use cases of crypto and stablecoins — in plain language for anyone moving money, sending remittances, or accepting payments."
      updated="2026-07-06"
      readMins={5}
      faqs={faqs}
    >
      <p>
        &ldquo;Crypto&rdquo; and &ldquo;stablecoins&rdquo; get used interchangeably, but they solve different problems.
        Understanding the difference is the key to using either one well — especially for payments. Here&apos;s the plain-
        language version.
      </p>

      <h2>What is cryptocurrency?</h2>
      <p>
        A <strong>cryptocurrency</strong> is digital money recorded on a blockchain — a shared, tamper-resistant ledger
        that no single company controls. Bitcoin and Ethereum are the best-known. Their prices <em>float</em>: supply and
        demand move them up and down, sometimes sharply. That makes them useful as investments and as the &ldquo;fuel&rdquo;
        that powers their networks, but awkward for everyday pricing — no one wants a coffee to cost a different amount
        every hour.
      </p>

      <h2>What is a stablecoin?</h2>
      <p>
        A <strong>stablecoin</strong> is a cryptocurrency engineered to hold a steady value, almost always pegged to the
        US dollar. One unit of a reputable stablecoin like <strong>USDC</strong> is designed to always be worth about
        $1, backed by real reserves. You get the superpowers of crypto — instant, global, programmable, low-fee — without
        the price swings. That combination is why stablecoins have become the default rail for on-chain payments.
      </p>

      <h2>Crypto vs. stablecoins at a glance</h2>
      <ul>
        <li><strong>Price:</strong> crypto floats; stablecoins stay pegged (≈$1).</li>
        <li><strong>Main use:</strong> crypto for investing and network fees; stablecoins for payments and saving in dollars.</li>
        <li><strong>Volatility:</strong> high for crypto; near-zero for stablecoins.</li>
        <li><strong>Shared traits:</strong> both settle globally in seconds, move for cents, and are non-custodial when you hold your own keys.</li>
      </ul>

      <h2>Where each shines in payments</h2>
      <h3>Stablecoins</h3>
      <ul>
        <li><strong>Remittances:</strong> send dollars abroad in seconds for a few cents instead of days and high fees.</li>
        <li><strong>Merchant settlement:</strong> receive dollar value instantly without card-network delays.</li>
        <li><strong>Saving in dollars:</strong> hold value in USD terms from anywhere in the world.</li>
      </ul>
      <h3>Volatile crypto</h3>
      <ul>
        <li><strong>Investing and exposure:</strong> owning BTC, ETH, SOL, and others.</li>
        <li><strong>Network fees:</strong> paying &ldquo;gas&rdquo; to use a blockchain.</li>
        <li><strong>Store of value:</strong> Bitcoin as long-term, scarce digital money.</li>
      </ul>

      <h2>How Loadit fits</h2>
      <p>
        Loadit lets anyone turn cash or a card into the crypto or stablecoin they want in seconds, then send it to a
        <a href="/"> @handle</a> or any wallet address — or even to a phone nearby with no internet. Under the hood,
        Loadit&apos;s <a href="/learn/ai-powered-financial-routing">AI routing engine</a> moves value over the cheapest,
        fastest network and is fully non-custodial, so you always hold your own funds. Whether you want the stability of
        USDC or exposure to Bitcoin, the mechanics are handled for you.
      </p>
    </ArticleLayout>
  );
}
