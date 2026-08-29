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
    "Demo console for the Loadit rail runtime: intent → HQ score → quote → door intake → convert → payout, with self-heal. Simulated doors only; MoneyGram cash-in certification is in flight.",
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
