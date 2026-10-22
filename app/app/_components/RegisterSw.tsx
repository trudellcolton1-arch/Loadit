"use client";

import { useEffect } from "react";

/** Registers the wallet's service worker (scope /app). No-op where unsupported. */
export function RegisterSw() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/app-sw.js", { scope: "/app" }).catch(() => undefined);
  }, []);
  return null;
}
