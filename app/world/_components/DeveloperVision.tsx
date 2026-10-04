import { Reveal } from "@/components/ui/Reveal";
import { WORLD } from "../_lib/world";
import { Section, Kicker, Display, Lede, StatusBadge, Cta } from "./Bits";

const CONCEPT = `// Conceptual — the intended shape, not a shipped SDK.
await loadit.route({
  from: { type: "bank",   asset: "USD"  },
  to:   { type: "wallet", asset: "USDC" },
  amount: 100
})

// → { route: "selected", network: "…", eta: "…", cost: "…",
//     settlement: "non_custodial", status: "quoted" }`;

/**
 * FOR DEVELOPERS — one API, a world of value. Clearly labeled: the code is
 * conceptual; the real preview and the live routing demo live on Loadit Global.
 */
export function DeveloperVision() {
  return (
    <Section id="developers">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <Kicker>For developers</Kicker>
          <Display>
            One API.
            <br />
            A world of value.
          </Display>
          <Lede>
            Developers should eventually interact with every financial network through one Loadit interface: state what is coming in and what must come out, receive the route and a normalized settlement object.
          </Lede>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href={`${WORLD.global.url}/developers/sandbox`} variant="secondary">Watch the live routing demo</Cta>
            <Cta href={`${WORLD.global.url}/developers/api`} variant="ghost">API preview on Loadit Global →</Cta>
          </div>
        </div>
        <Reveal className="min-w-0">
          <div className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-[#070A12] shadow-glass">
            <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/45">loadit.route · conceptual</span>
              <StatusBadge status="vision" />
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-white/85"><code>{CONCEPT}</code></pre>
            <div className="border-t border-white/8 px-5 py-3 text-[11px] leading-relaxed text-white/45">
              What exists today: a routing endpoint that returns the selected network, cost, time, risk, and confidence for a stated origin and destination — running in the live demo on Loadit Global, pre-launch for integrators.
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
