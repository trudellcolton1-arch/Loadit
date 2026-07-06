import { AppState, type AppStateStatus } from "react-native";
import { startAdvertising, HELLO_PREFIX } from "./pulseBle";
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
let cleanup: (() => void) | null = null;
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

async function arm() {
  if (!current) return;
  cleanup?.();
  cleanup = await startAdvertising(current.handle, {
    onNote: async (payload) => {
      // A reverse-announce ("who I am"), not money — surface the handle and stop.
      if (payload.startsWith(HELLO_PREFIX)) {
        const handle = payload.slice(HELLO_PREFIX.length).replace(/^@/, "").toLowerCase().trim();
        if (handle && handle !== current?.handle.toLowerCase()) {
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
  if (!same) await arm();
  if (!appStateSub) {
    appStateSub = AppState.addEventListener("change", (s: AppStateStatus) => {
      if (s === "active") arm();
    });
  }
}

export async function stopGlobalPresence(): Promise<void> {
  cleanup?.();
  cleanup = null;
  current = null;
  appStateSub?.remove();
  appStateSub = null;
}
