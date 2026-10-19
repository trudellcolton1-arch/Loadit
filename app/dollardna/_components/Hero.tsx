import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";

/**
 * HERO — "Different assets. Connected history." The visual is a connected
 * history across three asset types: a Bitcoin record, a linked USD record, a
 * linked USDC record, and the paid parcel with its context. Static SVG, lines
 * are the point. Dash flow is CSS and stops under reduced motion.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/8" aria-labelledby="dna-hero-title">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-fade" />
      <div className="container-px mx-auto grid max-w-6xl gap-12 pb-20 pt-16 sm:pt-24 lg:grid-cols-[1fr_1fr] lg:items-center lg:pb-28">
        <div>
          <Reveal>
            <Badge>DollarDNA · In design · Illustrative simulation</Badge>
          </Reveal>
          <Reveal index={1}>
            <h1 id="dna-hero-title" className="mt-6 text-balance text-4xl font-semibold leading-[1.04] tracking-tightest text-gradient sm:text-6xl">
              Different assets.
              <br />
              Connected history.
            </h1>
          </Reveal>
          <Reveal index={2}>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/60">
              DollarDNA is Loadit&apos;s framework for giving value a traceable history — from Bitcoin to US dollars to stablecoins and beyond. Follow recorded transfers, conversions, and context across the systems Loadit supports, and see plainly where the record stops.
            </p>
          </Reveal>
          <Reveal index={3}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="#journey">Explore the journey</Button>
              <Button href="#how" variant="secondary">How DollarDNA works</Button>
            </div>
            <p className="mt-5 text-xs text-white/40">
              A design in progress inside Loadit. The simulation below uses example rates and fictional people; no real funds move and no integration is claimed as live.
            </p>
          </Reveal>
        </div>

        <Reveal index={2}>
          <figure className="glass rounded-3xl p-5 sm:p-6">
            <svg viewBox="0 0 560 330" className="h-auto w-full" role="img" aria-label="Connected history: a Bitcoin record links to a US dollar record from a conversion, which links to a USDC record from a second conversion, which links to a paid parcel carrying a purpose and a signed note.">
              <defs>
                <linearGradient id="dna-link" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="50%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#5EEAD4" />
                </linearGradient>
              </defs>
              {/* links */}
              <path d="M128 92 C 180 92, 190 150, 240 150" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
              <path d="M128 92 C 180 92, 190 150, 240 150" fill="none" stroke="url(#dna-link)" strokeWidth="1.5" className="dna-flow" />
              <path d="M352 150 C 400 150, 410 92, 460 92" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
              <path d="M352 150 C 400 150, 410 92, 460 92" fill="none" stroke="url(#dna-link)" strokeWidth="1.5" className="dna-flow" />
              <path d="M352 150 C 400 150, 410 232, 460 232" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
              <path d="M352 150 C 400 150, 410 232, 460 232" fill="none" stroke="url(#dna-link)" strokeWidth="1.5" className="dna-flow" />
              <path d="M240 150 C 200 150, 190 232, 128 232" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" strokeDasharray="3 5" />

              {/* BTC entry */}
              <g>
                <rect x="16" y="60" width="112" height="64" rx="12" fill="rgba(251,191,36,0.06)" stroke="rgba(251,191,36,0.45)" />
                <text x="28" y="80" fill="rgba(255,255,255,0.45)" fontFamily="ui-monospace, monospace" fontSize="8.5" letterSpacing="2">P1 · ENTRY</text>
                <text x="28" y="100" fill="#FBBF24" fontFamily="ui-monospace, monospace" fontSize="13" fontWeight="700">0.00200000</text>
                <text x="28" y="114" fill="rgba(255,255,255,0.6)" fontFamily="ui-monospace, monospace" fontSize="9">BTC · referenced</text>
              </g>
              {/* USD from conversion */}
              <g>
                <rect x="240" y="118" width="112" height="64" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.3)" />
                <text x="252" y="138" fill="rgba(255,255,255,0.45)" fontFamily="ui-monospace, monospace" fontSize="8.5" letterSpacing="2">P2 · CONVERT</text>
                <text x="252" y="158" fill="#fff" fontFamily="ui-monospace, monospace" fontSize="13" fontWeight="700">119.10</text>
                <text x="252" y="172" fill="rgba(255,255,255,0.6)" fontFamily="ui-monospace, monospace" fontSize="9">USD · CNV-0001</text>
              </g>
              {/* USDC kept */}
              <g>
                <rect x="460" y="60" width="92" height="64" rx="12" fill="rgba(94,234,212,0.05)" stroke="rgba(94,234,212,0.4)" />
                <text x="472" y="80" fill="rgba(255,255,255,0.45)" fontFamily="ui-monospace, monospace" fontSize="8.5" letterSpacing="2">P7 · KEPT</text>
                <text x="472" y="100" fill="#5EEAD4" fontFamily="ui-monospace, monospace" fontSize="13" fontWeight="700">29.80</text>
                <text x="472" y="114" fill="rgba(255,255,255,0.6)" fontFamily="ui-monospace, monospace" fontSize="9">USDC</text>
              </g>
              {/* USDC paid with context */}
              <g>
                <rect x="460" y="200" width="92" height="64" rx="12" fill="rgba(94,234,212,0.08)" stroke="rgba(52,209,122,0.6)" />
                <text x="472" y="220" fill="rgba(255,255,255,0.45)" fontFamily="ui-monospace, monospace" fontSize="8.5" letterSpacing="2">P6 · PAID</text>
                <text x="472" y="240" fill="#5EEAD4" fontFamily="ui-monospace, monospace" fontSize="13" fontWeight="700">50.00</text>
                <text x="472" y="254" fill="rgba(255,255,255,0.6)" fontFamily="ui-monospace, monospace" fontSize="9">USDC · attested</text>
              </g>
              {/* USD kept */}
              <g>
                <rect x="16" y="200" width="112" height="64" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.18)" />
                <text x="28" y="220" fill="rgba(255,255,255,0.45)" fontFamily="ui-monospace, monospace" fontSize="8.5" letterSpacing="2">P4 · KEPT</text>
                <text x="28" y="240" fill="#fff" fontFamily="ui-monospace, monospace" fontSize="13" fontWeight="700">39.10</text>
                <text x="28" y="254" fill="rgba(255,255,255,0.6)" fontFamily="ui-monospace, monospace" fontSize="9">USD</text>
              </g>
              {/* context chip */}
              <g>
                <rect x="332" y="276" width="220" height="38" rx="10" fill="rgba(34,169,92,0.08)" stroke="rgba(52,209,122,0.4)" />
                <text x="344" y="292" fill="rgba(255,255,255,0.5)" fontFamily="ui-monospace, monospace" fontSize="8.5" letterSpacing="2">CONTEXT · ATTESTED</text>
                <text x="344" y="306" fill="#fff" fontFamily="Inter, system-ui, sans-serif" fontSize="10.5">Invoice #1042 — brand design · signed by sender</text>
              </g>
              <text x="16" y="318" fill="rgba(255,255,255,0.35)" fontFamily="ui-monospace, monospace" fontSize="8.5" letterSpacing="1.5">EXAMPLE RATES · FICTIONAL PEOPLE · NO FUNDS MOVE</text>
            </svg>
            <figcaption className="mt-3 text-xs text-white/45">
              One journey, four assets records, every link kept. The Bitcoin did not become a dollar; the exchange between them was recorded and linked.
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
