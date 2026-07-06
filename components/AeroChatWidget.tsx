"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const GREETING: Msg = {
  role: "assistant",
  content:
    "I'm HQ — the intelligence layer of the Loadit rail. Ask me how value moves: fees, corridors, offline payments, energy settlement, or how a specific transfer would route.",
};

const SUGGESTIONS = [
  "How does Loadit work?",
  "Settle part of a payment in energy?",
  "What if a rail fails?",
  "Pay with a thought (BCI)?",
];

export function AeroChatWidget() {
  const [open, setOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // Whether the last reply came from the live model vs the offline fallback.
  const [mode, setMode] = useState<"unknown" | "live" | "offline">("unknown");
  const scrollRef = useRef<HTMLDivElement>(null);

  // One-time "Ask me anything" peek on first visit.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem("aero_peek_seen")) return;
    } catch {
      /* ignore */
    }
    const t1 = window.setTimeout(() => setPeek(true), 2600);
    const t2 = window.setTimeout(() => dismissPeek(), 10000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissPeek = () => {
    setPeek(false);
    try {
      localStorage.setItem("aero_peek_seen", "1");
    } catch {
      /* ignore */
    }
  };

  const toggle = () => {
    dismissPeek();
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (open)
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMode(data?.fallback ? "offline" : "live");
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data?.reply ?? "Something went wrong — try again." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I couldn't reach the engine. Try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "bottom right" }}
            className="glass glass-blur fixed bottom-24 right-4 z-[70] flex h-[min(72vh,560px)] w-[min(92vw,384px)] flex-col overflow-hidden rounded-4xl sm:right-6"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rail-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rail-400" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-white">Ask HQ</div>
                  {mode === "unknown" ? (
                    <div className="font-mono text-[0.55rem] uppercase tracking-widest text-white/40">
                      Loadit intelligence layer
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "flex items-center gap-1 font-mono text-[0.55rem] uppercase tracking-widest",
                        mode === "live" ? "text-rail-400" : "text-amber"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          mode === "live" ? "bg-rail-400" : "bg-amber"
                        )}
                      />
                      {mode === "live" ? "Live AI" : "Offline mode"}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="grid h-8 w-8 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[0.82rem] leading-relaxed",
                      m.role === "user"
                        ? "bg-rail-500/15 text-white"
                        : "border border-white/8 bg-white/[0.03] text-white/80"
                    )}
                  >
                    {m.role === "assistant" && (
                      <span className="mb-1 block font-mono text-[0.5rem] uppercase tracking-widest text-rail-400">
                        HQ
                      </span>
                    )}
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-rail-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* suggestions */}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-1.5 px-4 pb-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-[0.7rem] text-white/60 transition-colors hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2 border-t border-white/8 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask HQ anything…"
                className="flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-rail-400/50"
              />
              <button
                type="submit"
                disabled={loading}
                aria-label="Send"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rail-500 text-void transition-all hover:shadow-glow disabled:opacity-60"
              >
                →
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* One-time peek bubble */}
      <AnimatePresence>
        {peek && !open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "bottom right" }}
            className="glass glass-blur fixed bottom-[5.25rem] right-4 z-[70] flex items-center gap-2 rounded-2xl py-2.5 pl-4 pr-2.5 shadow-glass sm:right-6"
          >
            <button onClick={toggle} className="flex items-center gap-3 text-left">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-rail-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rail-400" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">
                  Ask me anything
                </span>
                <span className="block font-mono text-[0.58rem] uppercase tracking-widest text-white/45">
                  HQ · live intelligence
                </span>
              </span>
            </button>
            <button
              onClick={dismissPeek}
              aria-label="Dismiss"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white/40 transition-colors hover:text-white"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        onClick={toggle}
        aria-label={open ? "Close HQ chat" : "Open HQ chat"}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-4 z-[70] flex items-center gap-2 rounded-full bg-rail-500 px-4 py-3.5 text-sm font-semibold text-void shadow-[0_8px_30px_-6px_rgba(34,169,92,0.6)] sm:right-6"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              ✕
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path
                  d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.8-5.4A8.5 8.5 0 1 1 21 11.5Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <circle cx="8.5" cy="11.5" r="1" fill="currentColor" />
                <circle cx="12" cy="11.5" r="1" fill="currentColor" />
                <circle cx="15.5" cy="11.5" r="1" fill="currentColor" />
              </svg>
              <span className="hidden sm:inline">Ask HQ</span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
