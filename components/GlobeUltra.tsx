"use client";

import createGlobe, { type Marker, type Arc } from "cobe";
import { useEffect, useRef, useState } from "react";
import { GlobeVisualizer } from "./GlobeVisualizer";
import { WORLD_CITIES } from "@/lib/geo";

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
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

const CYAN: V3 = [0.18, 0.85, 0.95];
// Loadit brand green (#22A95C), brightened for glow on the dark globe.
const GREEN: V3 = [0.18, 0.78, 0.44];
const MINT: V3 = [0.5, 1, 0.72];
const AMBIENT: V3 = [0.13, 0.6, 0.7];
const CITY: V3 = [0.16, 0.5, 0.55];
const AMBER: V3 = [0.98, 0.72, 0.16];

// HQ-forecast corridors (predicted demand spikes): [fromLat, fromLon, toLat, toLon].
const FORECASTS: [number, number, number, number][] = [
  [25.2, 55.27, 19.08, 72.88], // Dubai → Mumbai
  [34.05, -118.24, 19.43, -99.13], // LA → Mexico City
  [1.35, 103.82, 14.6, 120.98], // Singapore → Manila
  [51.51, -0.13, 6.52, 3.38], // London → Lagos
];

interface AmbientArc {
  from: V3;
  to: V3;
  born: number;
  life: number;
}

/**
 * Ultra globe — GPU-accelerated lit Earth (cobe). Shows a busy global network
 * (ambient settlement arcs flickering between hubs) with the user's own route
 * highlighted in green. Drag to spin (touch + mouse); momentum + auto-rotate.
 * Renders continuously (never freezes on scroll). 2D fallback for
 * reduced-motion / no-WebGL.
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
      webgl = !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
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

    // City vectors for ambient traffic.
    const cityVecs = WORLD_CITIES.map(([la, lo]) => toVec(la, lo));
    const cityCount = isMobile ? 30 : cityVecs.length;
    const arcCount = isMobile ? 9 : 18;
    const ambient: AmbientArc[] = Array.from({ length: arcCount }, () =>
      spawnArc(cityVecs)
    );

    // Rotation state (auto-rotate + drag + momentum).
    let phi = -0.6;
    let theta = 0.26;
    let vphi = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let paused = false;

    const buildMarkers = (): Marker[] => {
      const { origin: o, dest: d, live: isLive } = stateRef.current;
      const markers: Marker[] = [];
      // Ambient hubs (dim).
      for (let i = 0; i < cityCount; i++) {
        const [lat, lon] = WORLD_CITIES[i];
        markers.push({ location: [lat, lon], size: 0.012, color: CITY });
      }
      // User route — highlighted.
      const t = performance.now();
      const pulse = 0.07 + 0.02 * Math.sin(t * 0.004);
      markers.push({ location: [o.lat, o.lon], size: 0.06, color: CYAN });
      markers.push({ location: [d.lat, d.lon], size: pulse, color: GREEN });
      // Forecast hotspots — pulsing amber where HQ predicts demand.
      FORECASTS.forEach(([fa, fo, ta, to], i) => {
        const p = 0.016 + 0.014 * Math.abs(Math.sin(t * 0.003 + i));
        markers.push({ location: [fa, fo], size: p, color: AMBER });
        markers.push({ location: [ta, to], size: p, color: AMBER });
      });
      const ov = toVec(o.lat, o.lon);
      const dv = toVec(d.lat, d.lon);
      const count = isLive ? 6 : 4;
      const speed = isLive ? 0.00035 : 0.0002;
      for (let k = 0; k < count; k++) {
        const frac = (t * speed + k / count) % 1;
        const [lat, lon] = toLL(slerp(ov, dv, frac));
        markers.push({
          location: [lat, lon],
          size: 0.016 + 0.02 * Math.sin(frac * Math.PI),
          color: MINT,
        });
      }
      return markers;
    };

    const buildArcs = (): Arc[] => {
      const { origin: o, dest: d } = stateRef.current;
      const t = performance.now();
      const arcs: Arc[] = [];
      // Ambient global traffic — fade in/out, respawn.
      for (const a of ambient) {
        const age = (t - a.born) / a.life;
        if (age >= 1) {
          Object.assign(a, spawnArc(cityVecs));
          continue;
        }
        const env = Math.sin(age * Math.PI); // 0→1→0
        const [flat, flon] = toLL(a.from);
        const [tlat, tlon] = toLL(a.to);
        arcs.push({
          from: [flat, flon],
          to: [tlat, tlon],
          color: [AMBIENT[0] * env, AMBIENT[1] * env, AMBIENT[2] * env],
        });
      }
      // Forecast corridors — pulsing amber (predicted demand).
      FORECASTS.forEach(([fa, fo, ta, to], i) => {
        const env = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.0012 + i * 1.3));
        arcs.push({
          from: [fa, fo],
          to: [ta, to],
          color: [AMBER[0] * env, AMBER[1] * env, AMBER[2] * env],
        });
      });
      // User route — bright green, always on top.
      arcs.push({ from: [o.lat, o.lon], to: [d.lat, d.lon], color: GREEN });
      return arcs;
    };

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: width * dpr,
      height: width * dpr,
      phi: 0,
      theta,
      dark: 1,
      diffuse: 1.35,
      mapSamples: isMobile ? 9000 : 16000,
      mapBrightness: 7,
      mapBaseBrightness: 0.04,
      baseColor: [0.06, 0.16, 0.2],
      markerColor: GREEN,
      glowColor: [0.12, 0.42, 0.5],
      arcColor: AMBIENT,
      arcWidth: 0.6,
      arcHeight: 0.5,
      markers: buildMarkers(),
      arcs: buildArcs(),
    });

    const AUTO = () => (stateRef.current.live ? 0.006 : 0.0032);
    const render = () => {
      if (!paused && width > 0) {
        if (!dragging) {
          phi += vphi;
          vphi *= 0.92;
          if (Math.abs(vphi) < AUTO()) {
            vphi = 0;
            phi += AUTO();
          }
        }
        globe.update({
          phi,
          theta,
          width: width * dpr,
          height: width * dpr,
          markers: buildMarkers(),
          arcs: buildArcs(),
        });
      }
      raf = requestAnimationFrame(render);
    };
    let raf = requestAnimationFrame(render);
    requestAnimationFrame(() => {
      canvas.style.opacity = "1";
    });

    // Drag to spin (touch keeps vertical page scroll via touch-action: pan-y).
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      vphi = 0;
      canvas.style.cursor = "grabbing";
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const d = dx * 0.006;
      phi -= d;
      vphi = -d;
      if (e.pointerType === "mouse") theta = clamp(theta + dy * 0.004, -0.5, 1.1);
    };
    const onUp = () => {
      dragging = false;
      canvas.style.cursor = "grab";
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    const onVis = () => {
      paused = document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      document.removeEventListener("visibilitychange", onVis);
    };
    // Render loop reads latest props from stateRef — only recreate on mode change.
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
          cursor: "grab",
          touchAction: "pan-y",
        }}
      />
    </div>
  );
}

function spawnArc(cityVecs: V3[]): AmbientArc {
  const a = Math.floor(Math.random() * cityVecs.length);
  let b = Math.floor(Math.random() * cityVecs.length);
  if (b === a) b = (b + 1) % cityVecs.length;
  return {
    from: cityVecs[a],
    to: cityVecs[b],
    born: performance.now(),
    life: 1600 + Math.random() * 2200,
  };
}
