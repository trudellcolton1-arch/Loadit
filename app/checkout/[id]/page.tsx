import type { Metadata } from "next";
import { CheckoutClient } from "@/components/CheckoutClient";

export const metadata: Metadata = {
  title: "Secure USDC Checkout — Loadit",
  description:
    "Pay with USDC straight to the merchant's own wallet. Non-custodial, verified on-chain by Loadit.",
  robots: { index: false, follow: false },
};

/**
 * HOSTED MERCHANT CHECKOUT — /checkout/<session id>.
 *
 * The page a merchant's create-session API call points buyers at. A thin
 * server shell: all session state (status, amounts, destination, expiry)
 * comes from /api/checkout/session/:id so the client can poll settlement
 * live. Distinct from /pay, which is the Cash QR flow.
 */
export default function CheckoutPage({ params }: { params: { id: string } }) {
  return (
    <main className="relative min-h-screen bg-void">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40vh] bg-grid-fade" />
      <section className="container-px relative mx-auto flex min-h-screen max-w-lg flex-col justify-center py-10">
        <CheckoutClient id={params.id} />
      </section>
    </main>
  );
}
