"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatUSD } from "@/lib/aero";
import { matchProviders, type ProviderMatch } from "@/lib/providers";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";

// Minimal Web Speech API shape (not in the default DOM lib types).
interface SpeechRec {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
}
type SpeechRecCtor = new () => SpeechRec;

interface IntentData {
  payment_method: string;
  asset: string;
  amount_usd: number;
  destination?: string;
}
interface RouteData {
  network_name: string;
  loadit_fee_usd: number;
  legacy_fee_usd: number;
  savings_usd: number;
  savings_pct: number;
  eta: string;
}
interface Result {
  ai: boolean;
  fees_live: boolean;
  intent: IntentData;
  route: RouteData;
  explanation: string;
  providers: ProviderMatch[];
}

const EXAMPLES = [
  "Send my mom $200 in Manila the cheapest way",
  "Turn $500 cash into Bitcoin",
  "Move $1,000 from my bank into USDC",
  "Buy $250 of Solana with my debit card",
];

export function IntentRouter() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);

  const run = async (message: string) => {
    const q = message.trim();
    if (!q || loading) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError("I couldn't parse that. Try naming an amount and an asset.");
      } else {
        setResult({ ...data, providers: matchProviders(data.intent.payment_method, data.intent.asset) });
        track("route_computed", {
          method: data.intent.payment_method,
          asset: data.intent.asset,
          amount: data.intent.amount_usd,
          savings: data.route.savings_usd,
          via: "intent",
        });
      }
    } catch {
      setError("Couldn't reach the engine. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  // Optional voice input — the "speak your intent" wow, via Web Speech API.
  const toggleMic = () => {
    if (typeof window === "undefined") return;
    const w = window as unknown as { SpeechRecognition?: SpeechRecCtor; webkitSpeechRecognition?: SpeechRecCtor };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setError("Voice input isn't supported in this browser — type your request instead.");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    recRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join("");
      setText(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  };

  return (
    <section id="intent" className="relative bg-black section-py">
      <div className="container-px mx-auto max-w-5xl">
        <SectionHeading
          align="center"
          eyebrow="AI Intent Router · World First"
          title="Just say it. The rail does the rest."
          description="No forms. Tell AERO what you want to do with your money in plain language — it understands, finds the cheapest real route, and explains it. The first payment rail you can talk to."
        />

        {/* input */}
        <div className="mx-auto mt-10 max-w-3xl">
          <div className="glass flex items-center gap-2 rounded-full p-2 pl-5">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run(text)}
              placeholder="e.g. Send $300 to Lagos the cheapest way…"
              className="flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/30 sm:text-base"
            />
            <button
              onClick={toggleMic}
              aria-label="Speak your request"
              className={cn(
                "grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-all",
                listening
                  ? "border-rail-400 bg-rail-500/20 text-rail-300"
                  : "border-white/12 text-white/55 hover:text-white"
              )}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={() => run(text)}
              disabled={loading}
              className="h-11 shrink-0 rounded-full bg-rail-500 px-6 text-sm font-semibold text-void transition-all hover:shadow-glow disabled:opacity-60"
            >
              {loading ? "Routing…" : "Route →"}
            </button>
          </div>

          {/* examples */}
          {!result && !loading && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => { setText(ex); run(ex); }}
                  className="rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-xs text-white/55 transition-colors hover:text-white"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
          {error && <p className="mt-4 text-center text-sm text-amber">{error}</p>}
        </div>

        {/* result */}
        <AnimatePresence mode="wait">
          {result && !loading && (
            <motion.div
              key="res"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto mt-8 max-w-3xl space-y-4"
            >
              {/* parsed intent chips */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Tag>{formatUSD(result.intent.amount_usd)}</Tag>
                <Arrow />
                <Tag>{result.intent.payment_method}</Tag>
                <Arrow />
                <Tag highlight>{result.intent.asset}</Tag>
                {result.intent.destination && (<><Arrow /><Tag>{result.intent.destination}</Tag></>)}
                <span
                  className={cn(
                    "ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[0.55rem] uppercase tracking-wider",
                    result.ai ? "bg-rail-500/15 text-rail-400" : "bg-white/8 text-white/45"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", result.ai ? "bg-rail-400" : "bg-white/40")} />
                  {result.ai ? "AI parsed" : "parsed"}
                </span>
              </div>

              {/* explanation */}
              <div className="glass rounded-3xl p-6">
                <span className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-rail-400">AERO</span>
                <p className="text-sm leading-relaxed text-white/85 sm:text-base">{result.explanation}</p>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Route" value={result.route.network_name} />
                  <Stat label="Settles in" value={result.route.eta} />
                  <Stat label="Loadit cost" value={formatUSD(result.route.loadit_fee_usd)} />
                  <Stat
                    label="You save"
                    value={`${formatUSD(result.route.savings_usd)}`}
                    sub={`${result.route.savings_pct}% cheaper`}
                    accent
                    live={result.fees_live}
                  />
                </div>
              </div>

              {/* provider handoff */}
              {result.providers.length > 0 && (
                <div className="glass rounded-3xl p-5">
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/40">Complete it with</span>
                  <div className="mt-3 space-y-2">
                    {result.providers.slice(0, 3).map((p, i) => (
                      <a
                        key={p.id}
                        href={p.needsSetup ? undefined : p.href}
                        target="_blank"
                        rel="sponsored nofollow noopener noreferrer"
                        onClick={(e) => {
                          if (p.needsSetup) { e.preventDefault(); return; }
                          track("provider_click", { provider: p.id, asset: result.intent.asset, via: "intent" });
                        }}
                        className={cn(
                          "flex items-center justify-between gap-4 rounded-2xl border p-3.5 transition-all",
                          i === 0 ? "border-rail-500/35 bg-rail-500/[0.05] hover:bg-rail-500/[0.09]" : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]",
                          p.needsSetup && "cursor-not-allowed opacity-70"
                        )}
                      >
                        <span className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-white">{p.name}</span>
                          {i === 0 && <span className="rounded-full bg-rail-500/15 px-2 py-0.5 font-mono text-[0.5rem] uppercase tracking-wider text-rail-400">Best</span>}
                          <span className="text-white/45">{p.blurb}</span>
                        </span>
                        <span className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white">
                          {p.needsSetup ? "Set ref" : "Continue →"}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-center text-[0.7rem] text-white/30">
                Loadit may earn a commission from these links, at no cost to you. Figures are live estimates dependent on network &amp; market conditions.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Tag({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span className={cn("rounded-full border px-3 py-1.5 text-xs font-medium sm:text-sm", highlight ? "border-rail-500/40 bg-rail-500/10 text-white" : "border-white/12 bg-white/[0.03] text-white/75")}>
      {children}
    </span>
  );
}
function Arrow() {
  return <span className="text-white/25">→</span>;
}
function Stat({ label, value, sub, accent, live }: { label: string; value: string; sub?: string; accent?: boolean; live?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1 font-mono text-[0.55rem] uppercase tracking-widest text-white/40">
        {label}
        {live && <span className="h-1 w-1 animate-pulse rounded-full bg-signal" />}
      </div>
      <div className={cn("mt-1 font-mono text-sm font-semibold", accent ? "text-rail-gradient" : "text-white")}>{value}</div>
      {sub && <div className="font-mono text-[0.6rem] text-white/40">{sub}</div>}
    </div>
  );
}
