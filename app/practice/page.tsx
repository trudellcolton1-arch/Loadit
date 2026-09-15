import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeConsole } from "./PracticeConsole";

/**
 * /practice?key=<PRACTICE_KEY> — secret-gated desktop leftover for the
 * MoneyGram test playground. The product Rail POC lives in the Expo app.
 * Key-gated (env PRACTICE_KEY); 404s without it. Sandbox-only — the API
 * refuses the public Stellar network.
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
