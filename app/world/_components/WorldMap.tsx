"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { usePrefersReducedMotion } from "../_lib/useReducedMotion";
import { CORRIDORS, NODES, type Status } from "../_lib/world";
import { Kicker, Display, Lede, StatusLegend, StatusBadge } from "./Bits";

/**
 * THE WORLD MAP — financial nodes projected onto a dotted world, corridors
 * drawn as arcs with value travelling along them. The deeper the visitor
 * scrolls, the more corridors light up: the network becomes interconnected
 * in front of them.
 */
const W = 860, H = 430;
const project = (lat: number, lon: number) => ({ x: ((lon + 180) / 360) * W, y: ((90 - lat) / 180) * H });
const byId = Object.fromEntries(NODES.map((n) => [n.id, { ...n, ...project(n.lat, n.lon) }]));
const STATUS_COLOR: Record<Status, string> = { live: "#34D17A", building: "#FBBF24", vision: "#5EEAD4" };

function arc(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const lift = Math.min(90, len * 0.25);
  const cx = mx - (dy / len) * lift * (dx >= 0 ? 1 : -1), cy = my - Math.abs(dx / len) * lift;
  return `M${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

export function WorldMap() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 40%"] });
  const lit = useTransform(scrollYProgress, [0, 1], [1, CORRIDORS.length]);

  return (
    <section ref={ref} className="relative scroll-mt-24 py-28 sm:py-40" aria-labelledby="map-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Kicker>The world map</Kicker>
        <Display>Value doesn&apos;t care about borders.</Display>
        <Lede>
          The internet made information global. Financial infrastructure is still fragmented by institutions, networks, assets, and geography. Loadit&apos;s long-term vision is interoperable value movement across those boundaries.
        </Lede>

        <div className="mt-12 rounded-3xl border border-white/10 bg-[#070A12]/85 p-3 shadow-glass sm:p-6">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="World map with corridors of value between cities, more of them lighting up as you scroll">
            <defs>
              <pattern id="wm-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.9" fill="rgba(255,255,255,0.10)" />
              </pattern>
              <radialGradient id="wm-fade" cx="50%" cy="50%" r="65%">
                <stop offset="60%" stopColor="#fff" stopOpacity="1" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
              <mask id="wm-mask"><rect width={W} height={H} fill="url(#wm-fade)" /></mask>
            </defs>
            <rect width={W} height={H} fill="url(#wm-dots)" mask="url(#wm-mask)" />

            {CORRIDORS.map((c, i) => {
              const a = byId[c.from], b = byId[c.to];
              const d = arc(a, b);
              const color = STATUS_COLOR[c.status];
              return <Corridor key={c.id} d={d} color={color} index={i} lit={lit} reduce={reduce} />;
            })}

            {NODES.map((n) => {
              const p = byId[n.id];
              return (
                <g key={n.id}>
                  <circle cx={p.x} cy={p.y} r="3" fill="#fff" />
                  <circle cx={p.x} cy={p.y} r="7" fill="none" stroke="rgba(255,255,255,0.3)" />
                  <text x={p.x + 10} y={p.y + 4} fill="rgba(255,255,255,0.7)" fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="1.5">{n.label.toUpperCase()}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <ol className="grid gap-2 sm:grid-cols-2" aria-label="Illustrative corridors">
            {CORRIDORS.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <span className="font-mono text-[11px] tracking-[0.08em] text-white/80">{c.steps.join("  →  ")}</span>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ol>
          <StatusLegend className="lg:max-w-xs lg:flex-col lg:items-start" />
        </div>
        <p className="mt-4 text-xs text-white/40">Illustrative corridors. Each real corridor opens with a licensed partner and carries its own status.</p>
      </div>
    </section>
  );
}

function Corridor({ d, color, index, lit, reduce }: { d: string; color: string; index: number; lit: MotionValue<number>; reduce: boolean }) {
  const opacity = useTransform(lit, (v) => (reduce ? 1 : Math.max(0, Math.min(1, v - index))));
  return (
    <motion.g style={{ opacity }}>
      <path d={d} fill="none" stroke={color} strokeOpacity="0.55" strokeWidth="1.3" />
      {!reduce && (
        <circle r="2.6" fill="#fff">
          <animateMotion dur={`${3.2 + (index % 3) * 0.8}s`} repeatCount="indefinite" path={d} begin={`${index * 0.5}s`} />
        </circle>
      )}
    </motion.g>
  );
}
