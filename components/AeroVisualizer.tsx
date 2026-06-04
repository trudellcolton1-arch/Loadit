"use client";

import { useEffect, useRef } from "react";
import type { RouteResult } from "@/lib/aero";

/**
 * LOADIT AERO™ holographic settlement reactor.
 * A living "year-3000" routing visualization on Canvas 2D — orbital nodes,
 * volumetric energy beams, streaming value-packets with light trails, a
 * pulsing AI core, a perspective grid and ambient motes. GPU-light and it
 * pauses off-screen / during scroll / when hidden to stay smooth on iOS.
 */

type Node = RouteResult["path"][number];

const KIND_COLOR: Record<Node["kind"], [number, number, number]> = {
  origin: [230, 240, 255],
  engine: [34, 211, 238], // cyan
  asset: [94, 234, 212], // teal
  network: [52, 211, 153], // green
  wallet: [34, 197, 94], // bright green
};

const rgba = (c: [number, number, number], a: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export function AeroVisualizer({
  path,
  live,
}: {
  path: Node[];
  live: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Keep latest props available to the imperative loop without re-subscribing.
  const stateRef = useRef({ path, live });
  stateRef.current = { path, live };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

    // Ambient motes.
    let motes: { x: number; y: number; vx: number; vy: number; r: number }[] = [];

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      vertical = W < H * 1.15;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const count = Math.min(38, Math.floor((W * H) / 14000));
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.3 + 0.4,
      }));
    };

    // Node positions (CSS px), with a gentle living wave.
    const layout = (n: number) => {
      const pts: { x: number; y: number }[] = [];
      if (vertical) {
        const mTop = 46;
        const mBot = 46;
        const span = H - mTop - mBot;
        for (let i = 0; i < n; i++) {
          const f = n === 1 ? 0.5 : i / (n - 1);
          const y = mTop + span * f;
          const x = W / 2 + Math.sin(t * 0.0009 + i * 0.9) * Math.min(46, W * 0.13);
          pts.push({ x, y });
        }
      } else {
        const mL = 64;
        const mR = 64;
        const span = W - mL - mR;
        for (let i = 0; i < n; i++) {
          const f = n === 1 ? 0.5 : i / (n - 1);
          const x = mL + span * f;
          const y = H / 2 + Math.sin(t * 0.0011 + i * 0.8) * Math.min(40, H * 0.16);
          pts.push({ x, y });
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

    const drawGrid = () => {
      // Perspective floor grid fading toward a horizon — subtle depth.
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const horizon = H * 0.5;
      const lines = 9;
      for (let i = 1; i <= lines; i++) {
        const f = i / lines;
        const y = horizon + Math.pow(f, 1.7) * (H - horizon);
        const a = 0.05 * (1 - f);
        ctx.strokeStyle = `rgba(34,211,238,${a})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      const vanishing = W / 2; // vanishing point
      const verts = 14;
      for (let i = 0; i <= verts; i++) {
        const fx = (i / verts - 0.5) * 2;
        const xBottom = W / 2 + fx * W * 0.95;
        ctx.strokeStyle = `rgba(34,211,238,0.04)`;
        ctx.beginPath();
        ctx.moveTo(vanishing, horizon);
        ctx.lineTo(xBottom, H);
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
        ctx.fillStyle = `rgba(94,234,212,0.5)`;
        ctx.fill();
      }
      ctx.restore();
    };

    const draw = () => {
      const { path: p, live: isLive } = stateRef.current;
      ctx.clearRect(0, 0, W, H);

      // Backdrop.
      drawGrid();
      drawMotes();

      if (p.length < 2) return;
      const pts = layout(p.length);

      // Precompute control points (alternating arc direction) per segment.
      const segs = [];
      for (let i = 0; i < p.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dir = i % 2 === 0 ? 1 : -1;
        const bow = vertical ? 30 : 24;
        const cp = vertical
          ? { x: mx + dir * bow, y: my }
          : { x: mx, y: my + dir * bow };
        segs.push({ a, b, cp, ca: KIND_COLOR[p[i].kind], cb: KIND_COLOR[p[i + 1].kind] });
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      // Volumetric beams (draw 3 passes for bloom).
      for (const s of segs) {
        const grad = ctx.createLinearGradient(s.a.x, s.a.y, s.b.x, s.b.y);
        grad.addColorStop(0, rgba(s.ca, 0.6));
        grad.addColorStop(1, rgba(s.cb, 0.6));
        const passes = [
          { w: 9, a: 0.06 },
          { w: 4, a: 0.14 },
          { w: 1.6, a: 0.7 },
        ];
        for (const pass of passes) {
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
      const speed = isLive ? 0.00045 : 0.00018;
      const perSeg = isLive ? 3 : 2;
      for (let si = 0; si < segs.length; si++) {
        const s = segs[si];
        for (let k = 0; k < perSeg; k++) {
          const frac = (t * speed + si * 0.13 + k / perSeg) % 1;
          const col = k % 2 === 0 ? s.cb : ([180, 255, 230] as [number, number, number]);
          for (let tr = 0; tr < 5; tr++) {
            const u = frac - tr * 0.022;
            if (u < 0) continue;
            const pt = qPoint(s.a, s.cp, s.b, u);
            const a = (1 - tr / 5) * (isLive ? 0.95 : 0.6);
            const r = (tr === 0 ? 2.6 : 1.8) * (isLive ? 1.15 : 1);
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
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
        const baseR = isCore ? 22 : 13;
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.004 + i);

        // Glow halo.
        const halo = ctx.createRadialGradient(x, y, 0, x, y, baseR * 3.4);
        halo.addColorStop(0, rgba(c, 0.45));
        halo.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, baseR * 3.4, 0, Math.PI * 2);
        ctx.fill();

        // Expanding pulse ring.
        const ringPhase = ((t * 0.0006 + i * 0.2) % 1);
        ctx.strokeStyle = rgba(c, (1 - ringPhase) * 0.4);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, baseR + ringPhase * baseR * 2.4, 0, Math.PI * 2);
        ctx.stroke();

        // Core disc.
        const disc = ctx.createRadialGradient(x, y, 0, x, y, baseR);
        disc.addColorStop(0, rgba([255, 255, 255], 0.95));
        disc.addColorStop(0.4, rgba(c, 0.9));
        disc.addColorStop(1, rgba(c, 0.15));
        ctx.fillStyle = disc;
        ctx.beginPath();
        ctx.arc(x, y, baseR, 0, Math.PI * 2);
        ctx.fill();

        // Ring.
        ctx.strokeStyle = rgba(c, 0.8);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, baseR + 3, 0, Math.PI * 2);
        ctx.stroke();

        // AI reactor: counter-rotating arcs.
        if (isCore) {
          ctx.save();
          ctx.translate(x, y);
          for (let a = 0; a < 2; a++) {
            ctx.rotate(t * (a === 0 ? 0.0016 : -0.0024));
            ctx.strokeStyle = rgba(c, 0.7);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, baseR + 9 + a * 6, 0.4, 0.4 + Math.PI * 1.1);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Label.
        ctx.save();
        ctx.font = `600 ${isCore ? 12 : 10.5}px ui-monospace, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = rgba(c, 0.9);
        ctx.shadowBlur = 8;
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        const label = node.label.toUpperCase();
        if (vertical) {
          ctx.textAlign = "left";
          ctx.fillText(label, x + baseR + 14, y);
        } else {
          ctx.fillText(label, x, y + baseR + 16 + (i % 2 === 0 ? 0 : 6) * 0);
        }
        ctx.restore();

        void pulse;
      }

      // Occasional horizontal scan sweep for that "system online" feel.
      const sweep = (t * 0.00012) % 1.4;
      if (sweep < 1) {
        const sx = sweep * W;
        const g = ctx.createLinearGradient(sx - 40, 0, sx + 40, 0);
        g.addColorStop(0, "rgba(34,211,238,0)");
        g.addColorStop(0.5, "rgba(34,211,238,0.07)");
        g.addColorStop(1, "rgba(34,211,238,0)");
        ctx.fillStyle = g;
        ctx.fillRect(sx - 40, 0, 80, H);
      }
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
    <div
      ref={wrapRef}
      className="relative h-[420px] w-full overflow-hidden rounded-3xl border border-white/8 bg-[#02040a] sm:h-[460px]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Accessible text fallback for the canvas. */}
      <span className="sr-only">
        Settlement path: {path.map((n) => n.label).join(" to ")}.
      </span>
    </div>
  );
}
