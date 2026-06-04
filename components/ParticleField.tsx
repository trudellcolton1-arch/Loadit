"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight 2D-canvas "financial universe" — drifting nodes, proximity
 * links, and a few brighter value-pulses. Replaces the heavy three.js scene:
 * no dependencies, a few KB, and it pauses when off-screen or the tab is
 * hidden. Honors prefers-reduced-motion (renders a single static frame).
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    const CONNECT = 132;

    type P = { x: number; y: number; vx: number; vy: number; r: number; pulse: boolean };
    let particles: P[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let running = false;

    const spawn = (): P => {
      const pulse = Math.random() < 0.12;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (pulse ? 0.45 : 0.16),
        vy: (Math.random() - 0.5) * 0.16,
        r: pulse ? 1.8 : Math.random() * 1.3 + 0.6,
        pulse,
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const cap = isMobile ? 34 : 78;
      const target = Math.min(cap, Math.floor((width * height) / 17000));
      particles = Array.from({ length: target }, spawn);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = width + 20;
        else if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        else if (p.y > height + 20) p.y = -20;
      }

      // Proximity links.
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < CONNECT * CONNECT) {
            const alpha = (1 - Math.sqrt(d2) / CONNECT) * 0.16;
            ctx.strokeStyle = `rgba(34,169,92,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Nodes.
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.pulse
          ? "rgba(94,234,212,0.9)"
          : "rgba(110,231,168,0.6)";
        ctx.fill();
      }
    };

    const loop = () => {
      if (!running) return;
      draw();
      raf = requestAnimationFrame(loop);
    };

    // Run only when on-screen, tab visible, and the user isn't actively
    // scrolling. Pausing during scroll keeps the compositor free, which is what
    // makes iOS Safari scroll smoothly instead of fighting the canvas.
    let visible = true;
    let scrolling = false;
    let scrollTimer = 0;
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
    if (reduce) draw(); // single static frame
    else sync();

    const onResize = () => {
      resize();
      if (reduce) draw();
    };
    window.addEventListener("resize", onResize, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
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
      }, 180);
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
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full animate-fade-in opacity-0"
    />
  );
}
