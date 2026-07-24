/**
 * SANCTIONS SCREENING — Chainalysis free crypto-sanctions oracle.
 *
 * A single public endpoint that answers "is this wallet address on a
 * government sanctions list?" (OFAC SDN and international equivalents). It's
 * free — you just register for a key at
 *   https://go.chainalysis.com/crypto-sanctions-screening.html
 * and set CHAINALYSIS_SANCTIONS_API_KEY in Vercel. No transaction data leaves
 * Loadit beyond the address being checked.
 *
 * Posture: we ONLY ever block on a confirmed positive identification. If the
 * key isn't set, or the oracle is slow/unreachable, we return checked:false and
 * let the caller proceed — an outage at Chainalysis must never freeze a legit
 * user's payment. That keeps the "sanctions screening program in place"
 * attestation honest without turning a third-party hiccup into a wallet freeze.
 */

const SANCTIONS_API = "https://public.chainalysis.com/api/v1/address/";
const TIMEOUT_MS = 4000;

export interface Identification {
  category?: string;
  name?: string;
  description?: string;
  url?: string;
}

export interface ScreenResult {
  /** Did we actually get an answer from the oracle? */
  checked: boolean;
  /** True ONLY on a positive sanctions identification. */
  sanctioned: boolean;
  /** Distinct categories returned (e.g. ["sanctions"]). */
  categories: string[];
  identifications: Identification[];
  /** Whether a screening key is configured at all. */
  configured: boolean;
  reason?: string;
}

/** True when a Chainalysis key is set, so the "yes, we screen" toggle is honest. */
export function screeningConfigured(): boolean {
  return Boolean(process.env.CHAINALYSIS_SANCTIONS_API_KEY);
}

/** Screen a single wallet address against the sanctions oracle. */
export async function screenAddress(address: string): Promise<ScreenResult> {
  const key = process.env.CHAINALYSIS_SANCTIONS_API_KEY;
  const base: ScreenResult = {
    checked: false,
    sanctioned: false,
    categories: [],
    identifications: [],
    configured: Boolean(key),
  };

  const clean = (address || "").trim();
  if (!key) return { ...base, reason: "not_configured" };
  if (!clean) return { ...base, reason: "empty_address" };

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(SANCTIONS_API + encodeURIComponent(clean), {
      headers: { "X-API-Key": key, Accept: "application/json" },
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return { ...base, reason: `oracle_${res.status}` };

    const data = (await res.json()) as { identifications?: Identification[] };
    const ids = Array.isArray(data.identifications) ? data.identifications : [];
    const categories = Array.from(
      new Set(ids.map((i) => String(i?.category || "").trim()).filter(Boolean))
    );

    return {
      checked: true,
      sanctioned: ids.length > 0,
      categories,
      identifications: ids.map((i) => ({
        category: i?.category,
        name: i?.name,
        description: i?.description,
        url: i?.url,
      })),
      configured: true,
    };
  } catch {
    return { ...base, reason: "oracle_unreachable" };
  }
}
