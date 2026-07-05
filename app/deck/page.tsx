import type { Metadata } from "next";
import { DeckClient } from "./DeckClient";

export const metadata: Metadata = {
  title: "Investor Deck",
  description:
    "Loadit investor brief — the AI-powered financial rail. Cash and cards in, crypto and stablecoins out, routed the cheapest real way by HQ.",
  alternates: { canonical: "/deck" },
  robots: { index: false, follow: false },
};

export default function DeckPage() {
  return <DeckClient />;
}
