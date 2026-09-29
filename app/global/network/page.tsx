import type { Metadata } from "next";
import { PageShell } from "../_components/PageShell";
import { GlobalNetwork } from "../_components/GlobalNetwork";
import { Section, Kicker, H2, Lede, StatusTag } from "../_components/Bits";
import { FinalCta } from "../_components/FinalCta";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Network",
  description: "The rails, funding methods, and assets Loadit routes across today, with the status of each.",
  alternates: { canonical: "/network" },
};

const RAILS = [
  { name: "Solana", note: "Fast, low-cost settlement" },
  { name: "Base", note: "Ethereum L2" },
  { name: "Ethereum", note: "Mainnet" },
  { name: "Polygon", note: "EVM sidechain" },
  { name: "XRPL", note: "XRP Ledger" },
  { name: "Lightning", note: "Bitcoin payment channels" },
];

export default function NetworkPage() {
  return (
    <PageShell eyebrow="Network" title="The rails underneath the route." lede="Loadit does not own rails. It evaluates them. These are the networks, funding methods, and assets the routing layer arbitrates across today — each labeled by status.">
      <Section tight>
        <Kicker>Settlement networks</Kicker>
        <H2>Six rails, scored on every request — in build.</H2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RAILS.map((r, i) => (
            <Reveal key={r.name} index={i % 3}>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
                <div>
                  <div className="font-mono text-sm font-bold tracking-[0.15em] text-white">{r.name.toUpperCase()}</div>
                  <div className="text-xs text-white/45">{r.note}</div>
                </div>
                <StatusTag status="IN BUILD" />
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tight>
        <Kicker>Origins</Kicker>
        <H2>What value can enter.</H2>
        <Lede>Card and bank-originated value route through licensed partners; cash-originated value is certified with a licensed national cash network (5/5). None of it is open to integrators yet — the platform is pre-launch.</Lede>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Debit card", "IN BUILD"],
            ["Credit card", "IN BUILD"],
            ["Bank transfer", "IN BUILD"],
            ["Cash at a counter", "IN BUILD"],
          ].map(([n, s]) => (
            <div key={n} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
              <span className="text-sm text-white">{n}</span>
              <StatusTag status={s as "IN BUILD"} />
            </div>
          ))}
        </div>
      </Section>

      <Section tight>
        <Kicker>Destinations</Kicker>
        <H2>What value can come out.</H2>
        <div className="mt-10 flex flex-wrap gap-2">
          {["USDC", "USDT", "BTC", "ETH", "SOL", "XRP"].map((a) => (
            <span key={a} className="rounded-lg border border-white/12 bg-white/[0.03] px-4 py-2 font-mono text-sm text-white">{a}</span>
          ))}
          <span className="rounded-lg border border-dashed border-white/15 px-4 py-2 font-mono text-sm text-white/50">USD · fiat settlement — planned</span>
        </div>
      </Section>

      <GlobalNetwork />
      <FinalCta />
    </PageShell>
  );
}
