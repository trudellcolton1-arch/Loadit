"use client";

import { useEffect, useRef } from "react";
import { NODES, ROUTES, type NodeCategory, type Status } from "../_lib/world";

/**
 * NETWORK GLOBE — a dot-sphere planet with financial nodes on real cities and
 * value moving between them. Pure Canvas 2D with a hand-rolled projection: no
 * WebGL, no three.js, ~1 KB of math. Pauses off-screen, caps DPR at 2, draws
 * fewer points on phones, follows the pointer gently, and renders a single
 * still frame when the visitor prefers reduced motion.
 */

const DEG = Math.PI / 180;
type V = { x: number; y: number; z: number };

const toVec = (lat: number, lon: number): V => {
  const la = lat * DEG, lo = lon * DEG;
  return { x: Math.cos(la) * Math.sin(lo), y: Math.sin(la), z: Math.cos(la) * Math.cos(lo) };
};
const slerp = (a: V, b: V, u: number): V => {
  let d = a.x * b.x + a.y * b.y + a.z * b.z;
  d = Math.max(-1, Math.min(1, d));
  const th = Math.acos(d), s = Math.sin(th);
  if (s < 1e-4) return a;
  const w1 = Math.sin((1 - u) * th) / s, w2 = Math.sin(u * th) / s;
  return { x: a.x * w1 + b.x * w2, y: a.y * w1 + b.y * w2, z: a.z * w1 + b.z * w2 };
};
const rotY = (v: V, a: number): V => ({ x: v.x * Math.cos(a) + v.z * Math.sin(a), y: v.y, z: -v.x * Math.sin(a) + v.z * Math.cos(a) });
const rotX = (v: V, a: number): V => ({ x: v.x, y: v.y * Math.cos(a) - v.z * Math.sin(a), z: v.y * Math.sin(a) + v.z * Math.cos(a) });

const CATEGORY_COLOR: Record<NodeCategory, string> = {
  cash: "#FBBF24",
  bank: "#FFFFFF",
  asset: "#34D17A",
  merchant: "#5EEAD4",
  wallet: "#A5B4FC",
  network: "#22D3EE",
};
const STATUS_COLOR: Record<Status, string> = { live: "#34D17A", building: "#FBBF24", vision: "#5EEAD4" };

/** Evenly distributed sphere points (Fibonacci lattice). */
function lattice(n: number): V[] {
  const pts: V[] = [];
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = g * i;
    pts.push({ x: Math.cos(t) * r, y, z: Math.sin(t) * r });
  }
  return pts;
}

export function NetworkGlobe({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const dots = lattice(mobile ? 700 : 1500);
    const nodes = NODES.map((n) => ({ ...n, v: toVec(n.lat, n.lon) }));
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const arcs = ROUTES.map((r, i) => ({
      a: byId.get(r.from)!.v,
      b: byId.get(r.to)!.v,
      color: STATUS_COLOR[r.status],
      phase: (i / ROUTES.length) * 7000,
      period: 5200 + (i % 3) * 900,
    }));

    let w = 0, h = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let yaw = -0.9, pitch = 0.32;
    let targetTiltX = 0, targetTiltY = 0, tiltX = 0, tiltY = 0;
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetTiltY = ((e.clientX - rect.left) / rect.width - 0.5) * 0.35;
      targetTiltX = ((e.clientY - rect.top) / rect.height - 0.5) * 0.25;
    };
    const onLeave = () => { targetTiltX = 0; targetTiltY = 0; };
    if (!mobile) {
      canvas.addEventListener("pointermove", onMove, { passive: true });
      canvas.addEventListener("pointerleave", onLeave);
    }

    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 });
    io.observe(canvas);

    const project = (v: V) => {
      const r = rotX(rotY(v, yaw + tiltY), pitch + tiltX);
      const R = Math.min(w, h) * 0.42;
      return { x: w / 2 + r.x * R, y: h / 2 - r.y * R, z: r.z, R };
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.42;

      // atmosphere
      const glow = ctx.createRadialGradient(w / 2, h / 2, R * 0.6, w / 2, h / 2, R * 1.25);
      glow.addColorStop(0, "rgba(34,169,92,0.10)");
      glow.addColorStop(1, "rgba(4,6,11,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // dot sphere
      for (const p of dots) {
        const q = project(p);
        if (q.z < -0.15) continue;
        const a = 0.08 + Math.max(0, q.z) * 0.32;
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
        ctx.fillRect(q.x, q.y, 1.2, 1.2);
      }

      // arcs with travelling value
      for (const arc of arcs) {
        const u = ((t + arc.phase) % arc.period) / arc.period; // 0..1 head position
        const head = Math.min(1, u * 1.25);
        const tail = Math.max(0, head - 0.35);
        ctx.beginPath();
        let started = false;
        const steps = 40;
        for (let i = 0; i <= steps; i++) {
          const k = tail + (head - tail) * (i / steps);
          const p = slerp(arc.a, arc.b, k);
          const lift = 1 + Math.sin(k * Math.PI) * 0.16;
          const q = project({ x: p.x * lift, y: p.y * lift, z: p.z * lift });
          if (q.z < -0.05) { started = false; continue; }
          if (!started) { ctx.moveTo(q.x, q.y); started = true; } else ctx.lineTo(q.x, q.y);
        }
        ctx.strokeStyle = arc.color;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.globalAlpha = 1;
        // head particle
        const hp = slerp(arc.a, arc.b, head);
        const lift = 1 + Math.sin(head * Math.PI) * 0.16;
        const hq = project({ x: hp.x * lift, y: hp.y * lift, z: hp.z * lift });
        if (hq.z > -0.05 && head < 1) {
          ctx.beginPath();
          ctx.arc(hq.x, hq.y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();
        }
      }

      // nodes + labels
      ctx.font = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";
      for (const n of nodes) {
        const q = project(n.v);
        if (q.z < -0.1) continue;
        const a = 0.35 + Math.max(0, q.z) * 0.65;
        const color = CATEGORY_COLOR[n.category];
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(q.x, q.y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = a * 0.5;
        ctx.stroke();
        if (q.z > 0.25 && !mobile) {
          ctx.globalAlpha = a;
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fillText(n.label.toUpperCase(), q.x + 11, q.y + 3.5);
        }
        ctx.globalAlpha = 1;
      }
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) { last = now; return; }
      const dt = Math.min(50, now - last);
      last = now;
      yaw += dt * 0.00009;
      tiltX += (targetTiltX - tiltX) * 0.04;
      tiltY += (targetTiltY - tiltY) * 0.04;
      draw(now);
    };

    const onResize = () => { resize(); if (reduce) draw(0); };
    window.addEventListener("resize", onResize, { passive: true });

    if (reduce) draw(2600);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={className}
      role="img"
      aria-label="A globe of financial networks — cash, banks, digital assets, wallets, merchants — with value moving between them along routes labeled live, building, or vision."
    />
  );
}
