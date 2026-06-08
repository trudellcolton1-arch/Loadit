"use client";

import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";

const PATENTS = [
  {
    code: "AI ROUTER",
    title: "AI-Orchestrated Settlement Router",
    desc: "Evaluates live network conditions, liquidity, fees, and compliance to select the optimal path; predicts congestion, gas-fee volatility, and processor downtime.",
    claims: "Claims 7, 17",
  },
  {
    code: "QUANTUM",
    title: "Quantum Optimization Layer",
    desc: "Quantum-assisted search, quantum annealing, and variational algorithms to evaluate settlement paths — with a quantum-secure key-distribution subsystem.",
    claims: "Claims 9, 18",
  },
  {
    code: "TEMPORAL",
    title: "Temporal Settlement Subsystem",
    desc: "Retroactive, delayed, predictive, and condition-based settlement, with historical-state proofs via zero-knowledge proofs and verifiable state commitments.",
    claims: "Claims 10, 19, 20",
  },
  {
    code: "CONVERSION",
    title: "Universal Value Conversion",
    desc: "Non-custodial conversion between fiat, crypto, stablecoins, tokenized assets, loyalty units, energy credits, and programmable value instruments.",
    claims: "Claims 5, 8",
  },
  {
    code: "IVOR",
    title: "Identity-Verified Offline Rail",
    desc: "Biometrics, decentralized identity, and behavioral signatures authenticate offline; transactions seal in post-quantum escrow and reconcile via satellite/mesh on reconnect.",
    claims: "Claims 11, 12, 21",
  },
  {
    code: "COMPLIANCE",
    title: "Geo-Temporal Compliance Engine",
    desc: "Enforces jurisdiction-, asset-, and time-specific AML/KYC and data-residency in real time, dynamically selecting compliant rails.",
    claims: "Claims 15, 23",
  },
  {
    code: "SELF-HEALING",
    title: "Self-Healing Architecture",
    desc: "Detects rail failures and liquidity outages, replicates settlement packets across rails, and deterministically reconciles on network recovery.",
    claims: "Claims 16, 24",
  },
  {
    code: "MULTI-REALITY",
    title: "Multi-Reality & BCI Interface",
    desc: "Accepts transaction intent from AR/VR/XR and brain-computer-interface neural signals, converting them into cryptographically signed instructions.",
    claims: "Claims 13, 14, 22",
  },
] as const;

export function Patents() {
  return (
    <section id="patents" className="relative section-py">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="The Moat · Patent Pending"
          title="One unified patent. 25 claims."
          description="The Loadit Unified Financial Rail — a self-healing, AI-orchestrated, quantum-optimized, temporally programmable, offline-resilient, multi-reality value-conversion architecture. Eight subsystems, one application."
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
                  {p.claims}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
