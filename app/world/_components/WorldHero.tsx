import dynamic from "next/dynamic";
import { Reveal } from "@/components/ui/Reveal";
import { NODES, WORLD } from "../_lib/world";
import { Cta, StatusLegend } from "./Bits";

const NetworkGlobe = dynamic(() => import("./NetworkGlobe").then((m) => m.NetworkGlobe), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden />,
});

/**
 * HERO — full-screen opening. The planet of disconnected financial networks
 * sits behind the statement; routes already move between nodes so the first
 * thing the visitor sees is value in motion.
 */
export function WorldHero() {
  return (
    <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden" aria-labelledby="world-hero-title">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-y-0 right-0 w-full md:w-[62%]">
          <NetworkGlobe className="h-full w-full opacity-90" />
        </div>
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_25%_60%,rgba(4,6,11,0.95),rgba(4,6,11,0.35)_60%,rgba(4,6,11,0)_100%)] md:bg-[linear-gradient(90deg,#04060B_0%,#04060B_28%,rgba(4,6,11,0.55)_55%,rgba(4,6,11,0)_100%)]" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-void to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-32 sm:px-8 sm:pb-24">
        <Reveal>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-rail-400">Loadit.world · the vision</p>
        </Reveal>
        <Reveal index={1}>
          <h1
            id="world-hero-title"
            className="mt-5 max-w-4xl text-balance font-semibold uppercase leading-[0.92] tracking-tightest text-white [font-size:clamp(2.6rem,8.5vw,6.5rem)]"
          >
            The world where money works like the internet.
          </h1>
        </Reveal>
        <Reveal index={2}>
          <p className="mt-7 max-w-xl text-pretty text-lg leading-relaxed text-white/65 sm:text-xl">
            Money lives across thousands of disconnected networks. Loadit is building the intelligence layer designed to help value move between them.
          </p>
        </Reveal>
        <Reveal index={3}>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Cta href="#network">Explore the network</Cta>
            <Cta href="#vision" variant="secondary">See the vision</Cta>
            <Cta href={WORLD.parent.url} variant="ghost">Visit Loadit.net ↗</Cta>
          </div>
        </Reveal>
        <Reveal index={4}>
          <StatusLegend className="mt-10" />
        </Reveal>
      </div>

      {/* Accessible description of what the globe shows. */}
      <ul className="sr-only">
        {NODES.map((n) => (
          <li key={n.id}>{n.label}</li>
        ))}
      </ul>
    </section>
  );
}
