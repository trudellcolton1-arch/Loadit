/**
 * Shared auth + JSON helpers for the public AERO / HQ HTTP API
 * (`/api/v1/route`, `/api/v1/transfers/:id`, `/api/v1/ledger/balances`).
 *
 * Same key rules as the original /api/v1/route handler: `demo` always works
 * (rate-limited), static keys from AERO_API_KEYS, signed `lk_…` keys via
 * verifyApiKey. Extracted so read endpoints keep the exact same gate.
 */
import { NextResponse } from "next/server";
import { verifyApiKey } from "./apiKeys";

export const AERO_CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function rateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > limit;
}

function validKeys(): Set<string> {
  const env = (process.env.AERO_API_KEYS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set(["demo", ...env]);
}

export function aeroJson(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: AERO_CORS });
}

export interface AeroAuthOk {
  ok: true;
  key: string;
  plan: string;
  isDemo: boolean;
}

export interface AeroAuthFail {
  ok: false;
  response: NextResponse;
}

export function authorizeAeroApi(req: Request, params: Record<string, unknown> = {}): AeroAuthOk | AeroAuthFail {
  const queryKey = new URL(req.url).searchParams.get("key") || "";
  const key = (req.headers.get("x-api-key") || (params.key as string) || queryKey || "").trim();
  if (!key) {
    return {
      ok: false,
      response: aeroJson(
        {
          ok: false,
          error: "missing_api_key",
          message: "Provide an API key via the x-api-key header or ?key=. Use 'demo' to try it.",
        },
        401
      ),
    };
  }
  const signed = verifyApiKey(key);
  if (!validKeys().has(key) && !signed) {
    return { ok: false, response: aeroJson({ ok: false, error: "invalid_api_key" }, 401) };
  }
  const isDemo = key === "demo";
  const plan = signed?.plan ?? (isDemo ? "demo" : "static");
  if (rateLimited(key, isDemo ? 30 : 600)) {
    return {
      ok: false,
      response: aeroJson(
        {
          ok: false,
          error: "rate_limited",
          message: isDemo
            ? "Demo key is limited to 30 req/min. Request a production key for higher limits."
            : "Rate limit exceeded.",
        },
        429
      ),
    };
  }
  return { ok: true, key, plan, isDemo };
}
