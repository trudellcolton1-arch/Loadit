import { Reveal } from "@/components/ui/Reveal";
import { SEGMENTS } from "../_lib/site";
import { Section, Kicker, H2, Lede } from "./Bits";

/**
 * SEGMENT BY SEGMENT — "What problem do I have today that Loadit fixes?"
 * Each card answers honestly: the problem, the answer, before / after, and
 * when NOT to use Loadit. If a direct provider already does the exact job
 * better, Loadit should not add itself just to add a fee.
 */
export function Segments() {
  return (
    <Section id="segments" grid>
      <Kicker>Why a business integrates</Kicker>
      <H2>&ldquo;What problem do I have today that Loadit fixes?&rdquo;</H2>
      <Lede>
        You do not need Loadit for what you already do well. Loadit earns its place only where
        it adds a transaction type, a conversion, a destination, an interoperability layer, or a
        spending behavior you do not already provide efficiently.
      </Lede>

      <div className="mt-14 grid gap-4 lg:grid-cols-2">
        {SEGMENTS.map((s, i) => (
          <Reveal key={s.id} index={i % 2}>
            <article id={s.id} className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#070A12]/85 p-6 shadow-glass">
              <h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white">{s.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{s.problem}</p>
              <p className="mt-3 border-l-2 border-rail-400/60 pl-3 text-sm font-medium leading-relaxed text-white/85">{s.answer}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Before Loadit</div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">{s.before}</p>
                </div>
                <div className="rounded-xl border border-rail-400/20 bg-rail-400/[0.04] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-rail-400">After Loadit</div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/75">{s.after}</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-white/40">
                <span className="font-mono uppercase tracking-[0.15em] text-white/50">When not to use Loadit · </span>
                {s.not}
              </p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-12 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 lg:grid-cols-2">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rail-400">The business sentence</div>
            <p className="mt-3 text-lg font-medium leading-snug text-white">
              &ldquo;Before Loadit, we had to build and operate a separate integration for every new
              funding method, conversion, network, wallet destination, off-ramp, or cross-platform route.
              After Loadit, we submit supported transaction intents through one common infrastructure.&rdquo;
            </p>
          </div>
          <div className="text-sm leading-relaxed text-white/55">
            <p>
              That saves engineering and operations work and opens transaction types you did not have,
              because HQ coordinates the supported connections underneath. When it does not — when a
              direct provider already does your exact job better — we will tell you so.
            </p>
            <p className="mt-3">
              Every feature must have a real company, a real starting value, a real destination, a real
              before-flow, a real after-flow, and a clear reason Loadit belongs in the middle. Advanced
              technology counts only when it makes one of those transactions possible, cheaper, faster,
              safer, or easier.
            </p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
