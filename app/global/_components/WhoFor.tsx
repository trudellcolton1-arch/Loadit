import { Reveal } from "@/components/ui/Reveal";
import { SOLUTIONS } from "../_lib/site";
import { Section, Kicker, H2, Lede } from "./Bits";

export function WhoFor({ full = false }: { full?: boolean }) {
  return (
    <Section id="solutions">
      <Kicker>Who Loadit is for</Kicker>
      <H2>
        One routing layer.
        <br />
        Built for many business models.
      </H2>
      {full && (
        <Lede>
          The integration is the same. What differs is what you tell Loadit is coming in,
          and what you tell it needs to come out.
        </Lede>
      )}
      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {SOLUTIONS.map((s, i) => (
          <Reveal key={s.name} index={i % 3} className="bg-[#070A12] p-7">
            <h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white">{s.name}</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/58">{s.body}</p>
          </Reveal>
        ))}
        <div className="flex items-center bg-[#070A12] p-7 sm:col-span-2 lg:col-span-2">
          <p className="text-lg font-medium text-white/80">
            Your application shouldn&apos;t need to understand every rail underneath it.
          </p>
        </div>
      </div>
    </Section>
  );
}
