"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

type Mode = "voice" | "gesture" | "ar" | "neural";
const MODES: { id: Mode; label: string; verb: string }[] = [
  { id: "voice", label: "Voice", verb: "“Send $250 to Mia”" },
  { id: "gesture", label: "Gesture", verb: "Pinch to confirm" },
  { id: "ar", label: "AR / XR", verb: "Gaze + dwell to pay" },
  { id: "neural", label: "Neural · BCI", verb: "Intent detected" },
];

const hx = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");

export function MultiReality() {
  const [mode, setMode] = useState<Mode>("neural");
  const [phase, setPhase] = useState<"idle" | "signing" | "signed">("idle");
  const [hash, setHash] = useState("");

  const authorize = () => {
    setPhase("signing");
    setTimeout(() => {
      setHash(`0x${hx(4)}…${hx(8)}`);
      setPhase("signed");
    }, 1100);
  };

  const active = MODES.find((m) => m.id === mode)!;

  return (
    <section id="reality" className="relative section-py border-t border-white/5">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="Multi-Reality · BCI · Patent Pending"
          title="Pay with a gesture. Or a thought."
          description="Loadit accepts transaction intent from AR, VR, XR, and brain-computer interfaces — converting voice, gaze, motion, or neural signals into cryptographically signed instructions. (Claims 13, 14, 22)"
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          {/* mode picker */}
          <div className="glass rounded-4xl p-6 sm:p-8">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
              Input modality
            </span>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    setPhase("idle");
                  }}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-all",
                    mode === m.id
                      ? "border-rail-500/40 bg-rail-500/[0.07]"
                      : "border-white/8 bg-white/[0.02] hover:border-white/15"
                  )}
                >
                  <div className="text-sm font-semibold text-white">{m.label}</div>
                  <div className="mt-1 font-mono text-[0.65rem] text-white/45">
                    {m.verb}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={authorize}
              disabled={phase === "signing"}
              className="mt-6 w-full rounded-full bg-rail-500 px-6 py-3 text-sm font-semibold text-void transition-all hover:shadow-glow disabled:opacity-60"
            >
              {phase === "signing" ? "Signing intent…" : "Authorize payment →"}
            </button>
          </div>

          {/* capture stage */}
          <div className="glass relative flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-4xl p-6 sm:p-8">
            <span className="absolute left-5 top-5 font-mono text-[0.58rem] uppercase tracking-widest text-white/35">
              {active.label} capture
            </span>

            <Capture mode={mode} />

            <div className="mt-8 text-center">
              <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
                Detected intent
              </div>
              <div className="mt-1 text-lg font-semibold text-white">
                Pay $250 → Mia · USDC
              </div>
            </div>

            <AnimatePresence>
              {phase === "signed" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 flex items-center gap-2 rounded-full border border-signal/30 bg-signal/10 px-4 py-2 font-mono text-xs text-signal"
                >
                  ✓ cryptographically signed · {hash} · routed by HQ
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function Capture({ mode }: { mode: Mode }) {
  if (mode === "ar") {
    return (
      <div className="relative grid h-28 w-28 place-items-center">
        <motion.div
          className="absolute inset-0 rounded-full border border-cyan/40"
          animate={{ scale: [0.7, 1.1, 0.7], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
        <div className="h-10 w-10 rounded-full border-2 border-rail-400" />
        <span className="absolute h-px w-28 bg-white/15" />
        <span className="absolute h-28 w-px bg-white/15" />
      </div>
    );
  }
  if (mode === "gesture") {
    return (
      <svg viewBox="0 0 160 90" className="h-24 w-44">
        <motion.path
          d="M10 70 C 40 10, 80 80, 120 30 S 150 20, 150 20"
          fill="none"
          stroke="#34D17A"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          r="4"
          fill="#5eead4"
          animate={{
            cx: [10, 80, 150],
            cy: [70, 45, 20],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    );
  }
  // voice + neural → waveform / EEG bars
  const bars = mode === "neural" ? 28 : 22;
  return (
    <div className="flex h-24 items-center gap-1">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full"
          style={{ background: mode === "neural" ? "#22d3ee" : "#34D17A" }}
          animate={{
            height: [
              `${10 + Math.random() * 20}%`,
              `${40 + Math.random() * 60}%`,
              `${10 + Math.random() * 20}%`,
            ],
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.6,
            repeat: Infinity,
            delay: i * 0.04,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
