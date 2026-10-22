/**
 * Passphrase vault for the browser wallet.
 *
 * The Stellar secret seed is encrypted on the device with AES-256-GCM under a
 * key derived from the user's passphrase (PBKDF2-SHA256, 600k iterations) and
 * stored as an opaque blob. Loadit's servers never see the seed, the
 * passphrase, or the derived key. Pure WebCrypto; works in browsers and Node.
 */

export interface VaultBlob {
  v: 1;
  kdf: "PBKDF2-SHA256";
  iter: number;
  /** base64 */
  salt: string;
  /** base64 */
  iv: string;
  /** base64 ciphertext (includes the GCM tag) */
  ct: string;
  /** The public key, kept in the clear so the wallet can show the address while locked. */
  pub: string;
  createdAt: string;
}

export const VAULT_ITERATIONS = 600_000;
export const MIN_PASSPHRASE_LENGTH = 8;

type CryptoLike = { subtle: SubtleCrypto; getRandomValues: <T extends ArrayBufferView | null>(a: T) => T };

function cryptoImpl(c?: CryptoLike): CryptoLike {
  const g = c ?? (globalThis.crypto as CryptoLike | undefined);
  if (!g || !g.subtle) throw new Error("WebCrypto is not available");
  return g;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

export function toB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(c: CryptoLike, passphrase: string, salt: Uint8Array, iter: number): Promise<CryptoKey> {
  const base = await c.subtle.importKey("raw", enc.encode(passphrase.normalize("NFKC")), "PBKDF2", false, ["deriveKey"]);
  return c.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: iter, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export function passphraseProblem(p: string): string | null {
  if (p.length < MIN_PASSPHRASE_LENGTH) return `Use at least ${MIN_PASSPHRASE_LENGTH} characters.`;
  if (/^(.)\1+$/.test(p)) return "Pick something less repetitive.";
  if (/^(0123456789|1234567890|password|qwertyuiop)/i.test(p)) return "That one is too easy to guess.";
  return null;
}

/** Encrypt a Stellar secret seed (S...) under a passphrase. */
export async function sealSecret(secret: string, passphrase: string, pub: string, c?: CryptoLike): Promise<VaultBlob> {
  const cr = cryptoImpl(c);
  const salt = cr.getRandomValues(new Uint8Array(16));
  const iv = cr.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(cr, passphrase, salt, VAULT_ITERATIONS);
  const ct = new Uint8Array(await cr.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, enc.encode(secret)));
  return { v: 1, kdf: "PBKDF2-SHA256", iter: VAULT_ITERATIONS, salt: toB64(salt), iv: toB64(iv), ct: toB64(ct), pub, createdAt: new Date().toISOString() };
}

/** Decrypt the seed. Throws "wrong_passphrase" on a bad passphrase or tampered blob. */
export async function openSecret(blob: VaultBlob, passphrase: string, c?: CryptoLike): Promise<string> {
  const cr = cryptoImpl(c);
  if (blob.v !== 1 || blob.kdf !== "PBKDF2-SHA256") throw new Error("unsupported_vault");
  const key = await deriveKey(cr, passphrase, fromB64(blob.salt), blob.iter);
  try {
    const pt = await cr.subtle.decrypt({ name: "AES-GCM", iv: fromB64(blob.iv) as BufferSource }, key, fromB64(blob.ct) as BufferSource);
    return dec.decode(pt);
  } catch {
    throw new Error("wrong_passphrase");
  }
}
