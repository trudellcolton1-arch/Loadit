"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* -------------------------------------------------------------------------- */
/*  Node network — points + proximity lines, the "financial universe".        */
/* -------------------------------------------------------------------------- */

const NODE_COUNT = 70;
const MAX_DIST = 2.7; // proximity threshold for drawing an edge
const BOUNDS = 9;
// Recompute the (expensive) proximity edges every Nth frame; nodes still drift
// every frame so motion stays smooth while the heavy work is throttled.
const EDGE_INTERVAL = 3;

function useNodes() {
  return useMemo(() => {
    const positions = new Float32Array(NODE_COUNT * 3);
    const velocities = new Float32Array(NODE_COUNT * 3);
    for (let i = 0; i < NODE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * BOUNDS;
      positions[i * 3 + 1] = (Math.random() - 0.5) * BOUNDS * 0.6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * BOUNDS * 0.5;
      velocities[i * 3] = (Math.random() - 0.5) * 0.0025;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0025;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.0025;
    }
    return { positions, velocities };
  }, []);
}

function Network() {
  const { positions, velocities } = useNodes();
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const group = useRef<THREE.Group>(null);
  const frame = useRef(0);
  const { pointer } = useThree();

  const MAX_LINES = NODE_COUNT * 6;
  const linePositions = useMemo(
    () => new Float32Array(MAX_LINES * 6),
    [MAX_LINES]
  );
  // Track how many floats were written last time so we only clear the delta.
  const lastCount = useRef(0);

  const pointGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    return g;
  }, [linePositions]);

  // Dispose GPU resources on unmount.
  useEffect(() => {
    return () => {
      pointGeo.dispose();
      lineGeo.dispose();
    };
  }, [pointGeo, lineGeo]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Drift nodes within bounds (cheap, every frame).
    for (let i = 0; i < NODE_COUNT; i++) {
      const ix = i * 3;
      positions[ix] += velocities[ix];
      positions[ix + 1] += velocities[ix + 1];
      positions[ix + 2] += velocities[ix + 2];
      if (Math.abs(positions[ix]) > BOUNDS / 2) velocities[ix] *= -1;
      if (Math.abs(positions[ix + 1]) > (BOUNDS * 0.6) / 2)
        velocities[ix + 1] *= -1;
      if (Math.abs(positions[ix + 2]) > (BOUNDS * 0.5) / 2)
        velocities[ix + 2] *= -1;
    }
    pointGeo.attributes.position.needsUpdate = true;

    // Rebuild proximity edges only every Nth frame (the O(n²) part).
    frame.current = (frame.current + 1) % EDGE_INTERVAL;
    if (frame.current === 0) {
      let v = 0;
      const maxV = MAX_LINES * 6 - 6;
      for (let i = 0; i < NODE_COUNT; i++) {
        const ax = positions[i * 3];
        const ay = positions[i * 3 + 1];
        const az = positions[i * 3 + 2];
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const dx = ax - positions[j * 3];
          const dy = ay - positions[j * 3 + 1];
          const dz = az - positions[j * 3 + 2];
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < MAX_DIST * MAX_DIST) {
            if (v >= maxV) break;
            linePositions[v++] = ax;
            linePositions[v++] = ay;
            linePositions[v++] = az;
            linePositions[v++] = positions[j * 3];
            linePositions[v++] = positions[j * 3 + 1];
            linePositions[v++] = positions[j * 3 + 2];
          }
        }
      }
      // Only clear the floats that were written last frame but not this one.
      for (let k = v; k < lastCount.current; k++) linePositions[k] = 0;
      lastCount.current = v;
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.setDrawRange(0, v / 3);
    }

    // Gentle rotation + mouse parallax.
    if (group.current) {
      group.current.rotation.y = t * 0.04 + pointer.x * 0.2;
      group.current.rotation.x = pointer.y * 0.12;
    }
  });

  return (
    <group ref={group}>
      <points ref={pointsRef} geometry={pointGeo}>
        <pointsMaterial
          color="#6ee7a8"
          size={0.06}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments ref={linesRef} geometry={lineGeo}>
        <lineBasicMaterial
          color="#22a95c"
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Energy pulses — value moving between chains.                              */
/* -------------------------------------------------------------------------- */

const PULSE_COUNT = 26;

function Pulses() {
  const ref = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const positions = new Float32Array(PULSE_COUNT * 3);
    const speed = new Float32Array(PULSE_COUNT);
    for (let i = 0; i < PULSE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      speed[i] = 0.01 + Math.random() * 0.03;
    }
    return { positions, speed };
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    return g;
  }, [data]);

  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(() => {
    for (let i = 0; i < PULSE_COUNT; i++) {
      data.positions[i * 3] += data.speed[i];
      if (data.positions[i * 3] > 6) data.positions[i * 3] = -6;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        color="#5eead4"
        size={0.12}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* -------------------------------------------------------------------------- */

export default function NeuralField() {
  const containerRef = useRef<HTMLDivElement>(null);
  // "always" while the hero is on screen, "never" once scrolled past — so the
  // GPU isn't rendering behind the entire rest of the page.
  const [frameloop, setFrameloop] = useState<"always" | "never">("never");
  // Whether to mount WebGL at all (skipped on mobile / reduced-motion).
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (reduce || isMobile) return; // Hero keeps its CSS gradient fallback.
    setEnabled(true);

    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setFrameloop(entry.isIntersecting ? "always" : "never"),
      { threshold: 0.01 }
    );
    io.observe(el);

    // Also pause when the tab is hidden.
    const onVis = () =>
      document.hidden && setFrameloop("never");
    document.addEventListener("visibilitychange", onVis);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div ref={containerRef} className="absolute inset-0">
      <Canvas
        className="!absolute inset-0"
        camera={{ position: [0, 0, 10], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        frameloop={frameloop}
      >
        <fog attach="fog" args={["#04060B", 9, 18]} />
        <Network />
        <Pulses />
      </Canvas>
    </div>
  );
}
