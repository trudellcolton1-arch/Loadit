import crypto from "node:crypto";
import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";

/**
 * QUANTUM RECEIPTS — Phase 1 of HQ Quantum Routing.
 *
 * Every quote's best-price receipt is sealed with ML-DSA-65 — the NIST
 * post-quantum signature standard (FIPS 204) — so the receipt stays verifiable
 * even against a future quantum adversary ("harvest now, decrypt later"
 * resistance). Receipts are stored in a Loadit-owned table
 * (loadit_quantum_receipt) and publicly checkable at /verify/<id>.
 *
 * Honesty contract (never overclaim):
 *  - signature.alg is exactly what we use: ML-DSA-65.
 *  - entropy.source states truthfully where the nonce came from: the HQ
 *    quantum-entropy endpoint when configured (HQ_ENTROPY_URL), otherwise the
 *    OS CSPRNG, labeled as such.
 *  - calibration reports "classical-v1" until the Phase-2 QAOA batch job is
 *    live — the receipt never invents a quantum batch that didn't run.
 *  - Signing failures NEVER break a quote: callers get null and the quote
 *    flows unsigned.
 */

const SIG_ALG = "ML-DSA-65";

export interface QuantumEntropy {
  nonce: string; // hex
  source: "hq-qrng" | "csprng";
}

export interface QuantumReceipt {
  id: string;
  url: string;
  alg: typeof SIG_ALG;
  pubkeyFp: string;
  entropy: QuantumEntropy["source"];
  calibration: string;
}

/* ---------- keys ---------- */
interface KeyPair { publicKey: Uint8Array; secretKey: Uint8Array }
let cachedKeys: KeyPair | null = null;

function keys(): KeyPair | null {
  if (cachedKeys) return cachedKeys;
  const seedHex = process.env.LOADIT_MLDSA_SEED;
  if (!seedHex || !/^[0-9a-f]{64}$/i.test(seedHex)) return null;
  cachedKeys = ml_dsa65.keygen(Buffer.from(seedHex, "hex"));
  return cachedKeys;
}

export function quantumConfigured(): boolean {
  return Boolean(keys());
}

export function publicKeyB64(): string | null {
  const k = keys();
  return k ? Buffer.from(k.publicKey).toString("base64") : null;
}

export function publicKeyFingerprint(): string | null {
  const k = keys();
  if (!k) return null;
  return crypto.createHash("sha256").update(k.publicKey).digest("hex").slice(0, 16);
}

/* ---------- entropy ---------- */
/** Nonce for a receipt: HQ's quantum-entropy endpoint when live, else CSPRNG —
 *  the source is recorded truthfully either way. */
async function entropyNonce(): Promise<QuantumEntropy> {
  const url = process.env.HQ_ENTROPY_URL;
  if (url) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 1500);
      const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
      clearTimeout(timer);
      if (res.ok) {
        const data = (await res.json()) as { hex?: string };
        if (data.hex && /^[0-9a-f]{16,128}$/i.test(data.hex)) {
          return { nonce: data.hex.toLowerCase(), source: "hq-qrng" };
        }
      }
    } catch {
      /* fall through to CSPRNG — never block a quote on entropy */
    }
  }
  return { nonce: crypto.randomBytes(16).toString("hex"), source: "csprng" };
}

/* ---------- receipt store (Loadit-owned table in HQ's Neon) ---------- */
function dbUrl(): string | undefined {
  return process.env.HQ_CONTENT_DATABASE_URL || process.env.HYLAQ_DATABASE_URL;
}

async function dbQuery<T = Record<string, unknown>>(query: string, params: unknown[] = []): Promise<T[]> {
  const conn = dbUrl();
  if (!conn) throw new Error("receipt db not configured");
  const host = new URL(conn.replace(/^postgres(ql)?:\/\//, "https://")).hostname;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://${host}/sql`, {
      method: "POST",
      headers: { "Neon-Connection-String": conn, "Content-Type": "application/json" },
      body: JSON.stringify({ query, params }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`receipt db ${res.status}`);
    const data = (await res.json()) as { rows?: T[] };
    return data.rows ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

/* ---------- sign + store ---------- */
export interface ReceiptPayload {
  v: 1;
  id: string;
  ts: string;
  statement: string;
  quote: Record<string, unknown>;
  entropy: QuantumEntropy;
  calibration: string;
  signer: { alg: typeof SIG_ALG; pubkeyFp: string };
}

/** Sign and store a best-price receipt. Returns null on ANY failure — a
 *  signing or storage hiccup must never break the quote itself. */
export async function sealReceipt(
  quoteSummary: Record<string, unknown>,
  statement: string
): Promise<QuantumReceipt | null> {
  try {
    const k = keys();
    if (!k) return null;
    const ent = await entropyNonce();
    const calibration = process.env.QUANTUM_BATCH_ID || "classical-v1 (QAOA batch pending)";
    const fp = publicKeyFingerprint()!;
    const id = crypto.randomBytes(6).toString("hex"); // 12-char public id

    const payload: ReceiptPayload = {
      v: 1, id, ts: new Date().toISOString(), statement,
      quote: quoteSummary, entropy: ent, calibration,
      signer: { alg: SIG_ALG, pubkeyFp: fp },
    };
    // The EXACT string below is what gets signed and what gets stored (text
    // column, never jsonb — Postgres jsonb normalizes key order and would
    // silently break byte-exact verification).
    const signedText = JSON.stringify(payload);
    const sig = ml_dsa65.sign(Buffer.from(signedText, "utf8"), k.secretKey);

    await dbQuery(
      `insert into loadit_quantum_receipt (id, payload, sig, pubkey_fp) values ($1, $2, $3, $4)
       on conflict (id) do nothing`,
      [id, signedText, Buffer.from(sig).toString("base64"), fp]
    );

    return { id, url: `https://loadit.net/verify/${id}`, alg: SIG_ALG, pubkeyFp: fp, entropy: ent.source, calibration };
  } catch {
    return null;
  }
}

/* ---------- fetch + verify ---------- */
export interface VerifiedReceipt {
  id: string;
  payload: ReceiptPayload;
  sigB64: string;
  pubkeyB64: string;
  valid: boolean;
  createdAt: string | null;
}

export async function getReceipt(id: string): Promise<VerifiedReceipt | null> {
  const clean = (id || "").trim().toLowerCase();
  if (!/^[0-9a-f]{8,16}$/.test(clean)) return null;
  try {
    const rows = await dbQuery<{ payload: string; sig: string; created_at?: string }>(
      `select payload, sig, created_at from loadit_quantum_receipt where id = $1 limit 1`,
      [clean]
    );
    if (!rows.length) return null;
    const raw = rows[0];
    const signedText = String(raw.payload); // exact bytes that were signed
    const payload = JSON.parse(signedText) as ReceiptPayload;
    const k = keys();
    let valid = false;
    if (k) {
      valid = ml_dsa65.verify(Buffer.from(raw.sig, "base64"), Buffer.from(signedText, "utf8"), k.publicKey);
    }
    return {
      id: clean, payload, sigB64: raw.sig,
      pubkeyB64: publicKeyB64() || "", valid,
      createdAt: raw.created_at ? String(raw.created_at) : null,
    };
  } catch {
    return null;
  }
}
