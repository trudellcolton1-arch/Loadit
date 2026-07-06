"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

interface Agent {
  name: string;
  job: string;
  actions: string[];
}

const AGENTS: Agent[] = [
  {
    name: "Treasury Optimizer",
    job: "Keeps your balance in the cheapest, deepest stablecoin.",
    actions: [
      "Rebalanced $48,200 → USDC on Solana",
      "Detected depeg risk · rotated to USDC",
      "Yield delta +0.6% · shifted to Base",
    ],
  },
  {
    name: "Auto-Remit",
    job: "Sends a fixed amount home on the lowest-fee rail, on schedule.",
    actions: [
      "Sent $200 → Manila via Lightning",
      "Fee window optimal · saved 94%",
      "Next remit scheduled · Fri 06:00",
    ],
  },
  {
    name: "Gas Sniper",
    job: "Waits for the cheapest gas window, then settles.",
    actions: [
      "Gas dropped 71% · released batch",
      "Predicted window in 4s · holding",
      "Settled 320 tx in one window",
    ],
  },
  {
    name: "FX Guard",
    job: "Locks favorable rates and protects against drift.",
    actions: [
      "Locked USD/MXN at 17.04",
      "Market drifted −0.8% · protected",
      "Released on target · +$1,240",
    ],
  },
];

export function Agents() {
  return (
    <section id="agents" className="relative section-py border-t border-white/5">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="Loadit Agents"
          title="Money that moves itself."
          description="Autonomous agents run on the rail — routing, remitting, and rebalancing value on your behalf, 24/7. Set the goal; HQ does the rest."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {AGENTS.map((a, i) => (
            <AgentCard key={a.name} agent={a} startActive={i < 2} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AgentCard({ agent, startActive }: { agent: Agent; startActive: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10%" });
  const [active, setActive] = useState(startActive);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!active || !inView) return;
    const id = setInterval(
      () => setIdx((x) => (x + 1) % agent.actions.length),
      2600
    );
    return () => clearInterval(id);
  }, [active, inView, agent.actions.length]);

  return (
    <div
      ref={ref}
      className={cn(
        "glass rounded-4xl p-6 transition-colors sm:p-7",
        active && "border-rail-500/25"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-white">
            {agent.name}
          </h3>
          <p className="mt-1.5 text-sm text-white/45">{agent.job}</p>
        </div>
        <button
          onClick={() => setActive((v) => !v)}
          role="switch"
          aria-checked={active}
          className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
          style={{ background: active ? "rgba(34,169,92,0.6)" : "rgba(255,255,255,0.12)" }}
        >
          <motion.span
            className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
            animate={{ left: active ? 22 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
          />
        </button>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            active ? "bg-rail-400 animate-pulse-rail" : "bg-white/25"
          )}
        />
        {active ? (
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-xs text-white/70"
          >
            {agent.actions[idx]}
          </motion.span>
        ) : (
          <span className="font-mono text-xs text-white/35">Paused</span>
        )}
      </div>
    </div>
  );
}
