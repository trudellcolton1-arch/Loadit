import { Reveal } from "@/components/ui/Reveal";
import { Section, Kicker, H2, Lede, StatusTag, Cta } from "./Bits";

/**
 * THE DESTINATION STATE — any value, to any value, anywhere on earth.
 * Vision, labeled as vision. The "today" column is drawn from what the live
 * demo actually routes so the ambition never reads as a claim.
 */
const TODAY = [
  ["Origins", "USD — cash, debit, credit, bank transfer"],
  ["Destinations", "USDC · USDT · BTC · ETH · SOL · XRP"],
  ["Networks", "Solana · Base · Ethereum · Polygon · XRPL · Lightning · Stellar"],
  ["Status", "Live demo of route selection. Platform pre-launch."],
];

const DESTINATION = [
  ["Origins", "Any currency, asset, or funding method a licensed partner can accept"],
  ["Destinations", "Every currency on earth — fiat, stablecoin, digital asset, cash, or card settlement"],
  ["Networks", "Every supported rail: banks, card networks, cash networks, blockchains, local payment schemes"],
  ["Status", "The design goal. Opened corridor by corridor, each with its own status."],
];

export function Vision() {
  return (
    <Section id="vision" grid>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Kicker>Where this goes</Kicker>
          <H2>
            Any value, to any value,
            <br />
            anywhere on earth.
          </H2>
          <Lede>
            The end state is simple to say: whatever form of money a customer has, converted or
            routed into whatever form the other side needs — any currency, any asset, any rail —
            through one interface. HQ was designed to route it; the UVCE was designed to convert
            it. Corridors open one at a time, and each one carries its real status.
          </Lede>
        </div>
        <StatusTag status="PLANNED" className="mb-2" />
      </div>

      <div className="mt-14 grid gap-4 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl border border-white/10 bg-[#070A12]/85 p-6 shadow-glass">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rail-400">Today</span>
              <StatusTag status="LIVE DEMO" />
            </div>
            <dl className="mt-5 divide-y divide-white/8">
              {TODAY.map(([k, v]) => (
                <div key={k} className="grid gap-1 py-3 sm:grid-cols-[120px_1fr]">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</dt>
                  <dd className="text-sm text-white/80">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
        <Reveal index={1}>
          <div className="h-full rounded-2xl border border-rail-400/30 bg-rail-400/[0.05] p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rail-400">The destination state</span>
              <StatusTag status="PLANNED" />
            </div>
            <dl className="mt-5 divide-y divide-white/8">
              {DESTINATION.map(([k, v]) => (
                <div key={k} className="grid gap-1 py-3 sm:grid-cols-[120px_1fr]">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</dt>
                  <dd className="text-sm text-white/85">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>

      <Reveal>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-5">
          <p className="max-w-2xl text-sm leading-relaxed text-white/60">
            The architecture does not care what the value is called. A peso, a stablecoin, a satoshi,
            a card authorization, and cash at a counter are all representations the conversion engine
            normalizes and the router scores. Adding a currency is adding a corridor, a licensed partner,
            and a status — not rebuilding the product.
          </p>
          <div className="flex flex-wrap gap-3">
            <Cta href="/network" variant="secondary" className="px-4 py-2.5 text-xs">What routes today</Cta>
            <Cta href="/access" className="px-4 py-2.5 text-xs">Tell us your corridor</Cta>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
