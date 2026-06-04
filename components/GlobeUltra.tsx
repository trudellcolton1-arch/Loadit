"use client";

import createGlobe, { type Marker } from "cobe";
import { useEffect, useRef, useState } from "react";
import { GlobeVisualizer } from "./GlobeVisualizer";

type LL = { lat: number; lon: number; label?: string };

const DEG = Math.PI / 180;
type V3 = [number, number, number];

const toVec = (lat: number, lon: number): V3 => {
  const la = lat * DEG;
  const lo = lon * DEG;
  return [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
};
const toLL = (v: V3): [number, number] => [
  Math.asin(Math.max(-1, Math.min(1, v[2]))) / DEG,
  Math.atan2(v[1], v[0]) / DEG,
];
const slerp = (a: V3, b: V3, u: number): V3 => {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  d = Math.max(-1, Math.min(1, d));
  const th = Math.acos(d);
  const s = Math.sin(th);
  if (s < 1e-4) return a;
  const w1 = Math.sin((1 - u) * th) / s;
  const w2 = Math.sin(u * th) / s;
  return [a[0] * w1 + b[0] * w2, a[1] * w1 + b[1] * w2, a[2] * w1 + b[2] * w2];
};

const CYAN: V3 = [0.18, 0.85, 0.95];
const GREEN: V3 = [0.2, 0.95, 0.55];
const MINT: V3 = [0.6, 1, 0.85];

/**
 * Ultra globe — GPU-accelerated lit Earth (cobe) with a great-circle arc and
 * "money" packets streaming from origin to destination. We drive the render
 * loop ourselves so it keeps animating during scroll (never freezes). Falls
 * back to the lightweight 2D globe for reduced-motion / no-WebGL.
 */
export function GlobeUltra({
  origin,
  dest,
  live,
}: {
  origin: LL;
  dest: LL;
  live: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ origin, dest, live });
  stateRef.current = { origin, dest, live };
  const [mode, setMode] = useState<"webgl" | "fallback" | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = !!(
        c.getContext("webgl") || c.getContext("experimental-webgl")
      );
    } catch {
      webgl = false;
    }
    setMode(reduce || !webgl ? "fallback" : "webgl");
  }, []);

  useEffect(() => {
    if (mode !== "webgl") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = canvas.offsetWidth || 1;
    const onResize = () => {
      width = canvas.offsetWidth || width;
    };
    window.addEventListener("resize", onResize, { passive: true });

    let phi = -0.6;
    let raf = 0;
    let paused = false;

    const buildMarkers = (): Marker[] => {
      const { origin: o, dest: d, live: isLive } = stateRef.current;
      const ov = toVec(o.lat, o.lon);
      const dv = toVec(d.lat, d.lon);
      const markers: Marker[] = [
        { location: [o.lat, o.lon], size: 0.07, color: CYAN },
        { location: [d.lat, d.lon], size: 0.08, color: GREEN },
      ];
      const t = performance.now();
      const count = isLive ? 6 : 4;
      const speed = isLive ? 0.00035 : 0.0002;
      for (let k = 0; k < count; k++) {
        const frac = (t * speed + k / count) % 1;
        const [lat, lon] = toLL(slerp(ov, dv, frac));
        markers.push({
          location: [lat, lon],
          size: 0.018 + 0.02 * Math.sin(frac * Math.PI),
          color: MINT,
        });
      }
      return markers;
    };

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: width * dpr,
      height: width * dpr,
      phi: 0,
      theta: 0.28,
      dark: 1,
      diffuse: 1.35,
      mapSamples: isMobile ? 9000 : 16000,
      mapBrightness: 7,
      mapBaseBrightness: 0.04,
      baseColor: [0.06, 0.16, 0.2],
      markerColor: GREEN,
      glowColor: [0.12, 0.42, 0.5],
      arcColor: CYAN,
      arcWidth: 0.7,
      arcHeight: 0.5,
      markers: buildMarkers(),
      arcs: [
        {
          from: [stateRef.current.origin.lat, stateRef.current.origin.lon],
          to: [stateRef.current.dest.lat, stateRef.current.dest.lon],
          color: CYAN,
        },
      ],
    });

    const render = () => {
      if (!paused && width > 0) {
        const { origin: o, dest: d, live: isLive } = stateRef.current;
        phi += isLive ? 0.006 : 0.0032; // always rotating
        globe.update({
          phi,
          width: width * dpr,
          height: width * dpr,
          markers: buildMarkers(),
          arcs: [{ from: [o.lat, o.lon], to: [d.lat, d.lon], color: CYAN }],
        });
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    // Reveal once it's drawing.
    requestAnimationFrame(() => {
      canvas.style.opacity = "1";
    });

    // Only pause when the tab is hidden (invisible to the user; saves battery).
    const onVis = () => {
      paused = document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
    // The render loop reads latest origin/dest/live from stateRef, so we only
    // (re)create the globe when the render mode changes — never on input change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (mode === "fallback") {
    return <GlobeVisualizer origin={origin} dest={dest} live={live} />;
  }

  return (
    <div className="absolute inset-0 grid place-items-center">
      <canvas
        ref={canvasRef}
        style={{
          height: "100%",
          maxWidth: "100%",
          aspectRatio: "1",
          opacity: 0,
          transition: "opacity 1s ease",
          contain: "layout paint size",
        }}
      />
    </div>
  );
}
