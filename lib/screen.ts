/**
 * SANCTIONS SCREENING — two sources, one verdict.
 *
 * 1. Chainalysis free oracle (if CHAINALYSIS_SANCTIONS_API_KEY is set) — a
 *    single hosted endpoint that answers "is this address sanctioned?".
 * 2. OFAC SDN direct (no key, no signup, always available) — screens against
 *    the U.S. Treasury OFAC list of sanctioned digital-currency addresses. We
 *    pull the authoritative list (a daily-updated machine-readable mirror of
 *    OFAC's SDN "Digital Currency Address" entries), cache it, and check
 *    membership. This is the SAME list Chainalysis's free tool wraps — so
 *    screening is live and truthful whether or not any vendor ever calls back.
 *
 * Posture: we ONLY ever block on a confirmed match. If the oracle is down and
 * the OFAC list can't be loaded either, we return checked:false and let the
 * caller proceed — a data-source outage must never freeze a legit payment.
 */

const SANCTIONS_API = "https://public.chainalysis.com/api/v1/address/";
const TIMEOUT_MS = 4000;
const LIST_TTL_MS = 24 * 60 * 60 * 1000; // refresh the OFAC list once a day

/**
 * Authoritative OFAC SDN digital-currency address lists (per chain), served as
 * plain JSON arrays of address strings. Override the base or chain set via env
 * if you ever want to point at your own mirror. Chains chosen to cover every
 * asset Loadit moves (USDC, SOL, BTC, ETH, BNB) plus the common stablecoin
 * rails sanctioned addresses actually show up on.
 */
const OFAC_BASE =
  process.env.OFAC_ADDRESS_LIST_BASE ||
  "https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists";
const OFAC_CHAINS = (process.env.OFAC_ADDRESS_CHAINS || "ETH,BSC,XBT,SOL,USDC,USDT,TRX")
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

export type ScreenSource = "chainalysis" | "ofac" | "none";

export interface Identification {
  category?: string;
  name?: string;
  description?: string;
  url?: string;
}

export interface ScreenResult {
  /** Did we actually get an answer from a source? */
  checked: boolean;
  /** True ONLY on a confirmed sanctions match. */
  sanctioned: boolean;
  categories: string[];
  identifications: Identification[];
  /** Which source answered (or "none" if nothing could be reached). */
  source: ScreenSource;
  /** Human label for the screening vendor/source. */
  vendor: string;
  reason?: string;
}

// ── OFAC list cache (per warm serverless instance) ──────────────────────────
let ofacSet: Set<string> | null = null;
let ofacLoadedAt = 0;
let ofacLoading: Promise<Set<string> | null> | null = null;

/** Normalize for matching: EVM (0x…) addresses are case-insensitive. */
function norm(addr: string): string {
  const a = addr.trim();
  return a.startsWith("0x") ? a.toLowerCase() : a;
}

async function fetchChainList(chain: string): Promise<string[]> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(`${OFAC_BASE}/sanctioned_addresses_${chain}.json`, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? data.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Load + cache the union of OFAC sanctioned addresses across the tracked chains. */
async function loadOfacSet(): Promise<Set<string> | null> {
  const now = Date.now();
  if (ofacSet && now - ofacLoadedAt < LIST_TTL_MS) return ofacSet;
  if (ofacLoading) return ofacLoading;

  ofacLoading = (async () => {
    const lists = await Promise.all(OFAC_CHAINS.map(fetchChainList));
    const total = lists.reduce((n, l) => n + l.length, 0);
    if (total === 0) {
      // Nothing loaded — keep any stale set we already had rather than wiping it.
      return ofacSet;
    }
    const set = new Set<string>();
    for (const list of lists) for (const a of list) set.add(norm(a));
    ofacSet = set;
    ofacLoadedAt = Date.now();
    return set;
  })();

  try {
    return await ofacLoading;
  } finally {
    ofacLoading = null;
  }
}

function empty(source: ScreenSource, vendor: string, reason?: string): ScreenResult {
  return { checked: false, sanctioned: false, categories: [], identifications: [], source, vendor, reason };
}

/** Screen against Chainalysis's hosted oracle. */
async function screenChainalysis(address: string, key: string): Promise<ScreenResult> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(SANCTIONS_API + encodeURIComponent(address), {
      headers: { "X-API-Key": key, Accept: "application/json" },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return empty("chainalysis", "Chainalysis", `oracle_${res.status}`);

    const data = (await res.json()) as { identifications?: Identification[] };
    const ids = Array.isArray(data.identifications) ? data.identifications : [];
    const categories = Array.from(
      new Set(ids.map((i) => String(i?.category || "").trim()).filter(Boolean))
    );
    return {
      checked: true,
      sanctioned: ids.length > 0,
      categories,
      identifications: ids.map((i) => ({ category: i?.category, name: i?.name, description: i?.description, url: i?.url })),
      source: "chainalysis",
      vendor: "Chainalysis",
    };
  } catch {
    return empty("chainalysis", "Chainalysis", "oracle_unreachable");
  }
}

/** Screen against the OFAC SDN sanctioned-address list. */
async function screenOfac(address: string): Promise<ScreenResult> {
  const set = await loadOfacSet();
  if (!set) return empty("ofac", "OFAC SDN List", "list_unavailable");

  const hit = set.has(norm(address));
  return {
    checked: true,
    sanctioned: hit,
    categories: hit ? ["sanctions"] : [],
    identifications: hit
      ? [{
          category: "sanctions",
          name: "OFAC SDN",
          description: "Address is on the U.S. Treasury OFAC Specially Designated Nationals (SDN) list.",
          url: "https://sanctionssearch.ofac.treas.gov/",
        }]
      : [],
    source: "ofac",
    vendor: "OFAC SDN List",
  };
}

/** Screening is always available — Chainalysis when keyed, OFAC direct otherwise. */
export function screeningConfigured(): boolean {
  return true;
}

/** The active screening vendor label (for status/UI). */
export function screeningVendor(): string {
  return process.env.CHAINALYSIS_SANCTIONS_API_KEY ? "Chainalysis" : "OFAC SDN List";
}

/** Screen a single wallet address. Prefers Chainalysis when keyed; else OFAC. */
export async function screenAddress(address: string): Promise<ScreenResult> {
  const clean = (address || "").trim();
  if (!clean) return empty("none", screeningVendor(), "empty_address");

  const key = process.env.CHAINALYSIS_SANCTIONS_API_KEY;
  if (key) {
    const r = await screenChainalysis(clean, key);
    // If the paid oracle didn't actually answer, fall back to OFAC so a
    // Chainalysis hiccup still gives us a real screen rather than nothing.
    if (r.checked) return r;
    const fallback = await screenOfac(clean);
    return fallback.checked ? fallback : r;
  }
  return screenOfac(clean);
}
