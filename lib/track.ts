/** Fire-and-forget funnel event. Uses sendBeacon when available, never throws. */
export function track(event: string, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({ event, ...data });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

/** Fetch live network fees (USD per network) for use as computeRoute overrides. */
export async function fetchLiveFees(): Promise<{
  fees: Record<string, number>;
  live: boolean;
} | null> {
  try {
    const r = await fetch("/api/fees");
    if (!r.ok) return null;
    const d = await r.json();
    return { fees: d.fees ?? {}, live: Boolean(d.live) };
  } catch {
    return null;
  }
}
