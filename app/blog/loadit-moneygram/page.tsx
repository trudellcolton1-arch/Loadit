import type { Metadata } from "next";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Loadit × MoneyGram: Cash Is Coming On-Chain — Loadit",
  description:
    "Loadit has signed a partnership with MoneyGram. Soon you'll walk into any of 350,000+ MoneyGram locations, hand over cash, and walk out with Bitcoin, Solana, Ethereum, or USDC in your own wallet.",
  alternates: { canonical: "/blog/loadit-moneygram" },
  openGraph: {
    title: "Loadit × MoneyGram: Cash Is Coming On-Chain",
    description:
      "350,000+ locations. Cash in hand → crypto in your wallet. Non-custodial, AI-routed, quantum-proof receipts.",
    images: ["/blog/moneygram-in-app.png"],
  },
};

function Shot({ src, alt, caption, w, h }: { src: string; alt: string; caption: string; w: number; h: number }) {
  return (
    <figure className="my-10">
      <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <Image src={src} alt={alt} width={w} height={h} className="w-full" />
      </div>
      <figcaption className="mt-3 text-center text-xs text-white/40">{caption}</figcaption>
    </figure>
  );
}

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="px-5 pb-24 pt-24">
        <article className="mx-auto max-w-2xl">
          {/* header */}
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-rail-400">
            Announcement · August 2026
          </div>
          <h1 className="mt-4 text-balance text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
            Loadit × MoneyGram: cash is coming on-chain
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-white/60">
            Today we can finally say it out loud: <b className="text-white">Loadit has signed a partnership with
            MoneyGram</b>. Business verification — complete. Agreement — signed. Integration — built, and in final
            testing on MoneyGram&apos;s network right now.
          </p>

          <div className="prose-loadit mt-10 space-y-6 text-[15px] leading-relaxed text-white/70">
            <h2 className="text-2xl font-bold text-white">What this means</h2>
            <p>
              Soon, you&apos;ll walk into any of MoneyGram&apos;s <b className="text-white">350,000+ retail
              locations</b> — the same counters at grocery stores, pharmacies, and check-cashing spots in nearly
              every country on Earth — hand the agent cash, and walk out with{" "}
              <b className="text-white">Bitcoin, Solana, Ethereum, or USDC sitting in a wallet only you
              control</b>.
            </p>
            <p>
              No bank account. No card. No custodial exchange holding your coins. Cash in hand →
              crypto in your wallet, with Loadit&apos;s AI routing engine (HQ) picking the cheapest real path and
              sealing the receipt with post-quantum cryptography you can verify at{" "}
              <a href="/proof" className="text-rail-400 underline decoration-rail-400/40 underline-offset-4">loadit.net/proof</a>.
            </p>

            <Shot
              src="/blog/moneygram-in-app.png"
              alt="MoneyGram cash-in flow running inside the Loadit app"
              caption="Real footage: MoneyGram's cash-in flow running inside the Loadit app on our test network — live exchange rate, real agent locations."
              w={780} h={1520}
            />

            <h2 className="text-2xl font-bold text-white">How it works</h2>
            <p>
              Loadit is <b className="text-white">non-custodial by design</b> — we never hold, convert, or transmit
              your money. MoneyGram is the licensed money-transmitter: they take your cash at the counter and
              verify your identity, and the funds arrive as USDC on the Stellar network. From there, HQ — Loadit&apos;s
              routing engine — converts into the asset you actually asked for and delivers it straight to your own
              wallet. You never need to know what Stellar is. You just get your Bitcoin.
            </p>
            <p>The flow, from the app:</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Tell Loadit what you want: &quot;Turn $200 cash into Bitcoin.&quot;</li>
              <li>HQ quotes the route and seals a quantum-proof receipt before you pay.</li>
              <li>The app hands you to MoneyGram&apos;s flow — pick a location near you, confirm the amount.</li>
              <li>Pay cash at the counter. That&apos;s it. Your crypto lands in your wallet.</li>
            </ol>

            <Shot
              src="/blog/moneygram-receipt.png"
              alt="MoneyGram confirmation showing Loadit as the receiving wallet"
              caption='From our first end-to-end test deposits: MoneyGram&apos;s own confirmation, receive method — "LOADIT Wallet."'
              w={892} h={3202}
            />

            <h2 className="text-2xl font-bold text-white">Why this matters</h2>
            <p>
              Over a billion adults on this planet deal mostly in cash. Every &quot;easy&quot; way into crypto assumes
              the thing they don&apos;t have: a bank account, a debit card, a credit history. The cash economy has been
              locked out of the on-chain economy — not for lack of demand, but for lack of a bridge.
            </p>
            <p>
              MoneyGram&apos;s retail network is that bridge. It is one of the only places on Earth where the cash
              economy and the digital economy already stand at the same counter. Pairing it with Loadit&apos;s
              routing means the person paying in cash gets the same optimized pricing, the same self-custody, and
              the same verifiable receipts as anyone tapping a card in an app.
            </p>

            <Shot
              src="/blog/app-home.png"
              alt="The Loadit app home screen"
              caption="The Loadit app: say what you want in plain language — HQ finds the cheapest real route."
              w={780} h={1688}
            />

            <h2 className="text-2xl font-bold text-white">Where we are, honestly</h2>
            <p>
              The partnership is signed and our integration is live on MoneyGram&apos;s test network — we&apos;ve
              completed end-to-end test deposits through real agent locations, with identity verification, live
              exchange rates, and fee calculation, working inside the Loadit app on both iPhone and Android. The
              production launch ships in the Loadit app as soon as certification completes. If you want to be first
              through the door,{" "}
              <a href="/" className="text-rail-400 underline decoration-rail-400/40 underline-offset-4">
                request access at loadit.net
              </a>.
            </p>
            <p className="text-white/50">
              — Colton Trudell, founder, Loadit, Inc.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
