"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

type Phase = "online" | "offline" | "queued" | "synced";

const hx = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");

export function OfflineMode() {
  const [phase, setPhase] = useState<Phase>("online");
  const [hash] = useState(() => `0x${hx(4)}…${hx(6)}`);

  const online = phase === "online" || phase === "synced";

  return (
    <section id="offline" className="relative section-py">
      <div className="container-px mx-auto max-w-5xl">
        <SectionHeading
          align="center"
          eyebrow="Offline Settlement · Patent Pending"
          title="Payments that survive the blackout."
          description="When the network goes dark, value still moves — bound to a verified identity, held in cryptographic escrow, and reconciled the instant connectivity returns."
        />

        <div className="glass mt-12 rounded-4xl p-6 sm:p-10">
          {/* network bar */}
          <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  online ? "bg-rail-400" : "bg-amber-400 animate-pulse"
                )}
              />
              <span className="text-sm font-medium text-white">
                Network · {online ? "Online" : "Offline"}
              </span>
            </div>
            <button
              onClick={() =>
                setPhase((p) => (p === "online" || p === "synced" ? "offline" : "online"))
              }
              className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/5"
            >
              {online ? "Cut connection" : "Restore"}
            </button>
          </div>

          {/* state */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Step active label="Identity verified" desc="Bound at capture" done />
            <Step
              active={phase !== "online"}
              label="Escrow held"
              desc="Cryptographic lock"
              done={phase !== "online"}
            />
            <Step
              active={phase === "synced"}
              label="Settled on sync"
              desc="Reconciled + audited"
              done={phase === "synced"}
            />
          </div>

          {/* action */}
          <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {phase === "offline" && (
              <button
                onClick={() => setPhase("queued")}
                className="rounded-full bg-rail-500 px-6 py-3 text-sm font-semibold text-void transition-all hover:shadow-glow"
              >
                Pay $250 offline →
              </button>
            )}
            {phase === "queued" && (
              <button
                onClick={() => setPhase("synced")}
                className="rounded-full bg-rail-500 px-6 py-3 text-sm font-semibold text-void transition-all hover:shadow-glow"
              >
                Restore connection & settle →
              </button>
            )}
            {(phase === "online" || phase === "synced") && (
              <p className="text-sm text-white/45">
                {phase === "synced"
                  ? "Settlement reconciled with a full cryptographic audit trail."
                  : "Cut the connection to move value with no network."}
              </p>
            )}

            <AnimatePresence>
              {(phase === "queued" || phase === "synced") && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "rounded-full border px-3 py-1 font-mono text-xs",
                    phase === "synced"
                      ? "border-signal/30 bg-signal/10 text-signal"
                      : "border-amber-400/30 bg-amber-400/10 text-amber-400"
                  )}
                >
                  {phase === "synced" ? "✓ settled" : "queued"} · {hash}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({
  active,
  done,
  label,
  desc,
}: {
  active: boolean;
  done?: boolean;
  label: string;
  desc: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        active ? "border-rail-500/30 bg-rail-500/[0.05]" : "border-white/8 bg-white/[0.02]"
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid h-5 w-5 place-items-center rounded-full text-[0.65rem]",
            done ? "bg-rail-500/20 text-rail-400" : "bg-white/5 text-white/40"
          )}
        >
          {done ? "✓" : "•"}
        </span>
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
      <p className="mt-1.5 pl-7 text-xs text-white/45">{desc}</p>
    </div>
  );
}
