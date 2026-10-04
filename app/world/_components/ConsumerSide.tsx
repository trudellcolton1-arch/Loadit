import { Reveal } from "@/components/ui/Reveal";
import { CONSUMER_ACTIONS, CONSUMER_FACTS, WORLD } from "../_lib/world";
import { Section, Kicker, Display, Lede, StatusBadge, Cta } from "./Bits";

/**
 * LOADIT FOR PEOPLE — the consumer product at loadit.net, action by action.
 * A ledger, not a card grid: the verb, what it does, and how real it is.
 */
export function ConsumerSide() {
  return (
    <Section id="people" className="border-y border-white/8 bg-[#070A12]/60">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Kicker>Loadit for people · loadit.net</Kicker>
          <Display>Seven verbs. One app.</Display>
          <Lede>
            Everything on this page becomes seven buttons for a person. Load. Send. Connect. Convert. Receive.
            Cash Out. Loadit One. Each screen asks ordinary questions; HQ, the conversion engine, and the
            partners stay underneath.
          </Lede>
          <dl className="mt-8 divide-y divide-white/8 rounded-2xl border border-white/10 bg-white/[0.02]">
            {CONSUMER_FACTS.map(([k, v]) => (
              <div key={k} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[90px_1fr]">
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</dt>
                <dd className="text-sm text-white/75">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href={`${WORLD.parent.url}/install`}>Get Loadit</Cta>
            <Cta href={WORLD.parent.url} variant="secondary">Loadit.net ↗</Cta>
          </div>
        </div>

        <Reveal>
          <ol className="overflow-hidden rounded-3xl border border-white/10 bg-[#04060B] shadow-glass" aria-label="Consumer actions">
            {CONSUMER_ACTIONS.map((a, i) => (
              <li key={a.verb} className="grid gap-3 border-b border-white/8 px-6 py-5 last:border-b-0 sm:grid-cols-[150px_1fr_auto] sm:items-start">
                <div>
                  <div className="font-mono text-[10px] text-white/30">{String(i + 1).padStart(2, "0")}</div>
                  <div className="mt-1 font-mono text-[13px] font-bold tracking-[0.25em] text-white">{a.verb}</div>
                </div>
                <div>
                  <p className="text-base text-white/85">{a.line}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/45">{a.now}</p>
                  <a href={a.href} className="mt-2 inline-block text-xs font-semibold text-rail-400 hover:text-rail-100">
                    Where it stands on Loadit.net →
                  </a>
                </div>
                <StatusBadge status={a.status} className="justify-self-start sm:justify-self-end" />
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </Section>
  );
}
