import type { Metadata } from "next";
import { RailConsole } from "./RailConsole";

/**
 * /rail — DEMO console for the Loadit rail runtime (lib/rail).
 *
 * Everything on this page runs the real runtime code in the browser against
 * SIMULATED demo doors — no real money, no live providers. MoneyGram cash-in
 * certification is IN FLIGHT: the MoneyGram door on this page demonstrates
 * the refusal gate, not a live cash intake.
 */

export const metadata: Metadata = {
  title: "Rail runtime — DEMO — Loadit",
  description:
    "Owner demo of the Loadit rail runtime: break a simulated pipe, then Heal under the same payment id. MoneyGram cash-in certification is in flight and is not the heal path.",
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
