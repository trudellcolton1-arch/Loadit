"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How would $500 route from Lagos to a London bank?",
  "Can I pay with a gesture or neural (BCI) signal?",
  "What happens when a rail fails or the network goes offline?",
  "Explain energy-denominated settlement.",
];

export function AskAero() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "I'm AERO — Loadit's routing brain. Ask how value moves: fees, corridors, offline payments, energy settlement, or how a specific transfer would route.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

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
    <section id="ask" className="relative section-py">
      <div className="container-px mx-auto max-w-3xl">
        <SectionHeading
          align="center"
          eyebrow="Ask AERO"
          title="Talk to the rail."
          description="A live concierge powered by AERO. Ask anything about moving money — it'll explain, and route."
        />

        <div className="glass mt-12 flex h-[30rem] flex-col rounded-4xl p-4 sm:p-6">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-rail-500/15 text-white"
                      : "border border-white/8 bg-white/[0.03] text-white/80"
                  )}
                >
                  {m.role === "assistant" && (
                    <span className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-rail-400">
                      AERO
                    </span>
                  )}
                  {m.content}
                </motion.div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
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

          {messages.length <= 1 && (
            <div className="mb-3 mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-left text-xs text-white/60 transition-colors hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="mt-3 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AERO anything about moving money…"
              className="flex-1 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-rail-400/50"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-rail-500 px-5 py-3 text-sm font-semibold text-void transition-all hover:shadow-glow disabled:opacity-60"
            >
              Ask →
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
