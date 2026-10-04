import type { Metadata } from "next";
import { notFound } from "next/navigation";

/** Unknown loadit.world paths render the World not-found, never loadit.net's. */
export const metadata: Metadata = { title: "Not found", robots: { index: false } };

export default function WorldCatchAll() {
  notFound();
}
