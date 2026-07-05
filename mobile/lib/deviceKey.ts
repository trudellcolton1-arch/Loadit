import "react-native-get-random-values";
import { p256 } from "@noble/curves/p256";
import { sha256 } from "@noble/hashes/sha256";
import * as SecureStore from "expo-secure-store";

/**
 * DEVICE KEY — the identity that signs offline Pulse claim packets.
 *
 * An ECDSA P-256 keypair whose private key lives in the iOS Keychain / Android
 * Keystore (via expo-secure-store) and never leaves the device; only the public
 * key (base64 SPKI) is registered with Hylaq. Signatures are DER, base64.
 *
 * keyOrigin here is "keystore" (Keychain-backed). Hardware Secure Enclave keys
 * are a native upgrade that scores higher on the server; the wire format is the
 * same, so that swap is transparent.
 */

const PRIV_KEY = "loadit_pulse_privkey_hex";

/* ---- encodings (no Buffer/btoa in RN) ---- */

function bytesToHex(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0");
  return s;
}
function hexToBytes(h: string): Uint8Array {
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
}
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function bytesToBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = i + 1 < bytes.length ? bytes[i + 1] : 0, c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[a >> 2] + B64[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < bytes.length ? B64[((b & 15) << 2) | (c >> 6)] : "=";
    out += i + 2 < bytes.length ? B64[c & 63] : "=";
  }
  return out;
}
function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, "");
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const n =
      (B64.indexOf(clean[i]) << 18) |
      (B64.indexOf(clean[i + 1]) << 12) |
      ((i + 2 < clean.length ? B64.indexOf(clean[i + 2]) : 0) << 6) |
      (i + 3 < clean.length ? B64.indexOf(clean[i + 3]) : 0);
    out.push((n >> 16) & 0xff);
    if (i + 2 < clean.length && clean[i + 2] !== "=") out.push((n >> 8) & 0xff);
    if (i + 3 < clean.length && clean[i + 3] !== "=") out.push(n & 0xff);
  }
  return new Uint8Array(out);
}
function utf8(s: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else if (c >= 0xd800 && c <= 0xdbff) {
      c = 0x10000 + ((c & 0x3ff) << 10) + (s.charCodeAt(++i) & 0x3ff);
      out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return new Uint8Array(out);
}

/* ---- keys ---- */

async function getOrCreatePrivateKey(): Promise<Uint8Array> {
  let hex = await SecureStore.getItemAsync(PRIV_KEY);
  if (!hex) {
    hex = bytesToHex(p256.utils.randomPrivateKey());
    await SecureStore.setItemAsync(PRIV_KEY, hex);
  }
  return hexToBytes(hex);
}

/** SPKI DER prefix for an ECDSA P-256 uncompressed public key. */
const SPKI_PREFIX = hexToBytes("3059301306072a8648ce3d020106082a8648ce3d030107034200");

/** base64 SPKI of the device public key — what Hylaq registers. */
export async function publicKeySpkiBase64(): Promise<string> {
  const priv = await getOrCreatePrivateKey();
  const pub = p256.getPublicKey(priv, false); // 65-byte uncompressed (0x04||X||Y)
  const spki = new Uint8Array(SPKI_PREFIX.length + pub.length);
  spki.set(SPKI_PREFIX, 0);
  spki.set(pub, SPKI_PREFIX.length);
  return bytesToBase64(spki);
}

/** Sign a message (sha256 → ECDSA P-256), returning a base64 DER signature. */
export async function signBase64(message: string): Promise<string> {
  const priv = await getOrCreatePrivateKey();
  const hash = sha256(utf8(message));
  const sig = p256.sign(hash, priv);
  return bytesToBase64(sig.toDERRawBytes());
}

/**
 * Verify a base64 DER signature over `message` against a base64 SPKI public key
 * — the receiving phone runs this fully offline to trust a beamed claim before
 * queueing it. Returns false on any malformed input rather than throwing.
 */
export function verifyBase64(message: string, sigB64: string, spkiB64: string): boolean {
  try {
    const spki = base64ToBytes(spkiB64);
    const pub = spki.slice(SPKI_PREFIX.length); // trailing 65-byte uncompressed key
    if (pub.length !== 65 || pub[0] !== 0x04) return false;
    const hash = sha256(utf8(message));
    const sig = p256.Signature.fromDER(base64ToBytes(sigB64)).toCompactRawBytes();
    return p256.verify(sig, hash, pub);
  } catch {
    return false;
  }
}
