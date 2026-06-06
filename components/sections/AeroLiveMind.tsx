"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

/* -------------------------------------------------------------------------- */
/*  Networks AERO continuously scores                                          */
/* -------------------------------------------------------------------------- */

const NETS = [
  { k: "Solana", c: "#34d17a", base: 0.0008 },
  { k: "Base", c: "#22d3ee", base: 0.004 },
  { k: "XRPL", c: "#5eead4", base: 0.0003 },
  { k: "Polygon", c: "#4ade80", base: 0.002 },
  { k: "Ethereum", c: "#2dd4bf", base: 1.9 },
  { k: "Lightning", c: "#fbbf24", base: 0.0001 },
] as const;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];

/* -------------------------------------------------------------------------- */
/*  Fee "weather" — live scrolling multi-line chart (canvas)                  */
/* -------------------------------------------------------------------------- */

function FeeWeather() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 1.6);
    const L = 64;
    const tickMs = 850;

    // Random-walk series per network, normalized 0..1 (relative volatility).
    const series = NETS.map(() =>
      Array.from({ length: L }, () => rand(0.35, 0.7))
    );
    let W = 0;
    let H = 0;
    let raf = 0;
    let running = false;
    let visible = true;
    let scrolling = false;
    let scrollTimer = 0;
    let lastTick = performance.now();

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      W = r.width;
      H = r.height;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    const step = () => {
      for (const s of series) {
        s.shift();
        const last = s[s.length - 1];
        let next = last + rand(-0.12, 0.12);
        next = Math.max(0.12, Math.min(0.95, next));
        s.push(next);
      }
    };

    const draw = (now: number) => {
      const prog = Math.min(1, (now - lastTick) / tickMs);
      if (prog >= 1) {
        step();
        lastTick = now;
      }
      ctx.clearRect(0, 0, W, H);

      // grid
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = (H / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      const stepX = W / (L - 2);
      const xOff = -prog * stepX;
      const padY = 10;

      // cheapest network (lowest latest value) gets the spotlight
      let cheapest = 0;
      for (let n = 1; n < NETS.length; n++) {
        if (series[n][L - 1] < series[cheapest][L - 1]) cheapest = n;
      }

      series.forEach((s, n) => {
        const spotlight = n === cheapest;
        ctx.beginPath();
        for (let i = 0; i < L; i++) {
          const x = xOff + i * stepX;
          const y = padY + (1 - s[i]) * (H - padY * 2);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = NETS[n].c;
        ctx.globalAlpha = spotlight ? 1 : 0.4;
        ctx.lineWidth = spotlight ? 2.2 : 1.1;
        ctx.shadowColor = NETS[n].c;
        ctx.shadowBlur = spotlight ? 10 : 0;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // leading dot
        const lx = xOff + (L - 1) * stepX;
        const ly = padY + (1 - s[L - 1]) * (H - padY * 2);
        ctx.beginPath();
        ctx.arc(lx, ly, spotlight ? 3 : 1.6, 0, Math.PI * 2);
        ctx.fillStyle = NETS[n].c;
        ctx.fill();
      });
    };

    const loop = (now: number) => {
      if (!running) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    const shouldRun = () => visible && !document.hidden && !scrolling && !reduce;
    const sync = () => {
      if (shouldRun()) {
        if (!running) {
          running = true;
          lastTick = performance.now();
          raf = requestAnimationFrame(loop);
        }
      } else if (running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    resize();
    if (reduce) draw(performance.now());
    else sync();

    const onResize = () => {
      resize();
      if (reduce) draw(performance.now());
    };
    window.addEventListener("resize", onResize, { passive: true });
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        sync();
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);
    const onVis = () => sync();
    document.addEventListener("visibilitychange", onVis);
    const onScroll = () => {
      scrolling = true;
      sync();
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        scrolling = false;
        sync();
      }, 160);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(scrollTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative h-48 w-full sm:h-56">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Reasoning stream generator                                                 */
/* -------------------------------------------------------------------------- */

type Tag = "SCAN" | "ROUTE" | "RISK" | "QFR" | "TEMPORAL" | "LIQ";
interface Line {
  id: number;
  tag: Tag;
  text: string;
}

const TAG_COLOR: Record<Tag, string> = {
  SCAN: "text-cyan",
  ROUTE: "text-rail-400",
  RISK: "text-amber-400",
  QFR: "text-teal-300",
  LIQ: "text-rail-400",
  TEMPORAL: "text-cyan",
};

function makeLine(id: number): Line {
  const net = pick(NETS).k;
  const net2 = pick(NETS).k;
  const dir = Math.random() > 0.5 ? "↓" : "↑";
  const pct = Math.floor(rand(3, 28));
  const roll = Math.random();
  if (roll < 0.22)
    return { id, tag: "SCAN", text: `Scanning ${14} networks · ${Math.floor(rand(28, 52))} liquidity pools` };
  if (roll < 0.4)
    return { id, tag: "ROUTE", text: `${net} fees ${dir} ${pct}% — re-scoring corridors` };
  if (roll < 0.55)
    return { id, tag: "LIQ", text: `Liquidity depth on ${net} ${dir === "↓" ? "−" : "+"}${pct}% (last 5s)` };
  if (roll < 0.68)
    return { id, tag: "QFR", text: `Quantum pre-check · ${Math.floor(rand(1.2, 9.8) * 10) / 10}M candidate paths evaluated` };
  if (roll < 0.8)
    return { id, tag: "TEMPORAL", text: `Temporal window: cheaper gas on ${net} predicted in ${Math.floor(rand(2, 11))}s` };
  if (roll < 0.9)
    return { id, tag: "RISK", text: `Anomaly scan clear · settlement assurance ${(rand(99.1, 99.9)).toFixed(1)}%` };
  return { id, tag: "ROUTE", text: `Optimal corridor locked · USDC → ${net} (beats ${net2} by ${pct}%)` };
}

/* -------------------------------------------------------------------------- */
/*  Main section                                                               */
/* -------------------------------------------------------------------------- */

export function AeroLiveMind() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15%" });

  const [lines, setLines] = useState<Line[]>([]);
  const [decision, setDecision] = useState({ net: "Solana", conf: 99, window: 6 });
  const [liq, setLiq] = useState(() => NETS.map(() => rand(0.4, 0.95)));
  const [paths, setPaths] = useState(48213904);
  const [value, setValue] = useState(2841960);
  const idRef = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);

  // Seed initial log.
  useEffect(() => {
    setLines(Array.from({ length: 7 }, () => makeLine(idRef.current++)));
  }, []);

  // Streaming reasoning + telemetry (only while in view).
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setLines((prev) => [...prev.slice(-22), makeLine(idRef.current++)]);
      setLiq(NETS.map(() => rand(0.4, 0.97)));
      setDecision({
        net: pick(NETS).k,
        conf: Math.floor(rand(96, 99)),
        window: Math.floor(rand(3, 12)),
      });
      setPaths((p) => p + Math.floor(rand(180000, 920000)));
      setValue((v) => v + Math.floor(rand(1200, 9800)));
    }, 1300);
    return () => clearInterval(id);
  }, [inView]);

  // Auto-scroll the log.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <section id="live-mind" className="relative bg-black section-py" ref={ref}>
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="AERO · Live Mind"
          title="Watch the engine think."
          description="AERO never sleeps. It continuously scores every network, predicts where the cheapest corridor opens next, and reroutes value in real time — this is the rail reasoning, live."
        />

        {/* Decision banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-col items-center justify-between gap-4 rounded-3xl border border-rail-500/25 bg-rail-500/[0.05] p-5 sm:flex-row sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rail-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rail-400" />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-rail-400">
              AERO Active
            </span>
          </div>
          <p className="text-center font-mono text-sm text-white/80 sm:text-base">
            Routing via <span className="text-rail-400">{decision.net}</span> ·{" "}
            <span className="text-white">{decision.conf}%</span> confidence ·
            next optimal window in{" "}
            <span className="text-cyan">{decision.window}s</span>
          </p>
        </motion.div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          {/* Fee weather + liquidity */}
          <div className="glass rounded-4xl p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <FieldLabel>Fee Weather · live</FieldLabel>
              <span className="font-mono text-[0.6rem] uppercase tracking-widest text-white/35">
                cheapest = brightest
              </span>
            </div>
            <div className="mt-3">
              <FeeWeather />
            </div>
            {/* legend */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {NETS.map((n) => (
                <span key={n.k} className="flex items-center gap-1.5 text-[0.7rem] text-white/55">
                  <span className="h-2 w-2 rounded-full" style={{ background: n.c }} />
                  {n.k}
                </span>
              ))}
            </div>

            {/* liquidity heat */}
            <div className="mt-6">
              <FieldLabel>Liquidity Depth</FieldLabel>
              <div className="mt-3 space-y-2.5">
                {NETS.map((n, i) => (
                  <div key={n.k} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 font-mono text-[0.7rem] text-white/55">
                      {n.k}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: n.c }}
                        animate={{ width: `${Math.round(liq[i] * 100)}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reasoning stream */}
          <div className="glass relative flex flex-col rounded-4xl p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <FieldLabel>Reasoning Stream</FieldLabel>
              <span className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-rail-400">
                <span className="h-1 w-1 rounded-full bg-rail-400 animate-pulse-rail" />
                thinking
              </span>
            </div>
            <div
              ref={logRef}
              className="mask-fade-b mt-4 h-72 space-y-2 overflow-hidden font-mono text-[0.78rem] leading-relaxed lg:h-[26rem]"
            >
              {lines.map((l) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2"
                >
                  <span className={`shrink-0 ${TAG_COLOR[l.tag]}`}>
                    [{l.tag}]
                  </span>
                  <span className="text-white/70">{l.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Telemetry counters */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Telemetry label="Paths / sec" value={Math.floor(paths % 1000000).toLocaleString()} accent />
          <Telemetry label="Networks live" value="14" />
          <Telemetry label="Value routed today" value={`$${value.toLocaleString()}`} accent />
          <Telemetry label="Median latency" value="38ms" />
        </div>
      </div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
      {children}
    </span>
  );
}

function Telemetry({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="glass rounded-3xl p-5">
      <FieldLabel>{label}</FieldLabel>
      <div
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          accent ? "text-rail-gradient" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
