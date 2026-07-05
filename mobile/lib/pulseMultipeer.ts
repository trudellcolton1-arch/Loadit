import { Platform } from "react-native";
import * as MP from "@/modules/pulse-multipeer";

/**
 * PULSE TAP — offline phone-to-phone handoff over MultipeerConnectivity.
 *
 * `hostNote` (sender) advertises and, the instant a peer connects, pushes the
 * signed note. `receiveNote` (receiver) browses, auto-invites the first Loadit
 * peer it sees, and surfaces the note when it arrives. Both return a cleanup
 * function that tears the session down. If the native module isn't present the
 * caller should fall back to QR (`tapAvailable()` tells you up front).
 */

export function tapAvailable(): boolean {
  // iOS ships MultipeerConnectivity; Android tap lands with the Nearby module.
  return Platform.OS === "ios" && MP.isMultipeerAvailable();
}

export interface HostHandlers {
  onStatus: (s: string) => void;
  onSent: () => void;
  onError: (m: string) => void;
}

/** Sender: advertise, then beam the payload the moment a phone connects. */
export async function hostNote(displayName: string, payload: string, h: HostHandlers): Promise<() => void> {
  let delivered = false;
  const subs = [
    MP.onPeerStateChange(({ peer, state }) => {
      if (state === "connecting") h.onStatus(`Pairing with ${peer}…`);
      else if (state === "connected" && !delivered) {
        h.onStatus(`Connected — sending…`);
        MP.sendNote(payload).then((ok) => {
          if (ok) { delivered = true; h.onSent(); }
          else h.onError("Couldn't hand it over. Try again.");
        });
      }
    }),
    MP.onError(({ message }) => h.onError(message)),
  ];
  await MP.start(displayName);
  await MP.advertise();
  h.onStatus("Hold the phones together…");
  return () => { subs.forEach((s) => s?.remove()); MP.stop(); };
}

export interface PresenceHandlers {
  /** A nearby Loadit phone appeared, identified by its @handle (peer name). */
  onPeer: (handle: string) => void;
  onLost: (handle: string) => void;
  /** Someone paid us over the same session. */
  onNote: (payload: string) => void;
  onError?: (m: string) => void;
}

/**
 * Presence: be discoverable AND discover others at once. Every phone on the
 * Pulse screen advertises its @handle and browses for peers, so nearby Loadit
 * users show up (with their Hylaq profile, resolved by @handle) before anyone
 * connects. No auto-invite here — a connection only forms when you choose to
 * pay someone, so a discovered peer is just a face, not a transfer.
 */
export async function startPresence(myHandle: string, h: PresenceHandlers): Promise<() => void> {
  const subs = [
    MP.onPeerFound(({ peer }) => h.onPeer(peer)),
    MP.onPeerLost(({ peer }) => h.onLost(peer)),
    MP.onReceiveNote(({ payload }) => h.onNote(payload)),
    MP.onError(({ message }) => h.onError?.(message)),
  ];
  await MP.start(myHandle);
  await MP.advertise();
  await MP.browse();
  return () => { subs.forEach((s) => s?.remove()); MP.stop(); };
}

export interface PayHandlers {
  onStatus: (s: string) => void;
  onSent: () => void;
  onError: (m: string) => void;
}

/**
 * Pay a specific discovered peer: invite just them (they auto-accept) and send
 * the note the moment they connect — so only the person you picked gets paid.
 * Requires an active presence session. Returns a cleanup for its listener.
 */
export async function payPeer(targetHandle: string, payload: string, h: PayHandlers): Promise<() => void> {
  let sent = false;
  const sub = MP.onPeerStateChange(({ peer, state }) => {
    if (state === "connecting" && peer === targetHandle) h.onStatus(`Connecting to @${targetHandle}…`);
    else if (state === "connected" && peer === targetHandle && !sent) {
      h.onStatus("Connected — sending…");
      MP.sendNote(payload).then((ok) => {
        if (ok) { sent = true; h.onSent(); }
        else h.onError("Couldn't hand it over. Try again.");
      });
    }
  });
  await MP.invite(targetHandle);
  h.onStatus(`Reaching @${targetHandle}…`);
  return () => sub?.remove();
}

/**
 * Arm a send over the ALREADY-RUNNING presence session (does not start/stop it).
 * With a target, invite just that peer and send on their connect; with no
 * target, send to the first phone that connects (the "hold them together" open
 * beam). Returns a cleanup that removes the listener.
 */
export async function armSend(target: string | null, payload: string, h: PayHandlers): Promise<() => void> {
  let sent = false;
  const sub = MP.onPeerStateChange(({ peer, state }) => {
    if (state === "connecting" && (target === null || peer === target)) h.onStatus("Pairing…");
    else if (state === "connected" && !sent && (target === null || peer === target)) {
      h.onStatus("Connected — sending…");
      MP.sendNote(payload).then((ok) => {
        if (ok) { sent = true; h.onSent(); }
        else h.onError("Couldn't hand it over. Try again.");
      });
    }
  });
  if (target) { await MP.invite(target); h.onStatus(`Reaching @${target}…`); }
  else h.onStatus("Hold the phones together…");
  return () => sub?.remove();
}

export interface ReceiveHandlers {
  onStatus: (s: string) => void;
  onNote: (payload: string) => void;
  onError: (m: string) => void;
}

/** Receiver: browse, auto-invite the first Loadit peer, surface the note. */
export async function receiveNote(displayName: string, h: ReceiveHandlers): Promise<() => void> {
  let got = false;
  const subs = [
    MP.onPeerFound(({ peer }) => { h.onStatus(`Found ${peer} — connecting…`); MP.invite(peer); }),
    MP.onPeerStateChange(({ state }) => {
      if (state === "connected") h.onStatus("Connected — waiting for the money…");
    }),
    MP.onReceiveNote(({ payload }) => { if (!got) { got = true; h.onNote(payload); } }),
    MP.onError(({ message }) => h.onError(message)),
  ];
  await MP.start(displayName);
  await MP.browse();
  h.onStatus("Looking for a nearby Loadit…");
  return () => { subs.forEach((s) => s?.remove()); MP.stop(); };
}
