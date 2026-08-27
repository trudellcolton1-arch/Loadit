import crypto from "crypto";

/**
 * Founder/Gunna gate for the MoneyGram practice status read.
 *
 * Accepts GUNNA_LOADIT_STATUS_SECRET, falling back to PRACTICE_KEY (the same
 * key that unlocks /practice). Never logs the secret or the provided value.
 */

export function isQueryFlagEnabled(searchParams: URLSearchParams, name: string): boolean {
  if (!searchParams.has(name)) return false;
  const v = (searchParams.get(name) || "").trim().toLowerCase();
  if (v === "" || v === "1" || v === "true" || v === "yes") return true;
  return false;
}

export function statusGateSecret(): string | null {
  const gunna = (process.env.GUNNA_LOADIT_STATUS_SECRET || "").trim();
  if (gunna) return gunna;
  const practice = (process.env.PRACTICE_KEY || "").trim();
  return practice || null;
}

export function extractProvidedSecret(req: Request): string {
  const url = new URL(req.url);
  const headerAuth = req.headers.get("authorization") || "";
  const bearer = /^bearer\s+/i.test(headerAuth) ? headerAuth.replace(/^bearer\s+/i, "").trim() : "";
  return (
    bearer ||
    (req.headers.get("x-gunna-secret") || "").trim() ||
    (req.headers.get("x-loadit-status-secret") || "").trim() ||
    (url.searchParams.get("key") || "").trim() ||
    (url.searchParams.get("secret") || "").trim()
  );
}

function sha256(s: string): Buffer {
  return crypto.createHash("sha256").update(s).digest();
}

/** Constant-time compare via SHA-256 so length differences don't leak. */
export function secretsMatch(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  try {
    return crypto.timingSafeEqual(sha256(provided), sha256(expected));
  } catch {
    return false;
  }
}

export type StatusAuth =
  | { ok: true }
  | { ok: false; status: 401 | 503; reason: "unauthorized" | "gate_unconfigured" };

export function authorizeStatusRead(req: Request): StatusAuth {
  const expected = statusGateSecret();
  if (!expected) return { ok: false, status: 503, reason: "gate_unconfigured" };
  const provided = extractProvidedSecret(req);
  if (!provided || !secretsMatch(provided, expected)) {
    return { ok: false, status: 401, reason: "unauthorized" };
  }
  return { ok: true };
}
