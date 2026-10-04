"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "../_lib/useReducedMotion";
import { buildRoute, PAY_WITH, RECEIVE, STATUS_HELP, type ValueForm } from "../_lib/world";
import { Section, Kicker, Display, Lede, StatusBadge, StatusLegend, Cta } from "./Bits";

/**
 * ROUTES — "One transaction. Many possible routes." Seven showcase routes
 * cycle on their own until the visitor touches a selector; then it's theirs.
 * Every built route carries its honest status and a route card with the
 * details (ROUTE ID · SOURCE · DESTINATION · NETWORKS · SETTLEMENT · STATUS).
 */
const SHOWCASE: [string, string][] = [
  ["bank", "usdc"],
  ["cash", "usdc"],
  ["usdc", "merchant"],
  ["btc", "bank"],
  ["bank", "btc"],
  ["sol", "usdc"],
  ["eth", "merchant"],
];

const find = (list: ValueForm[], id: string) => list.find((v) => v.id === id) ?? list[0];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.15em] transition-colors ${
        active ? "border-white bg-white text-void" : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export function RouteBuilder() {
  const reduce = usePrefersReducedMotion();
  const [from, setFrom] = useState<ValueForm>(find(PAY_WITH, "bank"));
  const [to, setTo] = useState<ValueForm>(find(RECEIVE, "usdc"));
  const [touched, setTouched] = useState(false);
  const route = useMemo(() => buildRoute(from, to), [from, to]);

  // Auto-cycle the showcase until the visitor takes over.
  useEffect(() => {
    if (touched || reduce) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % SHOWCASE.length;
      setFrom(find(PAY_WITH, SHOWCASE[i][0]));
      setTo(find(RECEIVE, SHOWCASE[i][1]));
    }, 3600);
    return () => clearInterval(id);
  }, [touched, reduce]);

  const pick = (setter: (v: ValueForm) => void) => (v: ValueForm) => {
    setTouched(true);
    setter(v);
  };

  const color = route.status === "live" ? "#34D17A" : route.status === "building" ? "#FBBF24" : "#5EEAD4";

  return (
    <Section id="network">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Kicker>Routes</Kicker>
          <Display>
            One transaction.
            <br />
            Many possible routes.
          </Display>
          <Lede>Pick what you pay with and what the other side should receive. Watch the path Loadit would take between them — and exactly how real that path is today.</Lede>
        </div>
        <StatusLegend className="mb-2 max-w-md" />
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* selectors */}
        <div className="rounded-3xl border border-white/10 bg-[#070A12]/85 p-6 shadow-glass sm:p-8">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">Build your route</p>
          <fieldset className="mt-6">
            <legend className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-white">Pay with</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {PAY_WITH.map((v) => (
                <Chip key={v.id} active={from.id === v.id} onClick={() => pick(setFrom)(v)}>{v.short}</Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-8">
            <legend className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-white">Receive</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {RECEIVE.map((v) => (
                <Chip key={v.id} active={to.id === v.id} onClick={() => pick(setTo)(v)}>{v.short}</Chip>
              ))}
            </div>
          </fieldset>
          {!touched && !reduce && (
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Cycling through example routes · tap to take over</p>
          )}
        </div>

        {/* the path */}
        <div className="rounded-3xl border border-white/10 bg-[#04060B] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/50">Route</span>
            <StatusBadge status={route.status} />
          </div>

          <AnimatePresence mode="wait">
            <motion.ol
              key={route.id}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -10, transition: { duration: 0.12 } }}
              transition={{ duration: 0.3 }}
              className="mt-8 grid gap-0"
              aria-label="Route legs"
            >
              {route.legs.map((leg, i) => {
                const last = i === route.legs.length - 1;
                const core = /loadit/i.test(leg);
                return (
                  <li key={`${leg}-${i}`} className="grid grid-cols-[28px_1fr] gap-x-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full border ${core ? "border-rail-400 bg-rail-400/15 shadow-glow" : "border-white/25 bg-[#070A12]"}`}
                        style={core ? undefined : last ? { borderColor: color } : undefined}
                      >
                        <span className={`h-2 w-2 rounded-full ${core ? "bg-rail-400" : "bg-white/70"}`} style={last && !core ? { background: color } : undefined} />
                      </span>
                      {!last && (
                        <span className="relative my-1 h-10 w-px overflow-hidden bg-white/12">
                          {!reduce && (
                            <motion.span
                              className="absolute left-0 top-0 h-3 w-px"
                              style={{ background: color }}
                              animate={{ y: [0, 40] }}
                              transition={{ duration: 1.1, repeat: Infinity, ease: "linear", delay: i * 0.25 }}
                            />
                          )}
                        </span>
                      )}
                    </div>
                    <div className="pb-2">
                      <div className={`text-base font-semibold ${core ? "text-rail-400" : "text-white"}`}>{leg}</div>
                      {i === 0 && <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Source</div>}
                      {core && <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Intent → plan → route</div>}
                      {last && <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Destination</div>}
                    </div>
                  </li>
                );
              })}
            </motion.ol>
          </AnimatePresence>

          {/* route card — the detail a hover would reveal, kept visible so it's accessible */}
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/8 pt-5 text-sm sm:grid-cols-3">
            {[
              ["Route ID", route.id],
              ["Source", from.label],
              ["Destination", to.label],
              ["Networks", route.networks],
              ["Settlement", route.settlement],
              ["Status", `${route.status.toUpperCase()} · ${STATUS_HELP[route.status]}`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</dt>
                <dd className="mt-0.5 text-white/80">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs leading-relaxed text-white/45">{route.note}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {route.status === "live" ? (
              <Cta href="https://loadit.net/install" variant="secondary" className="px-4 py-2 text-xs">Do this on Loadit.net →</Cta>
            ) : (
              <Cta href="https://loaditglobal.com/developers/sandbox" variant="secondary" className="px-4 py-2 text-xs">Watch the real engine route →</Cta>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
