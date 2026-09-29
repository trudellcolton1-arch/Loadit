import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * Catch-all under /global so an unknown loaditglobal.com path renders the
 * Global-branded not-found (nested not-found.tsx only catches notFound(),
 * not unmatched URLs — without this, loadit.net's 404 would leak through).
 */
export const metadata: Metadata = { title: "Not found", robots: { index: false } };

export default function GlobalCatchAll() {
  notFound();
}
