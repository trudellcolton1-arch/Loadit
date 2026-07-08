import { NextResponse } from "next/server";

/**
 * Best-effort in-memory rate limiter shared across API routes.
 *
 * On serverless this counts per warm instance, not globally — it won't stop a
 * distributed flood, but it decisively caps a single abuser hammering one
 * endpoint (the realistic "someone found /api/ask and is draining the OpenAI
 * budget" case). Move to Redis/Upstash for hard global limits.
 */
const WINDOW_MS = 60_000;
const buckets = new Map<string, number[]>();

/** Returns true if `key` has exceeded `limit` requests in the last minute. */
export function rateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  buckets.set(key, arr);
  // Opportunistic cleanup so the map can't grow unbounded across many IPs.
  if (buckets.size > 5000) {
    buckets.forEach((v: number[], k: string) => {
      if (v.every((t) => now - t >= WINDOW_MS)) buckets.delete(k);
    });
  }
  return arr.length > limit;
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Guard a route: returns a 429 response if the caller (by IP + bucket name) is
 * over `limit`/min, or null to proceed. Usage:
 *   const limited = limit(req, "ask", 20); if (limited) return limited;
 */
export function limit(req: Request, bucket: string, perMinute: number): NextResponse | null {
  if (rateLimited(`${bucket}:${clientIp(req)}`, perMinute)) {
    return NextResponse.json(
      { ok: false, reason: "rate_limited" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  return null;
}
