import { AppState, type AppStateStatus } from "react-native";
import { startAdvertising, startAnnouncer, HELLO_PREFIX } from "./pulseBle";
import { ingestPayload } from "./pulseInbox";
import type { PulseNote } from "./pulseClaim";

/**
 * GLOBAL PULSE PRESENCE — a singleton that keeps this phone discoverable and
 * receiving for as long as the app is running, no matter which screen is open.
 * Incoming notes are ingested into the offline queue and broadcast to any UI
 * listeners so a "+$X arrived" can surface anywhere. Re-arms on foreground.
 */

export interface PulseReceivedEvent {
  amount: number;
  from?: string;
  note: PulseNote;
}

type Listener = (e: PulseReceivedEvent) => void;
type AnnounceListener = (handle: string) => void;

const listeners = new Set<Listener>();
const announceListeners = new Set<AnnounceListener>();
// Handles nearby phones announced to us recently — kept so a Beam screen
// opened AFTER the announce still shows the face immediately.
const announced = new Map<string, number>();
const ANNOUNCE_TTL_MS = 5 * 60_000;
let cleanup: (() => void) | null = null;
let announcerCleanup: (() => void) | null = null;
let current: { handleId: string; handle: string } | null = null;
let appStateSub: { remove: () => void } | null = null;

export function onPulseReceived(cb: Listener): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/**
 * A nearby phone wrote its @handle to us (reverse-announce). Fires globally, so
 * the Beam screen can show WHO is next to you — even for phones whose handle we
 * can't read off the advertisement (iOS discovering Android).
 */
export function onPeerAnnounced(cb: AnnounceListener): () => void {
  announceListeners.add(cb);
  return () => { announceListeners.delete(cb); };
}

/** Handles announced to us in the last few minutes — seed the Beam screen. */
export function announcedPeers(): string[] {
  const now = Date.now();
  const out: string[] = [];
  for (const [h, ts] of announced) {
    if (now - ts < ANNOUNCE_TTL_MS) out.push(h);
    else announced.delete(h);
  }
  return out;
}

async function arm() {
  if (!current) return;
  cleanup?.();
  cleanup = await startAdvertising(current.handle, {
    onNote: async (payload) => {
      // A reverse-announce ("who I am"), not money — surface the handle and stop.
      if (payload.startsWith(HELLO_PREFIX)) {
        const handle = payload.slice(HELLO_PREFIX.length).replace(/^@/, "").toLowerCase().trim();
        if (handle && handle !== "loadit" && handle !== current?.handle.toLowerCase()) {
          announced.set(handle, Date.now());
          announceListeners.forEach((l) => l(handle));
        }
        return;
      }
      const note = await ingestPayload(payload, current!.handleId);
      if (note) listeners.forEach((l) => l({ amount: note.amountUsd, from: note.from.handle, note }));
    },
  });
}

/** Begin being discoverable as this handle. Idempotent; safe to call on login. */
export async function startGlobalPresence(handleId: string, handle: string): Promise<void> {
  const same = current && current.handleId === handleId && current.handle === handle;
  current = { handleId, handle };
  if (!same) {
    await arm();
    // Introduce ourselves to nearby Loadit phones from ANY screen — this is
    // how an iPhone's Beam screen learns about an Android that's just sitting
    // in a pocket (the iPhone can't read the Android; the Android must write).
    announcerCleanup?.();
    announcerCleanup = startAnnouncer(handle);
  }
  if (!appStateSub) {
    appStateSub = AppState.addEventListener("change", (s: AppStateStatus) => {
      if (s === "active") arm();
    });
  }
}

export async function stopGlobalPresence(): Promise<void> {
  cleanup?.();
  cleanup = null;
  announcerCleanup?.();
  announcerCleanup = null;
  current = null;
  appStateSub?.remove();
  appStateSub = null;
}
