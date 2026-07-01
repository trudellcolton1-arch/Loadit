import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Loadit handles your data across the website, API, and mobile app.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "Who we are",
    p: [
      "Loadit (loadit.net) provides an AI-powered routing layer for moving value — comparing networks and licensed on-ramp providers to find the cheapest, fastest path from cash, cards, and fiat into digital assets. Loadit is non-custodial: we never hold, convert, or transmit your funds.",
    ],
  },
  {
    h: "What we collect",
    p: [
      "Contact details you give us — such as your email when you join the waitlist, request an API key, or contact support.",
      "Usage data — anonymous events like which routes are computed and which partner links are clicked, plus standard technical logs (browser type, referring page). We use this to improve routing and measure what works.",
      "Routing inputs — amounts, assets, and funding methods you enter to get a quote. These are processed to compute routes and are not tied to your identity by Loadit.",
      "In the mobile app — if you sign in with Hylaq, we receive basic profile information (name, email) from that login. Your wallet address is used only to hand off to the on-ramp provider you choose.",
    ],
  },
  {
    h: "What we do NOT collect",
    p: [
      "We do not collect or store payment card numbers, bank credentials, government IDs, or KYC documents. Identity verification and payment processing happen entirely with the licensed partner completing your purchase (for example Stripe or Coinbase), under their own privacy policies.",
      "We do not hold private keys and cannot access your wallet.",
    ],
  },
  {
    h: "How we use data",
    p: [
      "To compute and improve routes, operate the service, respond to you, send product updates you asked for, and understand aggregate usage. We do not sell personal data.",
    ],
  },
  {
    h: "Sharing",
    p: [
      "When you continue to a partner (e.g. Stripe, Coinbase, an exchange), you leave Loadit and their terms and privacy policies apply. We may share aggregate, non-identifying statistics. We share personal data only with service providers that help us run Loadit (e.g. hosting, analytics, email), or if required by law.",
    ],
  },
  {
    h: "AI features",
    p: [
      "Questions you ask AERO and plain-language routing requests are processed by our AI providers to generate answers and parse intents. Don't include sensitive personal information in prompts.",
    ],
  },
  {
    h: "Retention & your rights",
    p: [
      "We keep personal data only as long as needed for the purposes above. You can ask us to access, correct, or delete your data at any time — email trudellcolton@gmail.com and we'll handle it.",
    ],
  },
  {
    h: "Changes",
    p: [
      "We'll update this page as the product evolves and adjust the date below. Material changes will be highlighted on this page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <section className="section-py">
          <div className="container-px mx-auto max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-white/40">
              Last updated: July 2026
            </p>
            <div className="mt-10 space-y-8">
              {SECTIONS.map((s) => (
                <div key={s.h}>
                  <h2 className="text-lg font-semibold text-white">{s.h}</h2>
                  {s.p.map((para, i) => (
                    <p key={i} className="mt-2 text-sm leading-relaxed text-white/60">
                      {para}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
