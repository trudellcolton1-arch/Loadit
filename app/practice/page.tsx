import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeConsole } from "./PracticeConsole";

/**
 * /practice?key=<PRACTICE_KEY> — founder-only desktop console for the
 * MoneyGram sandbox run. Key-gated (env PRACTICE_KEY); 404s without it so
 * the page is invisible to anyone else. Sandbox-only by construction —
 * the underlying API refuses to run against the public Stellar network.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Practice run — Loadit",
  robots: { index: false, follow: false },
};

export default function PracticePage({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  const expected = process.env.PRACTICE_KEY;
  if (!expected || searchParams.key !== expected) notFound();
  return (
    <main className="min-h-screen bg-[#05070C]">
      <PracticeConsole />
    </main>
  );
}
