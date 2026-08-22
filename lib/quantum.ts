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
 *  - calibration comes from hq_quantum_batch, where every row is a COMPLETED
 *    job on IBM quantum hardware (backend + job id stored, auditable). With no
 *    batch, receipts say "classical-v1" — never an invented run.
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

/* ---------- QAOA calibration batch (written by HQ's nightly quantum job) ---------- */
export interface QuantumBatch {
  batchNo: number;
  weights: Record<string, number>;
  backend: string;
  jobId: string;
  shots: number;
  ranAt: string;
}
let cachedBatch: { value: QuantumBatch | null; at: number } | null = null;
const BATCH_TTL_MS = 10 * 60 * 1000;

/** Latest real quantum calibration batch, or null. Every row in
 *  hq_quantum_batch corresponds to a completed job on IBM hardware (the HQ
 *  cron writes nothing on failure), so a non-null batch is auditable via its
 *  IBM job id. Cached 10 min; failures fall back to null (classical). */
export async function getLatestBatch(): Promise<QuantumBatch | null> {
  if (cachedBatch && Date.now() - cachedBatch.at < BATCH_TTL_MS) return cachedBatch.value;
  try {
    const rows = await dbQuery<Record<string, unknown>>(
      `select batch_no, weights, backend, job_id, shots, ran_at
       from hq_quantum_batch order by batch_no desc limit 1`
    );
    const r = rows[0];
    const value: QuantumBatch | null = r
      ? {
          batchNo: Number(r.batch_no),
          weights: (typeof r.weights === "string" ? JSON.parse(r.weights) : r.weights) as Record<string, number>,
          backend: String(r.backend),
          jobId: String(r.job_id),
          shots: Number(r.shots),
          ranAt: String(r.ran_at),
        }
      : null;
    cachedBatch = { value, at: Date.now() };
    return value;
  } catch {
    cachedBatch = { value: null, at: Date.now() };
    return null;
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
  /** Present when a real quantum calibration batch existed at signing time —
   *  backend + IBM job id make it independently auditable. */
  batch: { no: number; backend: string; jobId: string; shots: number; weights: Record<string, number> } | null;
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
    const batch = await getLatestBatch();
    const calibration = batch
      ? `QAOA batch #${batch.batchNo} · ${batch.backend} · job ${batch.jobId} · ${batch.shots} shots`
      : "classical-v1 (QAOA batch pending)";
    const fp = publicKeyFingerprint()!;
    const id = crypto.randomBytes(6).toString("hex"); // 12-char public id

    const payload: ReceiptPayload = {
      v: 1, id, ts: new Date().toISOString(), statement,
      quote: quoteSummary, entropy: ent, calibration,
      batch: batch ? { no: batch.batchNo, backend: batch.backend, jobId: batch.jobId, shots: batch.shots, weights: batch.weights } : null,
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

/** Most recent receipt id — lets /quantum link to a live, checkable example. */
export async function getLatestReceiptId(): Promise<string | null> {
  try {
    const rows = await dbQuery<{ id: string }>(
      `select id from loadit_quantum_receipt order by created_at desc limit 1`
    );
    return rows[0]?.id ?? null;
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
