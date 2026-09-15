import type { Metadata } from "next";
import { RailConsole } from "./RailConsole";

/**
 * /rail — simulated DEMO of lib/rail in the browser.
 *
 * The product Rail POC lives in the Expo app (mobile/app/rail.tsx), not here.
 * This page is a developer leftover: simulated doors only, no real money.
 * Cert approved (4/5) — final go-live pending. Do not treat this as the product.
 */

export const metadata: Metadata = {
  title: "Not the product — simulated leftover — Loadit",
  description:
    "Simulated leftover of lib/rail. The product Rail POC lives in the Loadit Expo app. Cash-in is not live. Cert approved (4/5) — final go-live pending.",
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
