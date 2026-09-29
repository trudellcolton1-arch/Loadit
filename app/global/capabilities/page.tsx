import type { Metadata } from "next";
import { PageShell } from "../_components/PageShell";
import { Capabilities } from "../_components/Capabilities";
import { Whiteboard } from "../_components/Whiteboard";
import { Roadmap } from "../_components/Roadmap";
import { Vision } from "../_components/Vision";
import { FinalCta } from "../_components/FinalCta";
import { Section, Kicker, H2, Lede, StatusTag, Cta } from "../_components/Bits";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Embedded capabilities",
  description:
    "Load, Send, Connect, Convert, Receive, Cash Out, and Loadit One — the seven money actions a partner can embed through Loadit's APIs, SDKs, and white-label experiences, each with its honest status and launch phase.",
  alternates: { canonical: "/capabilities" },
};

export default function CapabilitiesPage() {
  return (
    <PageShell
      eyebrow="Embedded capabilities"
      title="One infrastructure layer instead of building every connection yourself."
      lede="Loadit gives a business one layer for supported money movement, conversion, interoperability, and spending — LOAD, SEND, CONNECT, CONVERT, RECEIVE, CASH OUT, and LOADIT ONE — inside its own product. HQ orchestrates the outcome, the UVCE handles conversion, connected partners execute, and Loadit verifies the result."
      status="COMING SOON"
    >
      <Capabilities full />

      {/* faster availability — the honest version */}
      <Section tight>
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <Kicker>Faster availability</Kicker>
            <H2>&ldquo;Instant&rdquo; is a liquidity question, not a wording question.</H2>
            <Lede>
              Customers hate waiting for deposited funds to clear. That is a settlement-risk and
              credit problem, and software wording alone cannot solve it. Loadit will never tell a
              partner that uncleared money is cleared.
            </Lede>
          </div>
          <Reveal>
            <div className="rounded-2xl border border-white/10 bg-[#070A12]/85 p-6 shadow-glass">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-rail-400">How it can actually work</span>
                <StatusTag status="PLANNED" />
              </div>
              <ol className="mt-4 space-y-3 text-sm text-white/70">
                <li className="flex gap-3"><span className="font-mono text-[11px] text-rail-400">01</span>A customer starts a slow-rail funding event, say a $500 bank transfer.</li>
                <li className="flex gap-3"><span className="font-mono text-[11px] text-rail-400">02</span>An approved partner with a prefunded pool, credit facility, or guarantee risk-checks the transaction.</li>
                <li className="flex gap-3"><span className="font-mono text-[11px] text-rail-400">03</span>HQ weighs risk, fee, speed, and partner availability, and selects the prefunded route only if it is eligible.</li>
                <li className="flex gap-3"><span className="font-mono text-[11px] text-rail-400">04</span>The partner releases $500 now. The slow rail settles later and replenishes the pool.</li>
                <li className="flex gap-3"><span className="font-mono text-[11px] text-rail-400">05</span>If the incoming payment fails, the signed agreement says who takes the loss. Never a surprise.</li>
              </ol>
              <p className="mt-4 text-xs text-white/40">
                Not offered until the facility, the limits, the fraud controls, and the contractual risk allocation are actually in place.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      <Whiteboard />
      <Roadmap />
      <Vision />

      <Section tight>
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-rail-400/30 bg-rail-400/[0.05] p-6 sm:p-8">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rail-400">The 15-second version for a business</div>
              <p className="mt-2 max-w-2xl text-lg font-medium leading-snug text-white">
                &ldquo;Loadit gives us one infrastructure layer for supported money movement, conversion,
                interoperability, and spending capabilities instead of building every connection and
                transaction flow ourselves.&rdquo;
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Cta href="/access">Join the early-access list</Cta>
              <Cta href="/developers/transaction-model" variant="secondary">Read the transaction model</Cta>
            </div>
          </div>
        </Reveal>
      </Section>

      <FinalCta />
    </PageShell>
  );
}
