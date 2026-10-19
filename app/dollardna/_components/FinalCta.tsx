"use client";

import { Button } from "@/components/ui/Button";

/** Final CTA — replay the simulation (dispatches to the Journey), request access via the existing flow, or email. */
export function FinalCta() {
  return (
    <section className="relative section-py" aria-labelledby="dna-final">
      <div className="container-px mx-auto max-w-4xl">
        <div className="glass grain relative overflow-hidden rounded-4xl p-10 text-center sm:p-16">
          <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 -translate-y-1/3" style={{ background: "radial-gradient(circle, rgba(34,169,92,0.18), transparent 70%)" }} />
          <h2 id="dna-final" className="text-balance text-3xl font-semibold tracking-tightest text-gradient sm:text-5xl">Explore the story behind the value.</h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-white/50">
            Replay the simulation, or tell us where connected history would matter in your product.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => window.dispatchEvent(new Event("dollardna:replay"))}>Replay the simulation</Button>
            <Button href="/#access" variant="secondary">Request access</Button>
            <Button href="mailto:colt@loadit.net?subject=DollarDNA" variant="ghost">Contact Loadit</Button>
          </div>
          <p className="mt-6 text-[11px] text-white/35">DollarDNA is in design. Requesting access joins the Loadit waitlist; it does not enable any DollarDNA feature.</p>
        </div>
      </div>
    </section>
  );
}
