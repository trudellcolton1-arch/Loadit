"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* -------------------------------------------------------------------------- */
/*  Node network — points + proximity lines, the "financial universe".        */
/* -------------------------------------------------------------------------- */

const NODE_COUNT = 110;
const MAX_DIST = 2.6; // proximity threshold for drawing an edge
const BOUNDS = 9;

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
  const { pointer } = useThree();

  // Pre-allocate the line buffer for the worst case (all pairs is overkill;
  // cap to a generous fixed size and fill each frame).
  const MAX_LINES = NODE_COUNT * 8;
  const linePositions = useMemo(
    () => new Float32Array(MAX_LINES * 6),
    [MAX_LINES]
  );

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

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Drift nodes within bounds.
    for (let i = 0; i < NODE_COUNT; i++) {
      const ix = i * 3;
      positions[ix] += velocities[ix];
      positions[ix + 1] += velocities[ix + 1];
      positions[ix + 2] += velocities[ix + 2];
      // Bounce softly off the bounds.
      if (Math.abs(positions[ix]) > BOUNDS / 2) velocities[ix] *= -1;
      if (Math.abs(positions[ix + 1]) > (BOUNDS * 0.6) / 2)
        velocities[ix + 1] *= -1;
      if (Math.abs(positions[ix + 2]) > (BOUNDS * 0.5) / 2)
        velocities[ix + 2] *= -1;
    }
    pointGeo.attributes.position.needsUpdate = true;

    // Rebuild proximity edges.
    let v = 0;
    for (let i = 0; i < NODE_COUNT; i++) {
      const ax = positions[i * 3];
      const ay = positions[i * 3 + 1];
      const az = positions[i * 3 + 2];
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dx = ax - positions[j * 3];
        const dy = ay - positions[j * 3 + 1];
        const dz = az - positions[j * 3 + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < MAX_DIST * MAX_DIST && v < MAX_LINES * 6 - 6) {
          linePositions[v++] = ax;
          linePositions[v++] = ay;
          linePositions[v++] = az;
          linePositions[v++] = positions[j * 3];
          linePositions[v++] = positions[j * 3 + 1];
          linePositions[v++] = positions[j * 3 + 2];
        }
      }
    }
    // Zero out the remainder so stale edges don't render.
    for (let k = v; k < linePositions.length; k++) linePositions[k] = 0;
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.setDrawRange(0, v / 3);

    // Gentle rotation + mouse parallax.
    if (group.current) {
      group.current.rotation.y = t * 0.04 + pointer.x * 0.25;
      group.current.rotation.x = pointer.y * 0.15;
    }
  });

  return (
    <group ref={group}>
      <points ref={pointsRef} geometry={pointGeo}>
        <pointsMaterial
          color="#7fb2ff"
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
          color="#3b82f6"
          transparent
          opacity={0.18}
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

const PULSE_COUNT = 40;

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
  return (
    <Canvas
      className="!absolute inset-0"
      camera={{ position: [0, 0, 10], fov: 60 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop="always"
    >
      <fog attach="fog" args={["#04060B", 9, 18]} />
      <Network />
      <Pulses />
    </Canvas>
  );
}
