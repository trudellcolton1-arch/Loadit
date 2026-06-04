"use client";

import { useEffect, useRef } from "react";

/**
 * AERO global settlement globe — a 3D dot-sphere with great-circle "money"
 * arcs flying from the Loadit origin to the chosen destination. Pure Canvas 2D
 * with hand-rolled 3D projection (no three.js / WebGL) so it stays light and
 * iOS-smooth. Pauses off-screen / during scroll / when hidden.
 */

type LL = { lat: number; lon: number; label?: string };
type Vec = { x: number; y: number; z: number };

const DEG = Math.PI / 180;

const baseVec = (lat: number, lon: number): Vec => {
  const la = lat * DEG;
  const lo = lon * DEG;
  return {
    x: Math.cos(la) * Math.sin(lo),
    y: Math.sin(la),
    z: Math.cos(la) * Math.cos(lo),
  };
};

const slerp = (a: Vec, b: Vec, u: number): Vec => {
  let dot = a.x * b.x + a.y * b.y + a.z * b.z;
  dot = Math.max(-1, Math.min(1, dot));
  const theta = Math.acos(dot);
  const s = Math.sin(theta);
  if (s < 1e-4) return a;
  const w1 = Math.sin((1 - u) * theta) / s;
  const w2 = Math.sin(u * theta) / s;
  return {
    x: a.x * w1 + b.x * w2,
    y: a.y * w1 + b.y * w2,
    z: a.z * w1 + b.z * w2,
  };
};

export function GlobeVisualizer({
  origin,
  dest,
  live,
}: {
  origin: LL;
  dest: LL;
  live: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ origin, dest, live });
  stateRef.current = { origin, dest, live };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 1.6);
    const tilt = 0.42;

    let W = 0;
    let H = 0;
    let cx = 0;
    let cy = 0;
    let R = 0;
    let raf = 0;
    let running = false;
    let visible = true;
    let scrolling = false;
    let scrollTimer = 0;
    let t = 0;
    let viewLon = -50;

    let dots: Vec[] = [];
    let stars: { x: number; y: number; r: number; tw: number }[] = [];

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = W / 2;
      cy = H / 2;
      R = Math.min(W, H) * 0.4;

      const n = isMobile ? 460 : 760;
      const ga = Math.PI * (3 - Math.sqrt(5));
      dots = Array.from({ length: n }, (_, i) => {
        const y = 1 - (i / (n - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const th = i * ga;
        return { x: Math.cos(th) * r, y, z: Math.sin(th) * r };
      });
      stars = Array.from({ length: isMobile ? 40 : 80 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.1 + 0.3,
        tw: Math.random() * Math.PI * 2,
      }));
    };

    // Apply current view rotation (yaw to face viewLon, then tilt).
    const transform = (v: Vec): Vec => {
      const a = -viewLon * DEG;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const x1 = v.x * ca + v.z * sa;
      const z1 = -v.x * sa + v.z * ca;
      const y1 = v.y;
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);
      return { x: x1, y: y1 * ct - z1 * st, z: y1 * st + z1 * ct };
    };
    const project = (v: Vec) => ({ x: cx + v.x * R, y: cy - v.y * R, z: v.z });

    const lonOf = (v: Vec) => Math.atan2(v.x, v.z) / DEG;

    const drawStars = () => {
      for (const s of stars) {
        const a = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(t * 0.002 + s.tw));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,220,255,${a * 0.5})`;
        ctx.fill();
      }
    };

    const draw = () => {
      const { origin: o, dest: d, live: isLive } = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      drawStars();

      const oBase = baseVec(o.lat, o.lon);
      const dBase = baseVec(d.lat, d.lon);
      // Center the great-circle midpoint so the whole arc is visible.
      const mid = slerp(oBase, dBase, 0.5);
      const targetLon = lonOf(mid);
      let dl = ((targetLon - viewLon + 540) % 360) - 180;
      viewLon += dl * 0.05;
      viewLon += Math.sin(t * 0.0004) * 0.05; // subtle life

      // Atmosphere glow.
      const atmo = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.35);
      atmo.addColorStop(0, "rgba(34,211,238,0.10)");
      atmo.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = atmo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Globe fill (dark sphere).
      const sphere = ctx.createRadialGradient(
        cx - R * 0.3,
        cy - R * 0.3,
        R * 0.2,
        cx,
        cy,
        R
      );
      sphere.addColorStop(0, "rgba(10,22,34,0.9)");
      sphere.addColorStop(1, "rgba(2,6,12,0.95)");
      ctx.fillStyle = sphere;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Surface dots (front hemisphere only).
      for (const base of dots) {
        const v = transform(base);
        if (v.z <= 0.02) continue;
        const p = project(v);
        const a = 0.18 + v.z * 0.5;
        const rr = 0.6 + v.z * 0.9;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80,200,160,${a * 0.7})`;
        ctx.fill();
      }

      // Rotating HUD tick ring.
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const ticks = 60;
      for (let i = 0; i < ticks; i++) {
        const ang = (i / ticks) * Math.PI * 2 + t * 0.0002;
        const r1 = R * 1.12;
        const r2 = R * (1.12 + (i % 5 === 0 ? 0.05 : 0.025));
        ctx.strokeStyle = `rgba(34,211,238,${i % 5 === 0 ? 0.35 : 0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
        ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
        ctx.stroke();
      }
      ctx.restore();

      // Arc + flying money packets.
      const SAMP = 56;
      const arcPts: { x: number; y: number; z: number }[] = [];
      for (let i = 0; i <= SAMP; i++) {
        const u = i / SAMP;
        const s = slerp(oBase, dBase, u);
        const lift = 1 + Math.sin(u * Math.PI) * 0.45;
        const v = transform({ x: s.x * lift, y: s.y * lift, z: s.z * lift });
        arcPts.push(project(v));
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      // Arc line (bloom passes).
      for (const pass of [
        { w: 6, a: 0.08 },
        { w: 2.5, a: 0.5 },
      ]) {
        ctx.beginPath();
        for (let i = 0; i < arcPts.length; i++) {
          const p = arcPts[i];
          i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = `rgba(34,211,238,${pass.a})`;
        ctx.lineWidth = pass.w;
        ctx.stroke();
      }

      // Packets travelling origin → destination.
      const arcAt = (u: number) => {
        const s = slerp(oBase, dBase, u);
        const lift = 1 + Math.sin(u * Math.PI) * 0.45;
        return project(transform({ x: s.x * lift, y: s.y * lift, z: s.z * lift }));
      };
      const count = isLive ? 5 : 3;
      const speed = isLive ? 0.00055 : 0.00028;
      for (let k = 0; k < count; k++) {
        const frac = (t * speed + k / count) % 1;
        for (let tr = 0; tr < 6; tr++) {
          const u = frac - tr * 0.018;
          if (u < 0) continue;
          const p = arcAt(u);
          const a = (1 - tr / 6) * (isLive ? 1 : 0.7);
          const rr = (tr === 0 ? 3 : 2) * (isLive ? 1.15 : 1);
          ctx.beginPath();
          ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
          ctx.fillStyle =
            tr === 0
              ? `rgba(190,255,235,${a})`
              : `rgba(52,211,153,${a})`;
          ctx.fill();
        }
      }
      ctx.restore();

      // Markers + labels.
      const marker = (
        ll: LL,
        base: Vec,
        color: string,
        labelColor: string
      ) => {
        const v = transform({ x: base.x * 1.01, y: base.y * 1.01, z: base.z * 1.01 });
        if (v.z <= 0) return;
        const p = project(v);
        // pulse
        const ph = (t * 0.0009) % 1;
        ctx.strokeStyle = color.replace("ALPHA", `${(1 - ph) * 0.6}`);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 + ph * 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = color.replace("ALPHA", "1");
        ctx.fill();
        if (ll.label) {
          ctx.save();
          ctx.font = "600 11px ui-monospace, monospace";
          ctx.textBaseline = "middle";
          ctx.shadowColor = labelColor;
          ctx.shadowBlur = 8;
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.fillText(ll.label, p.x + 10, p.y);
          ctx.restore();
        }
      };
      marker(o, oBase, "rgba(34,211,238,ALPHA)", "rgba(34,211,238,0.9)");
      marker(d, dBase, "rgba(52,211,153,ALPHA)", "rgba(52,211,153,0.9)");
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
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
