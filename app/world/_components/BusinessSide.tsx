import { Reveal } from "@/components/ui/Reveal";
import { BUSINESS, WORLD } from "../_lib/world";
import { Section, Kicker, Display, Lede, StatusBadge, Cta } from "./Bits";

/**
 * LOADIT FOR BUSINESSES — the same rail, offered to banks, wallets, fintechs,
 * and platforms through Loadit Global. Two front doors, one engine.
 */
export function BusinessSide() {
  return (
    <Section id="business">
      <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <Kicker>Loadit for businesses · loaditglobal.com</Kicker>
          <Display>Same engine. Your brand on the screen.</Display>
          <Lede>
            A business doesn&apos;t press the seven buttons — it embeds them. Loadit Global is where banks, exchanges,
            wallets, fintechs, payroll and remittance platforms, and merchants get the routing layer as infrastructure:
            one transaction object, one API, every rail underneath. Pre-launch, opening to early-access partners first.
          </Lede>

          <Reveal>
            <ol className="mt-10 grid gap-3 sm:grid-cols-2" aria-label="Loadit Global">
              {BUSINESS.map((b) => (
                <li key={b.href}>
                  <a href={b.href} className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#070A12]/85 p-5 transition-colors hover:border-white/30">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-base font-semibold text-white">{b.label}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-white/60">{b.desc}</p>
                    <span className="mt-3 text-xs font-semibold text-rail-400">loaditglobal.com →</span>
                  </a>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <Reveal index={1}>
          <div className="rounded-3xl border border-white/10 bg-[#04060B] p-6 shadow-glass sm:p-8 lg:sticky lg:top-28">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">Two front doors</p>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/12 p-4">
                <div className="font-mono text-[12px] font-bold tracking-[0.22em] text-white">LOADIT<span className="text-white/45">.NET</span></div>
                <p className="mt-1.5 text-sm text-white/65">For people. The app, the card, cash-in, Load.club.</p>
              </div>
              <div className="rounded-2xl border border-rail-400/40 bg-rail-400/[0.06] p-4">
                <div className="font-mono text-[12px] font-bold tracking-[0.22em] text-white">LOADIT<span className="text-white/45"> GLOBAL</span></div>
                <p className="mt-1.5 text-sm text-white/65">For businesses and developers. APIs, SDKs, white-label, early access.</p>
              </div>
              <div className="rounded-2xl border border-dashed border-white/15 p-4">
                <div className="font-mono text-[12px] font-bold tracking-[0.22em] text-white">LOADIT<span className="text-white/45">.WORLD</span></div>
                <p className="mt-1.5 text-sm text-white/65">You are here. Where it all goes.</p>
              </div>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-white/45">
              One engine, one transaction object, one set of partners. The consumer product proves each capability first; then it is exposed to partners.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Cta href={WORLD.global.url} className="px-4 py-2.5 text-xs">Loadit Global ↗</Cta>
              <Cta href={`${WORLD.global.url}/access`} variant="secondary" className="px-4 py-2.5 text-xs">Join the early-access list</Cta>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
