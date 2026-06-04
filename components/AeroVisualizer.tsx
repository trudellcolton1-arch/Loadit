"use client";

import { useEffect, useRef } from "react";
import type { RouteResult } from "@/lib/aero";

/**
 * LOADIT AERO™ holographic settlement reactor — "year 3000" routing viz.
 * Canvas 2D (no three.js): starfield + perspective grid, a radar-pulsing AI
 * reactor core, hex-framed orbital nodes, volumetric energy conduits with
 * streaming value-packets, depth parallax, and a HUD overlay.
 * Pauses off-screen / during scroll / when hidden; static frame for
 * reduced-motion. GPU-light and iOS-safe.
 */

type Node = RouteResult["path"][number];

const KIND_COLOR: Record<Node["kind"], [number, number, number]> = {
  origin: [220, 235, 255],
  engine: [34, 211, 238], // cyan
  asset: [94, 234, 212], // teal
  network: [52, 211, 153], // green
  wallet: [34, 197, 94], // bright green
};

const rgba = (c: [number, number, number], a: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export function AeroVisualizer({ path, live }: { path: Node[]; live: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ path, live });
  stateRef.current = { path, live };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 1.6);

    let W = 0;
    let H = 0;
    let vertical = false;
    let raf = 0;
    let running = false;
    let visible = true;
    let scrolling = false;
    let scrollTimer = 0;
    let t = 0;
    const parallax = { x: 0, y: 0, tx: 0, ty: 0 };

    let stars: { x: number; y: number; r: number; tw: number }[] = [];
    let motes: { x: number; y: number; vx: number; vy: number; r: number }[] = [];

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      vertical = W < H * 1.15;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      stars = Array.from({ length: Math.min(70, Math.floor((W * H) / 9000)) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.1 + 0.3,
        tw: Math.random() * Math.PI * 2,
      }));
      motes = Array.from({ length: Math.min(26, Math.floor((W * H) / 20000)) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.2 + 0.4,
      }));
    };

    const layout = (n: number) => {
      const pts: { x: number; y: number }[] = [];
      if (vertical) {
        const m = 52;
        const span = H - m * 2;
        for (let i = 0; i < n; i++) {
          const f = n === 1 ? 0.5 : i / (n - 1);
          pts.push({
            x: W / 2 + Math.sin(t * 0.0009 + i * 0.9) * Math.min(40, W * 0.12),
            y: m + span * f,
          });
        }
      } else {
        const m = 72;
        const span = W - m * 2;
        for (let i = 0; i < n; i++) {
          const f = n === 1 ? 0.5 : i / (n - 1);
          pts.push({
            x: m + span * f,
            y: H / 2 + Math.sin(t * 0.0011 + i * 0.8) * Math.min(36, H * 0.14),
          });
        }
      }
      return pts;
    };

    const qPoint = (
      p0: { x: number; y: number },
      cp: { x: number; y: number },
      p1: { x: number; y: number },
      u: number
    ) => {
      const v = 1 - u;
      return {
        x: v * v * p0.x + 2 * v * u * cp.x + u * u * p1.x,
        y: v * v * p0.y + 2 * v * u * cp.y + u * u * p1.y,
      };
    };

    const hexPath = (x: number, y: number, r: number, rot: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = rot + (i * Math.PI) / 3;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const drawStarfield = () => {
      for (const s of stars) {
        const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.002 + s.tw));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,220,255,${a * 0.5})`;
        ctx.fill();
      }
    };

    const drawGrid = () => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const horizon = H * 0.52;
      for (let i = 1; i <= 8; i++) {
        const f = i / 8;
        const y = horizon + Math.pow(f, 1.8) * (H - horizon);
        ctx.strokeStyle = `rgba(34,211,238,${0.05 * (1 - f)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      for (let i = 0; i <= 12; i++) {
        const fx = (i / 12 - 0.5) * 2;
        ctx.strokeStyle = `rgba(34,211,238,0.035)`;
        ctx.beginPath();
        ctx.moveTo(W / 2, horizon);
        ctx.lineTo(W / 2 + fx * W * 0.95, H);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawSonar = (core: { x: number; y: number }) => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const maxR = Math.hypot(W, H) / 1.5;
      const rings = 3;
      for (let k = 0; k < rings; k++) {
        const phase = ((t * 0.00028 + k / rings) % 1);
        const r = phase * maxR;
        ctx.strokeStyle = `rgba(34,211,238,${(1 - phase) * 0.22})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(core.x, core.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawMotes = () => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const m of motes) {
        m.x += m.vx;
        m.y += m.vy;
        if (m.x < 0) m.x = W;
        else if (m.x > W) m.x = 0;
        if (m.y < 0) m.y = H;
        else if (m.y > H) m.y = 0;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(94,234,212,0.45)`;
        ctx.fill();
      }
      ctx.restore();
    };

    const draw = () => {
      const { path: p, live: isLive } = stateRef.current;
      ctx.clearRect(0, 0, W, H);

      // Smooth parallax toward target.
      parallax.x += (parallax.tx - parallax.x) * 0.06;
      parallax.y += (parallax.ty - parallax.y) * 0.06;
      ctx.save();
      ctx.translate(parallax.x, parallax.y);

      drawStarfield();
      drawGrid();

      if (p.length < 2) {
        ctx.restore();
        return;
      }
      const pts = layout(p.length);
      const coreIdx = Math.max(0, p.findIndex((n) => n.kind === "engine"));
      drawSonar(pts[coreIdx] ?? pts[0]);
      drawMotes();

      // Segments with alternating arcs.
      const segs = [];
      for (let i = 0; i < p.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dir = i % 2 === 0 ? 1 : -1;
        const bow = vertical ? 34 : 28;
        const cp = vertical ? { x: mx + dir * bow, y: my } : { x: mx, y: my + dir * bow };
        segs.push({ a, b, cp, ca: KIND_COLOR[p[i].kind], cb: KIND_COLOR[p[i + 1].kind] });
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      // Volumetric energy conduits (bloom passes).
      for (const s of segs) {
        const grad = ctx.createLinearGradient(s.a.x, s.a.y, s.b.x, s.b.y);
        grad.addColorStop(0, rgba(s.ca, 0.7));
        grad.addColorStop(1, rgba(s.cb, 0.7));
        for (const pass of [
          { w: 11, a: 0.05 },
          { w: 5, a: 0.13 },
          { w: 1.8, a: 0.85 },
        ]) {
          ctx.strokeStyle = grad;
          ctx.globalAlpha = pass.a;
          ctx.lineWidth = pass.w;
          ctx.beginPath();
          ctx.moveTo(s.a.x, s.a.y);
          ctx.quadraticCurveTo(s.cp.x, s.cp.y, s.b.x, s.b.y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // Streaming value-packets with light trails.
      const speed = isLive ? 0.0005 : 0.0002;
      const perSeg = isLive ? 3 : 2;
      for (let si = 0; si < segs.length; si++) {
        const s = segs[si];
        for (let k = 0; k < perSeg; k++) {
          const frac = (t * speed + si * 0.13 + k / perSeg) % 1;
          const col = k % 2 === 0 ? s.cb : ([190, 255, 235] as [number, number, number]);
          for (let tr = 0; tr < 7; tr++) {
            const u = frac - tr * 0.02;
            if (u < 0) continue;
            const pt = qPoint(s.a, s.cp, s.b, u);
            const a = (1 - tr / 7) * (isLive ? 1 : 0.6);
            const rr = (tr === 0 ? 3 : 2) * (isLive ? 1.15 : 1);
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, rr, 0, Math.PI * 2);
            ctx.fillStyle = rgba(col, a);
            ctx.fill();
          }
        }
      }
      ctx.restore();

      // Nodes.
      for (let i = 0; i < p.length; i++) {
        const { x, y } = pts[i];
        const node = p[i];
        const c = KIND_COLOR[node.kind];
        const isCore = node.kind === "engine";
        const baseR = isCore ? 26 : 15;

        // Halo.
        const halo = ctx.createRadialGradient(x, y, 0, x, y, baseR * 3.6);
        halo.addColorStop(0, rgba(c, 0.5));
        halo.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, baseR * 3.6, 0, Math.PI * 2);
        ctx.fill();

        // Expanding pulse ring.
        const ringPhase = (t * 0.0006 + i * 0.2) % 1;
        ctx.strokeStyle = rgba(c, (1 - ringPhase) * 0.45);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, baseR + ringPhase * baseR * 2.2, 0, Math.PI * 2);
        ctx.stroke();

        // Hex frame (rotating).
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        hexPath(x, y, baseR + 8, t * 0.0006 * (i % 2 === 0 ? 1 : -1));
        ctx.strokeStyle = rgba(c, 0.5);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();

        // Core disc.
        const disc = ctx.createRadialGradient(x, y, 0, x, y, baseR);
        disc.addColorStop(0, "rgba(255,255,255,0.95)");
        disc.addColorStop(0.45, rgba(c, 0.9));
        disc.addColorStop(1, rgba(c, 0.12));
        ctx.fillStyle = disc;
        ctx.beginPath();
        ctx.arc(x, y, baseR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = rgba(c, 0.85);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, baseR + 3, 0, Math.PI * 2);
        ctx.stroke();

        // Reactor: counter-rotating arcs + spokes.
        if (isCore) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.translate(x, y);
          for (let a = 0; a < 2; a++) {
            ctx.save();
            ctx.rotate(t * (a === 0 ? 0.0018 : -0.0026));
            ctx.strokeStyle = rgba(c, 0.7);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, baseR + 10 + a * 7, 0.4, 0.4 + Math.PI * 1.15);
            ctx.stroke();
            ctx.restore();
          }
          // spokes
          ctx.rotate(t * 0.001);
          for (let s = 0; s < 8; s++) {
            ctx.rotate((Math.PI * 2) / 8);
            ctx.strokeStyle = rgba(c, 0.25);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(baseR + 4, 0);
            ctx.lineTo(baseR + 9, 0);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Label.
        ctx.save();
        ctx.font = `600 ${isCore ? 12.5 : 10.5}px ui-monospace, monospace`;
        ctx.textBaseline = "middle";
        ctx.shadowColor = rgba(c, 0.9);
        ctx.shadowBlur = 10;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        const label = node.label.toUpperCase();
        if (vertical) {
          ctx.textAlign = "left";
          ctx.fillText(label, x + baseR + 16, y);
        } else {
          ctx.textAlign = "center";
          ctx.fillText(label, x, y + baseR + 18);
        }
        ctx.restore();
      }

      ctx.restore(); // parallax
    };

    const loop = (now: number) => {
      if (!running) return;
      t = now;
      draw();
      raf = requestAnimationFrame(loop);
    };

    const shouldRun = () => visible && !document.hidden && !scrolling && !reduce;
    const sync = () => {
      if (shouldRun()) {
        if (!running) {
          running = true;
          raf = requestAnimationFrame(loop);
        }
      } else if (running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    resize();
    t = performance.now();
    if (reduce) draw();
    else sync();

    const onResize = () => {
      resize();
      if (reduce) draw();
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

    let onMove: ((e: MouseEvent) => void) | null = null;
    if (finePointer) {
      onMove = (e: MouseEvent) => {
        const rect = wrap.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        parallax.tx = -nx * 18;
        parallax.ty = -ny * 14;
      };
      wrap.addEventListener("mousemove", onMove, { passive: true });
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(scrollTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
      if (onMove) wrap.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative h-[460px] w-full overflow-hidden rounded-3xl border border-white/8 bg-[#02040a] sm:h-[520px]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* HUD overlay (crisp HTML) */}
      <div className="pointer-events-none absolute inset-0">
        {/* corner brackets */}
        <span className="absolute left-3 top-3 h-5 w-5 border-l border-t border-cyan/40" />
        <span className="absolute right-3 top-3 h-5 w-5 border-r border-t border-cyan/40" />
        <span className="absolute bottom-3 left-3 h-5 w-5 border-b border-l border-cyan/40" />
        <span className="absolute bottom-3 right-3 h-5 w-5 border-b border-r border-cyan/40" />

        <div className="absolute left-4 top-4 flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-white/55">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_2px_rgba(34,211,238,0.7)]" />
          AERO Routing Engine
        </div>
        <div className="absolute right-4 top-4 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-signal">
          {live ? "● Settling" : "○ Standby"}
        </div>
      </div>

      <span className="sr-only">
        Settlement path: {path.map((n) => n.label).join(" to ")}.
      </span>
    </div>
  );
}
