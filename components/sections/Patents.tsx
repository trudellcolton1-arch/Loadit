"use client";

import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";

const PATENTS = [
  {
    code: "AERO",
    title: "AI Enhanced Routing Optimization",
    desc: "Real-time scoring of every settlement path across processors, L1s, L2s, and liquidity pools.",
    claims: 14,
  },
  {
    code: "QFR",
    title: "Quantum Financial Router",
    desc: "Explores millions of candidate paths in parallel when quantum hardware is available; classical fallback.",
    claims: 9,
  },
  {
    code: "TEMPORAL",
    title: "Temporal Settlement",
    desc: "Decouples initiation from settlement — lock rates, target gas windows, release on verified conditions.",
    claims: 11,
  },
  {
    code: "ENERGY",
    title: "Energy-Denominated Rails",
    desc: "Settle value in tokenized kWh backed by production data and IoT-verified generation.",
    claims: 8,
  },
  {
    code: "IDENTITY",
    title: "Offline Identity & Escrow",
    desc: "Identity-bound value transfer during outages, with cryptographic audit on reconnect.",
    claims: 10,
  },
  {
    code: "ORCHESTRATOR",
    title: "Unified Rail Orchestrator",
    desc: "Binds routing, quantum, temporal, energy, and offline identity into one transaction object.",
    claims: 12,
  },
] as const;

export function Patents() {
  return (
    <section id="patents" className="relative section-py">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="The Moat"
          title="A patent portfolio, not a feature list."
          description="Loadit's defensibility is the IP underneath the rail — primitives no payment network has."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PATENTS.map((p, i) => (
            <Reveal key={p.code} index={i % 3}>
              <div className="glass glass-hover group h-full rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-rail-gradient">
                    {p.code}
                  </span>
                  <Badge dot={false} className="text-[0.55rem]">
                    Patent Pending
                  </Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  {p.desc}
                </p>
                <div className="mt-5 border-t border-white/5 pt-4 font-mono text-xs text-white/35">
                  {p.claims} independent claims
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
