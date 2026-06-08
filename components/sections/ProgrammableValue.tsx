"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

interface Block {
  id: string;
  label: string;
  kind: "in" | "op" | "out";
}

const PALETTE: Block[] = [
  { id: "cash", label: "Cash In", kind: "in" },
  { id: "card", label: "Card In", kind: "in" },
  { id: "split", label: "Split 70 / 30", kind: "op" },
  { id: "usdc", label: "Convert → USDC", kind: "op" },
  { id: "energy", label: "Energy Slice", kind: "op" },
  { id: "fxlock", label: "Lock FX Rate", kind: "op" },
  { id: "cond", label: "Release on Condition", kind: "op" },
  { id: "settle", label: "Settle to Wallet", kind: "out" },
];

const KIND_STYLE: Record<Block["kind"], string> = {
  in: "border-cyan/40 text-cyan",
  op: "border-rail-500/40 text-rail-400",
  out: "border-signal/40 text-signal",
};

const DEFAULT: Block[] = [
  PALETTE[0],
  PALETTE[3],
  PALETTE[4],
  PALETTE[7],
];

export function ProgrammableValue() {
  const [flow, setFlow] = useState<Block[]>(DEFAULT);
  const add = (b: Block) =>
    setFlow((f) => [...f, { ...b, id: `${b.id}-${Date.now()}` }]);
  const removeAt = (i: number) => setFlow((f) => f.filter((_, x) => x !== i));

  return (
    <section id="compose" className="relative section-py">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="Programmable Value"
          title="Money you can compose."
          description="Snap together value primitives like building blocks. AERO compiles them into a single, atomic settlement object."
        />

        {/* palette */}
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
          {PALETTE.map((b) => (
            <button
              key={b.id}
              onClick={() => add(b)}
              className={cn(
                "rounded-full border bg-white/[0.02] px-3.5 py-1.5 text-xs transition-all hover:bg-white/[0.06]",
                KIND_STYLE[b.kind]
              )}
            >
              + {b.label}
            </button>
          ))}
        </div>

        {/* flow */}
        <div className="glass mt-8 rounded-4xl p-6 sm:p-10">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
              Settlement program
            </span>
            <button
              onClick={() => setFlow([])}
              className="font-mono text-[0.6rem] uppercase tracking-widest text-white/40 hover:text-white"
            >
              clear
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <AnimatePresence mode="popLayout">
              {flow.map((b, i) => (
                <motion.div
                  key={b.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2"
                >
                  <button
                    onClick={() => removeAt(i)}
                    title="Remove"
                    className={cn(
                      "rounded-xl border bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/[0.06]",
                      KIND_STYLE[b.kind]
                    )}
                  >
                    {b.label}
                  </button>
                  {i < flow.length - 1 && (
                    <span className="text-rail-400/50">→</span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {flow.length === 0 && (
              <p className="text-sm text-white/40">
                Add blocks above to compose a settlement program.
              </p>
            )}
          </div>

          {flow.length > 0 && (
            <div className="mt-8 rounded-2xl border border-rail-500/20 bg-rail-500/[0.04] p-4">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-rail-gradient">
                Compiles to
              </span>
              <p className="mt-2 font-mono text-xs leading-relaxed text-white/65">
                {`{ tx: "loadit", steps: [${flow
                  .map((b) => `"${b.label.replace(/\s+/g, "_").toLowerCase()}"`)
                  .join(", ")}], atomic: true, audited: true }`}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
