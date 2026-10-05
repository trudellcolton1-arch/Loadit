import { Cta, StatusTag } from "./Bits";
import { claim } from "../_lib/claims";

/**
 * HERO — explains the company in the first screen. The visual is one
 * illustrative transaction: source → Loadit coordinates → destination.
 * Static SVG, no metrics, no quotes.
 */
export function Hero() {
  return (
    <section id="opportunity" className="relative scroll-mt-20 overflow-hidden border-b border-white/8" aria-labelledby="hero-title">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-rail-400">Investor overview · pre-launch</p>
          <h1 id="hero-title" className="mt-5 text-balance text-4xl font-semibold leading-[1.04] tracking-tightest text-white sm:text-6xl">
            Connecting how people pay with how value is received.
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/65">
            Loadit is building infrastructure that coordinates movement between cash, traditional payment systems, and digital assets — so people can pay with what they have and recipients can receive what they need. The first product turns cash or a card into a digital asset delivered to a wallet the customer controls.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href="#contact">Request investor materials</Cta>
            <Cta href="#how-it-works" variant="secondary">Explore how Loadit works</Cta>
          </div>
          <dl className="mt-10 grid gap-3 text-sm sm:grid-cols-3">
            {[
              ["Stage", "Pre-launch. Prototype built; production app next."],
              ["Model", "Non-custodial coordination; licensed partners execute."],
              ["IP", "Patent application filed, 25 claims. Pending."],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</dt>
                <dd className="mt-1 text-white/80">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="rounded-2xl border border-white/10 bg-[#070A12] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">One transaction · illustrative flow</span>
            <StatusTag status="testing" />
          </div>
          <svg viewBox="0 0 520 300" className="mt-4 h-auto w-full" role="img" aria-label="Illustrative flow: cash handed to a licensed agent, Loadit coordinates verification, conversion, routing and delivery, and a digital asset arrives in the customer's own wallet.">
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0L10 5 0 10z" fill="rgba(255,255,255,0.4)" />
              </marker>
            </defs>
            {/* source */}
            <rect x="12" y="104" width="136" height="92" rx="14" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.16)" />
            <text x="80" y="134" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="2">SOURCE</text>
            <text x="80" y="158" textAnchor="middle" fill="#fff" fontFamily="Inter, system-ui, sans-serif" fontSize="14" fontWeight="600">$100 cash</text>
            <text x="80" y="177" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontFamily="Inter, system-ui, sans-serif" fontSize="10">at a licensed counter</text>
            <line x1="148" y1="150" x2="186" y2="150" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" markerEnd="url(#arr)" />
            {/* loadit */}
            <rect x="188" y="62" width="144" height="176" rx="16" fill="rgba(34,169,92,0.07)" stroke="rgba(52,209,122,0.55)" strokeWidth="1.3" />
            <text x="260" y="90" textAnchor="middle" fill="#fff" fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700" letterSpacing="4">LOADIT</text>
            <text x="260" y="106" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontFamily="ui-monospace, monospace" fontSize="8.5" letterSpacing="2">COORDINATES</text>
            {["Identity verified by the partner", "Value normalized", "Network selected", "Each step tracked"].map((t, i) => (
              <g key={t}>
                <circle cx="206" cy={132 + i * 24} r="3" fill="#34D17A" />
                <text x="216" y={136 + i * 24} fill="rgba(255,255,255,0.8)" fontFamily="Inter, system-ui, sans-serif" fontSize="10.5">{t}</text>
              </g>
            ))}
            <line x1="332" y1="150" x2="370" y2="150" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" markerEnd="url(#arr)" />
            {/* destination */}
            <rect x="372" y="104" width="136" height="92" rx="14" fill="rgba(255,255,255,0.95)" />
            <text x="440" y="134" textAnchor="middle" fill="rgba(4,6,11,0.55)" fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="2">DESTINATION</text>
            <text x="440" y="158" textAnchor="middle" fill="#04060B" fontFamily="Inter, system-ui, sans-serif" fontSize="14" fontWeight="600">Digital asset</text>
            <text x="440" y="177" textAnchor="middle" fill="rgba(4,6,11,0.6)" fontFamily="Inter, system-ui, sans-serif" fontSize="10">in the customer&apos;s own wallet</text>
            {/* partner line */}
            <text x="260" y="272" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontFamily="Inter, system-ui, sans-serif" fontSize="10.5">Licensed partners collect, convert, and deliver. Loadit coordinates and verifies; it never holds the funds.</text>
          </svg>
          <figcaption className="mt-3 text-xs leading-relaxed text-white/45">
            {claim("prototype")} Amounts shown are illustrative; no fee or timing is quoted.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
