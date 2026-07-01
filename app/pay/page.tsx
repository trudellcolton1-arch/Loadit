import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PayClient } from "@/components/PayClient";

export const metadata: Metadata = {
  title: "Pay a Loadit Cash QR",
  description:
    "Complete a scanned Loadit Cash QR: pay through a licensed partner (Coinbase or Stripe) and the crypto is delivered straight to the recipient's own wallet.",
  robots: { index: false },
};

export default function PayPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <section className="section-py container-px">
          <Suspense fallback={null}>
            <PayClient />
          </Suspense>
        </section>
      </main>
      <Footer />
    </>
  );
}
