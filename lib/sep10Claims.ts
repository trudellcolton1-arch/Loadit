/**
 * Decode a SEP-10 JWT payload without verifying it.
 *
 * Used only to report whether the anchor put `client_domain` / `client_name`
 * in the token. The raw JWT is never returned or logged.
 */

export interface Sep10JwtClaims {
  client_domain: string | null;
  client_name: string | null;
  iss: string | null;
  sub: string | null;
  iat: number | null;
  exp: number | null;
  /** Top-level payload keys, so a missing claim is visible without guessing. */
  claim_keys: string[];
}

function strClaim(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function numClaim(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Decode a compact JWT's payload. Returns empty claims on any parse failure. */
export function decodeSep10JwtClaims(token: string): Sep10JwtClaims {
  const empty: Sep10JwtClaims = {
    client_domain: null,
    client_name: null,
    iss: null,
    sub: null,
    iat: null,
    exp: null,
    claim_keys: [],
  };
  if (!token || typeof token !== "string") return empty;
  const parts = token.split(".");
  if (parts.length < 2) return empty;
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(json) as Record<string, unknown>;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return empty;
    return {
      client_domain: strClaim(payload.client_domain),
      client_name: strClaim(payload.client_name),
      iss: strClaim(payload.iss),
      sub: strClaim(payload.sub),
      iat: numClaim(payload.iat),
      exp: numClaim(payload.exp),
      claim_keys: Object.keys(payload).sort(),
    };
  } catch {
    return empty;
  }
}
