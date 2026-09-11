"use client";

import { useEffect, useRef } from "react";

/**
 * The route-collapse animation: six candidate routes shimmer in superposition,
 * then collapse into the quantum-calibrated winner and a pulse rides it home.
 * Pure canvas, ~60fps, honors prefers-reduced-motion (renders the final frame).
 */
export function QuantumCollapse() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dp = Math.min(devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0, disposed = false;

    const size = () => {
      W = cv.width = cv.offsetWidth * dp;
      H = cv.height = 430 * dp;
    };
    size();
    const onResize = () => size();
    addEventListener("resize", onResize);

    const COLS = [0.07, 0.36, 0.65, 0.93];
    const NODES: Record<string, { c: number; y: number; label: string; mg?: boolean }> = {
      src: { c: 0, y: 0.5, label: "$200 CASH" },
      mg: { c: 1, y: 0.22, label: "Cash rail", mg: true },
      cb: { c: 1, y: 0.5, label: "Coinbase" },
      st: { c: 1, y: 0.78, label: "Stripe" },
      xlm: { c: 2, y: 0.18, label: "Stellar" },
      sol: { c: 2, y: 0.42, label: "Solana" },
      base: { c: 2, y: 0.64, label: "Base" },
      eth: { c: 2, y: 0.86, label: "Ethereum" },
      btc: { c: 3, y: 0.5, label: "BTC ⚡" },
    };
    const PATHS = [
      ["src", "mg", "xlm", "btc"], ["src", "cb", "sol", "btc"], ["src", "cb", "base", "btc"],
      ["src", "st", "base", "btc"], ["src", "st", "eth", "btc"], ["src", "mg", "sol", "btc"],
    ];
    const WIN = 0, CYCLE = 7000;
    const nx = (n: string) => COLS[NODES[n].c] * W;
    const ny = (n: string) => (0.08 + NODES[n].y * 0.78) * H;

    const drawPath = (path: string[], color: string, width: number, alpha: number, glow: boolean) => {
      ctx.save();
      ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width * dp;
      if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 18 * dp; }
      ctx.beginPath();
      for (let i = 0; i < path.length - 1; i++) {
        const x1 = nx(path[i]), y1 = ny(path[i]), x2 = nx(path[i + 1]), y2 = ny(path[i + 1]), mx = (x1 + x2) / 2;
        if (i === 0) ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2);
      }
      ctx.stroke(); ctx.restore();
    };
    const pointOn = (path: string[], t: number): [number, number] => {
      const segs = path.length - 1;
      const seg = Math.min(Math.floor(t * segs), segs - 1);
      const lt = t * segs - seg, u = 1 - lt;
      const x1 = nx(path[seg]), y1 = ny(path[seg]), x2 = nx(path[seg + 1]), y2 = ny(path[seg + 1]), mx = (x1 + x2) / 2;
      return [
        u * u * u * x1 + 3 * u * u * lt * mx + 3 * u * lt * lt * mx + lt * lt * lt * x2,
        u * u * u * y1 + 3 * u * u * lt * y1 + 3 * u * lt * lt * y2 + lt * lt * lt * y2,
      ];
    };

    const t0 = performance.now();
    const frame = (now: number) => {
      if (disposed) return;
      const ph = ((now - t0) % CYCLE) / CYCLE;
      ctx.clearRect(0, 0, W, H);
      const explore = ph < 0.42, collapsing = ph >= 0.42 && ph < 0.58;

      PATHS.forEach((p, i) => {
        if (i === WIN) return;
        const a = explore ? 0.15 + 0.13 * Math.sin(now / 240 + i * 1.7)
          : collapsing ? 0.24 * (1 - (ph - 0.42) / 0.16) : 0.035;
        drawPath(p, i % 2 ? "#9D8CFF" : "#3DE383", 1.3, Math.max(a, 0.03), false);
      });
      const wA = explore ? 0.17 + 0.1 * Math.sin(now / 300) : Math.min(1, (ph - 0.42) / 0.1);
      drawPath(PATHS[WIN], "#3DE383", explore ? 1.4 : 3, Math.max(wA, 0.1), !explore);

      if (ph >= 0.56) {
        const t = Math.min((ph - 0.56) / 0.4, 1);
        const [px, py] = pointOn(PATHS[WIN], t);
        const g = ctx.createRadialGradient(px, py, 0, px, py, 20 * dp);
        g.addColorStop(0, "rgba(61,227,131,1)"); g.addColorStop(0.4, "rgba(61,227,131,.55)"); g.addColorStop(1, "rgba(61,227,131,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 20 * dp, 0, 7); ctx.fill();
      }

      for (const k in NODES) {
        const x = nx(k), y = ny(k);
        const d = NODES[k];
        const lit = PATHS[WIN].includes(k) && ph > 0.48;
        ctx.save();
        if (lit) { ctx.shadowColor = d.mg ? "#E8453C" : "#3DE383"; ctx.shadowBlur = 16 * dp; }
        ctx.fillStyle = d.mg ? "#E8453C" : lit ? "#3DE383" : "#26332B";
        ctx.beginPath(); ctx.arc(x, y, (lit ? 6.5 : 4.5) * dp, 0, 7); ctx.fill(); ctx.restore();
        ctx.fillStyle = d.mg ? (lit ? "#FF7A72" : "#B0463F") : lit ? "#F2F7F3" : "#75837A";
        ctx.font = `${lit || d.mg ? 700 : 400} ${11.5 * dp}px ui-monospace, Menlo, monospace`;
        ctx.textAlign = d.c === 0 ? "left" : d.c === 3 ? "right" : "center";
        const ox = d.c === 0 ? 12 * dp : d.c === 3 ? -12 * dp : 0;
        const oy = d.c === 0 || d.c === 3 ? 24 * dp : -14 * dp;
        ctx.fillText(d.label, x + ox, y + (d.c === 0 || d.c === 3 ? oy : oy));
      }

      if (!reduced) raf = requestAnimationFrame(frame);
    };

    if (reduced) frame(t0 + CYCLE * 0.75);
    else raf = requestAnimationFrame(frame);

    return () => { disposed = true; cancelAnimationFrame(raf); removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={ref} className="block h-[430px] w-full" aria-label="Animation: six candidate payment routes collapsing into the quantum-calibrated winner" />;
}
