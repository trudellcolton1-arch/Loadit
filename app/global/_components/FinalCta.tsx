import { Reveal } from "@/components/ui/Reveal";
import { Cta } from "./Bits";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[1000px] -translate-x-1/2 -translate-y-1/2"
        style={{ background: "radial-gradient(ellipse at center, rgba(34,169,92,0.12), transparent 60%)" }}
      />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <h2 className="text-balance text-4xl font-semibold tracking-tightest text-white sm:text-6xl">
            Where does your value need to go?
          </h2>
        </Reveal>
        <Reveal index={1}>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/55">
            Loadit Global is pre-launch. Join the list and we&apos;ll bring you in as the platform opens.
          </p>
        </Reveal>
        <Reveal index={2}>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Cta href="/access">Join the early-access list</Cta>
            <Cta href="/contact" variant="secondary">Talk to Loadit</Cta>
          </div>
        </Reveal>
        <Reveal index={3}>
          <div className="mt-20">
            <p className="font-mono text-sm font-bold tracking-[0.35em] text-white">LOADIT</p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.35em] text-rail-400">GPS for money.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
