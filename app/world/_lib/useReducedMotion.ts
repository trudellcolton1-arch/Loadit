"use client";

import { useEffect, useState } from "react";

/**
 * Hydration-safe reduced-motion preference. framer-motion's useReducedMotion
 * reads the media query during the first client render, which disagrees with
 * the server's markup and throws hydration errors for visitors who prefer
 * reduced motion. This starts false (matching the server) and updates after
 * mount, so the switch happens as a normal re-render.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduce;
}
