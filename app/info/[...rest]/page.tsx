import type { Metadata } from "next";
import { notFound } from "next/navigation";

/** Unknown loadit.info paths render the investor-site not-found, never loadit.net's. */
export const metadata: Metadata = { title: "Not found", robots: { index: false } };

export default function InfoCatchAll() {
  notFound();
}
