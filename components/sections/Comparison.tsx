"use client";

import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

const COLS = ["Loadit", "Visa", "SWIFT", "Stripe"] as const;

type Cell = "yes" | "no" | "partial";

const ROWS: { cap: string; cells: [Cell, Cell, Cell, Cell] }[] = [
  { cap: "AI route optimization", cells: ["yes", "no", "no", "no"] },
  { cap: "Cash → crypto at POS (launching)", cells: ["partial", "no", "no", "no"] },
  { cap: "Cross-chain settlement", cells: ["yes", "no", "no", "partial"] },
  { cap: "Sub-second finality", cells: ["yes", "partial", "no", "partial"] },
  { cap: "Temporal settlement", cells: ["yes", "no", "no", "no"] },
  { cap: "Energy-denominated value", cells: ["yes", "no", "no", "no"] },
  { cap: "Offline settlement", cells: ["yes", "no", "no", "no"] },
  { cap: "Non-custodial", cells: ["yes", "no", "no", "no"] },
  { cap: "Post-quantum ready", cells: ["yes", "no", "no", "no"] },
];

function Mark({ v }: { v: Cell }) {
  if (v === "yes")
    return <span className="text-rail-400">✓</span>;
  if (v === "partial")
    return <span className="text-amber-400/80">~</span>;
  return <span className="text-white/20">✕</span>;
}

export function Comparison() {
  return (
    <section id="compare" className="relative section-py border-t border-white/5">
      <div className="container-px mx-auto max-w-5xl">
        <SectionHeading
          align="center"
          eyebrow="Why Loadit"
          title="One rail does what four networks can't."
          description="Every legacy network was built for a single job. Loadit was built for all of them."
        />

        <Reveal>
          <div className="mt-12 overflow-hidden rounded-3xl border border-white/8">
            {/* header */}
            <div className="grid grid-cols-[1.6fr_repeat(4,1fr)] bg-white/[0.02]">
              <div className="p-4 text-sm text-white/40">Capability</div>
              {COLS.map((c) => (
                <div
                  key={c}
                  className={cn(
                    "p-4 text-center text-sm font-semibold",
                    c === "Loadit" ? "bg-rail-500/10 text-rail-400" : "text-white/70"
                  )}
                >
                  {c}
                </div>
              ))}
            </div>
            {/* rows */}
            {ROWS.map((r, i) => (
              <div
                key={r.cap}
                className={cn(
                  "grid grid-cols-[1.6fr_repeat(4,1fr)] border-t border-white/5",
                  i % 2 ? "bg-white/[0.01]" : ""
                )}
              >
                <div className="p-4 text-sm text-white/75">{r.cap}</div>
                {r.cells.map((cell, j) => (
                  <div
                    key={j}
                    className={cn(
                      "grid place-items-center p-4 text-base",
                      j === 0 && "bg-rail-500/[0.06]"
                    )}
                  >
                    <Mark v={cell} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
