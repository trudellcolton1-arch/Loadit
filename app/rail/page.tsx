import type { Metadata } from "next";
import { RailConsole } from "./RailConsole";

/**
 * /rail — simulated DEMO of lib/rail in the browser.
 *
 * The product Rail POC lives in the Expo app (mobile/app/rail.tsx), not here.
 * This page is a developer leftover: simulated doors only, no real money.
 * Certification complete (5/5); consumer cash-in launches with the production build. Do not treat this as the product.
 */

export const metadata: Metadata = {
  title: "Not the product — simulated leftover — Loadit",
  description:
    "Simulated leftover of lib/rail. The product Rail POC lives in the Loadit Expo app. Certification complete (5/5); consumer cash-in launches with the production build.",
  alternates: { canonical: "/rail" },
  robots: { index: false, follow: false },
};

export default function RailPage() {
  return (
    <main className="min-h-screen bg-[#05070C]">
      <RailConsole />
    </main>
  );
}
