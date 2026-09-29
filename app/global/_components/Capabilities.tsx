import { Reveal } from "@/components/ui/Reveal";
import { CAPABILITIES } from "../_lib/site";
import { Section, Kicker, H2, Lede, StatusTag, Cta } from "./Bits";

/**
 * EMBEDDED CAPABILITIES — the seven customer actions, as a partner embeds them.
 * Compact on the home page; full on /capabilities with the embed story, a
 * concrete example, and the honest status per module.
 */
export function Capabilities({ full = false }: { full?: boolean }) {
  return (
    <Section id="capabilities" grid={full}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Kicker>Embedded capabilities</Kicker>
          <H2>
            Load. Send. Connect. Convert.
            <br />
            Receive. Cash Out. Loadit One.
          </H2>
          <Lede>
            The same transaction engine that powers Loadit for people, offered to businesses
            through APIs, SDKs, and white-label experiences. Your customer presses a button
            inside your product; HQ decides, the UVCE converts, partners execute, Loadit
            verifies the result.
          </Lede>
        </div>
        {!full && (
          <Cta href="/capabilities" variant="secondary" className="mb-1">All capabilities →</Cta>
        )}
      </div>

      <div className={`mt-14 grid gap-4 ${full ? "lg:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {CAPABILITIES.map((c, i) => (
          <Reveal key={c.id} index={i % 3}>
            <article
              id={full ? c.id : undefined}
              className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#070A12]/85 p-6 shadow-glass"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rail-400">{c.verb}</div>
                  <h3 className="mt-1.5 text-lg font-semibold text-white">{c.name}</h3>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusTag status={c.status} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">Phase {c.phase}</span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{c.line}</p>

              {full && (
                <>
                  <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">What you embed</div>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/65">{c.embed}</p>
                  </div>
                  <div className="mt-3 rounded-xl border border-rail-400/20 bg-rail-400/[0.04] p-4">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-rail-400">Real-world example</div>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/75">{c.example}</p>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-white/40">{c.note}</p>
                </>
              )}
            </article>
          </Reveal>
        ))}
      </div>

      {!full && (
        <p className="mt-6 text-xs text-white/40">
          Statuses follow the launch sequence. Load is in build; the rest is planned in order.
          Nothing is open for integration yet.
        </p>
      )}
    </Section>
  );
}
