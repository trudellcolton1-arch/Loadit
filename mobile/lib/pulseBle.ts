import { Platform, PermissionsAndroid } from "react-native";
import {
  isBleNativeAvailable, startPeripheral, stopPeripheral,
  onNoteReceived, onBleError,
} from "@/modules/pulse-ble";

/**
 * PULSE BLE — cross-platform offline tap (iOS ⇄ Android ⇄ either).
 *
 * The native module (pulse-ble) is the PERIPHERAL: it advertises a shared
 * Loadit service + your @handle and runs a GATT server that receives notes.
 * This file is the CENTRAL, on react-native-ble-plx: it scans for that service
 * to discover nearby Loadit users, and connects + writes a signed note to pay
 * one. Every phone runs both roles, so anyone can find and pay anyone.
 *
 * Robustness (learned the hard way on real hardware):
 *  - wait for the adapter to be PoweredOn before scanning, and (re)start the
 *    scan on every power-on;
 *  - request Android 12+ runtime BLE permissions;
 *  - a queued send waits for its peer to appear and retries on each discovery
 *    instead of giving up the instant Create Pulse is tapped;
 *  - scan with no service filter and match locally (iOS peripherals often put
 *    the service UUID where a filtered scan misses it).
 */

const SERVICE = "F0AD1E00-1985-4C5A-9B11-9E7A10ADD17E";
const SERVICE_KEY = "F0AD1E00";
const HANDLE_CHAR = "F0AD1E01-1985-4C5A-9B11-9E7A10ADD17E";
const NOTE_CHAR = "F0AD1E02-1985-4C5A-9B11-9E7A10ADD17E";
const MTU = 185;
const CHUNK = 150;

/* ---- ble-plx manager (lazy) ---- */
let manager: any = null;
function mgr(): any {
  if (!manager) {
    try {
      const { BleManager } = require("react-native-ble-plx");
      manager = new BleManager();
    } catch {
      manager = null;
    }
  }
  return manager;
}

/* ---- base64 / utf8 (no Buffer in RN) ---- */
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function bytesToBase64(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = i + 1 < bytes.length ? bytes[i + 1] : 0, c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[a >> 2] + B64[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < bytes.length ? B64[((b & 15) << 2) | (c >> 6)] : "=";
    out += i + 2 < bytes.length ? B64[c & 63] : "=";
  }
  return out;
}
function base64ToStr(b64: string): string {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const n = (B64.indexOf(clean[i]) << 18) | (B64.indexOf(clean[i + 1]) << 12) |
      ((i + 2 < clean.length ? B64.indexOf(clean[i + 2]) : 0) << 6) |
      (i + 3 < clean.length ? B64.indexOf(clean[i + 3]) : 0);
    bytes.push((n >> 16) & 0xff);
    if (i + 2 < clean.length && clean[i + 2] !== "=") bytes.push((n >> 8) & 0xff);
    if (i + 3 < clean.length && clean[i + 3] !== "=") bytes.push(n & 0xff);
  }
  return utf8Decode(bytes);
}
function utf8Encode(s: string): number[] {
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
  return out;
}
function utf8Decode(bytes: number[]): string {
  let out = "", i = 0;
  while (i < bytes.length) {
    const b = bytes[i++];
    if (b < 0x80) out += String.fromCharCode(b);
    else if (b < 0xe0) out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i++] & 0x3f));
    else if (b < 0xf0) out += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f));
    else {
      const cp = ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
      const v = cp - 0x10000;
      out += String.fromCharCode(0xd800 + (v >> 10), 0xdc00 + (v & 0x3ff));
    }
  }
  return out;
}

/* ---- android runtime permissions (12+) ---- */
async function ensureAndroidPerms(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  try {
    const P = PermissionsAndroid.PERMISSIONS as any;
    const want = [P.BLUETOOTH_SCAN, P.BLUETOOTH_CONNECT, P.BLUETOOTH_ADVERTISE, P.ACCESS_FINE_LOCATION].filter(Boolean);
    const res = await PermissionsAndroid.requestMultiple(want);
    return Object.values(res).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
  } catch {
    return false;
  }
}

/* ---- discovered peers + pending send (one shared session) ---- */
const peers = new Map<string, { deviceId: string; rssi: number | null }>();
let presenceOnPeer: ((handle: string) => void) | null = null;
let pending: { target: string | null; payload: string; h: PayHandlers; sent: boolean; inFlight: boolean } | null = null;
let scanning = false;
let stateSub: { remove: () => void } | null = null;

function isLoaditDevice(d: any): boolean {
  const uuids: string[] = (d?.serviceUUIDs || []).map((u: string) => String(u).toUpperCase());
  if (uuids.some((u) => u.replace(/-/g, "").includes(SERVICE_KEY))) return true;
  const sd = d?.serviceData;
  if (sd && typeof sd === "object") {
    return Object.keys(sd).some((k) => k.toUpperCase().replace(/-/g, "").includes(SERVICE_KEY));
  }
  return false;
}
function handleFromDevice(d: any): string | null {
  const sd = d?.serviceData;
  if (sd && typeof sd === "object") {
    for (const k of Object.keys(sd)) {
      if (k.toUpperCase().replace(/-/g, "").includes(SERVICE_KEY)) {
        try { const h = base64ToStr(sd[k]).replace(/^@/, "").toLowerCase().trim(); if (h) return h; } catch { /* fall through */ }
      }
    }
  }
  if (d?.localName) { const h = String(d.localName).replace(/^@/, "").toLowerCase().trim(); if (h) return h; }
  return null;
}

const handleReadDone = new Set<string>(); // deviceIds we've read the @handle from

/**
 * BLE adverts are 31 bytes, so the @handle often doesn't fit. When we only have
 * a fallback id for a peer, connect briefly and READ the handle characteristic —
 * reliable on both platforms — then upgrade the peer to its real @handle so the
 * profile + face can resolve.
 */
async function readPeerHandle(deviceId: string, fallbackHandle: string) {
  const m = mgr();
  if (!m || handleReadDone.has(deviceId) || pending) return;
  handleReadDone.add(deviceId);
  try {
    let d = await m.connectToDevice(deviceId, { timeout: 8000 });
    d = await d.discoverAllServicesAndCharacteristics();
    const ch = await d.readCharacteristicForService(SERVICE, HANDLE_CHAR);
    try { await m.cancelDeviceConnection(deviceId); } catch { /* noop */ }
    const real = ch?.value ? base64ToStr(ch.value).replace(/^@/, "").toLowerCase().trim() : "";
    if (real && real !== fallbackHandle) {
      const entry = peers.get(fallbackHandle);
      peers.delete(fallbackHandle);
      peers.set(real, entry || { deviceId, rssi: null });
      presenceOnPeer?.(real);
    }
  } catch {
    handleReadDone.delete(deviceId); // let a later sighting retry
    try { await m.cancelDeviceConnection(deviceId); } catch { /* noop */ }
  }
}

function startScan(myHandle: string) {
  const m = mgr();
  if (!m || scanning) return;
  scanning = true;
  try {
    // Scan FOR the Loadit service UUID. iOS all-but-ignores a nil-filter scan
    // (it returned nothing → iPhone couldn't find anyone); Android is fine either
    // way. A filtered hit IS a Loadit peer, and iOS often omits serviceUUIDs from
    // a filtered result, so we do NOT re-gate on isLoaditDevice here.
    m.startDeviceScan([SERVICE], { allowDuplicates: true }, (err: any, d: any) => {
      if (err || !d) return;
      const handle = handleFromDevice(d) || `peer-${String(d.id).slice(-4)}`;
      if (handle === myHandle.toLowerCase()) return;
      const known = peers.has(handle);
      peers.set(handle, { deviceId: d.id, rssi: d.rssi ?? null });
      if (!known && presenceOnPeer) presenceOnPeer(handle);
      // If we only got a fallback id, read the real @handle over GATT (once).
      if (handle.startsWith("peer-")) readPeerHandle(d.id, handle);
      driveSend(handle, d.id);
    });
  } catch {
    scanning = false;
  }
}
function stopScan() {
  const m = mgr();
  try { m?.stopDeviceScan(); } catch { /* noop */ }
  scanning = false;
}

/** When a peer we're waiting to pay appears, connect + write the note. */
async function driveSend(handle: string, deviceId: string) {
  if (!pending || pending.sent || pending.inFlight) return;
  if (pending.target !== null && pending.target !== handle) return;
  const m = mgr();
  if (!m) return;
  pending.inFlight = true;
  const p = pending;
  try {
    stopScan();
    p.h.onStatus("Connecting…");
    let device = await m.connectToDevice(deviceId, { requestMTU: MTU });
    device = await device.discoverAllServicesAndCharacteristics();
    p.h.onStatus("Connected — sending…");
    const raw = utf8Encode(p.payload + "\n");
    for (let i = 0; i < raw.length; i += CHUNK) {
      await device.writeCharacteristicWithResponseForService(SERVICE, NOTE_CHAR, bytesToBase64(raw.slice(i, i + CHUNK)));
    }
    p.sent = true;
    p.h.onSent();
    try { await m.cancelDeviceConnection(deviceId); } catch { /* noop */ }
  } catch {
    p.inFlight = false;
    p.h.onStatus(p.target ? `Reconnecting to @${p.target}…` : "Move closer — retrying…");
    if (!p.sent) startScan(handleForScan); // rediscover and retry
  }
}

let handleForScan = "loadit";

export function tapAvailable(): boolean {
  return isBleNativeAvailable() && !!mgr();
}

export interface AdvertiseHandlers {
  onNote: (payload: string) => void;
  onError?: (m: string) => void;
}

/**
 * ADVERTISE (app-level): be discoverable and run the GATT server that receives
 * notes — whenever the app is running, not just on the Pulse screen. This is why
 * "if they have Loadit, it finds them" works: every logged-in phone is a live
 * Pulse target. Owns the single native peripheral.
 */
export async function startAdvertising(handle: string, h: AdvertiseHandlers): Promise<() => void> {
  const subNote = onNoteReceived(({ payload }) => h.onNote(payload));
  const subErr = onBleError(({ message }) => h.onError?.(message));
  await ensureAndroidPerms();
  try { await startPeripheral(handle); } catch { /* best-effort */ }
  return () => {
    subNote?.remove(); subErr?.remove();
    stopPeripheral().catch(() => {});
  };
}

export interface ScanHandlers {
  onPeer: (handle: string) => void;
  onLost?: (handle: string) => void;
}

/** SCAN (Beam screen): discover nearby advertising Loadit phones by @handle. */
export async function startScanning(myHandle: string, h: ScanHandlers): Promise<() => void> {
  peers.clear();
  handleReadDone.clear();
  presenceOnPeer = h.onPeer;
  handleForScan = myHandle.toLowerCase();
  await ensureAndroidPerms();
  const m = mgr();
  if (m) {
    stateSub = m.onStateChange((state: string) => {
      if (state === "PoweredOn") startScan(myHandle);
      else stopScan();
    }, true);
  }
  return () => {
    stateSub?.remove(); stateSub = null;
    presenceOnPeer = null;
    stopScan();
    peers.clear();
  };
}

export interface PayHandlers {
  onStatus: (s: string) => void;
  onSent: () => void;
  onError: (m: string) => void;
}

/**
 * Queue a send to a discovered peer (@handle) or, with null, the first Loadit
 * phone that appears. Waits for the peer via the live scan and retries on each
 * sighting — so it doesn't give up if the phone isn't found the same instant.
 */
export async function armSend(target: string | null, payload: string, h: PayHandlers): Promise<() => void> {
  if (!mgr()) { h.onError("Bluetooth isn't available on this phone."); return () => {}; }
  const key = target?.replace(/^@/, "").toLowerCase() ?? null;
  pending = { target: key, payload, h, sent: false, inFlight: false };
  h.onStatus(key ? `Looking for @${key}…` : "Holding for a nearby phone…");
  // If the peer is already in range, go immediately; otherwise (re)start the scan.
  if (key) {
    const e = peers.get(key);
    if (e) driveSend(key, e.deviceId); else startScan(handleForScan);
  } else {
    const first = [...peers.entries()][0];
    if (first) driveSend(first[0], first[1].deviceId); else startScan(handleForScan);
  }
  return () => { pending = null; };
}

export const bleTapPlatform = Platform.OS;
