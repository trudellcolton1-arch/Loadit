import { Reveal } from "@/components/ui/Reveal";
import { LABS } from "../_lib/site";
import { Section, Kicker, H2, Lede, StatusTag } from "./Bits";

export function Labs() {
  return (
    <Section id="labs">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Loadit Labs</Kicker>
          <H2>Researching the future of value movement.</H2>
          <Lede>
            Forward-looking work, kept deliberately separate from what you can integrate
            today. Nothing here is an API capability yet.
          </Lede>
        </div>
        <StatusTag status="LABS" className="mb-2" />
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LABS.map((l, i) => (
          <Reveal key={l.name} index={i % 3}>
            <div className="h-full rounded-2xl border border-dashed border-white/15 p-6">
              <h3 className="text-base font-semibold text-white/90">{l.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{l.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
