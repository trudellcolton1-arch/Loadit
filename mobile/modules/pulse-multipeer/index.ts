import { requireNativeModule, EventEmitter } from "expo-modules-core";

/**
 * JS bridge for the PulseMultipeer native module. Degrades gracefully: if the
 * native module isn't linked (e.g. Expo Go, or a build without it), every call
 * is a safe no-op and `isMultipeerAvailable()` returns false so the UI falls
 * back to the QR transport.
 */

type Sub = { remove: () => void } | null;

let Native: any = null;
try {
  Native = requireNativeModule("PulseMultipeer");
} catch {
  Native = null;
}

const emitter = Native ? new EventEmitter(Native) : null;

export function isMultipeerAvailable(): boolean {
  return !!Native;
}

function listen(event: string, cb: (e: any) => void): Sub {
  return emitter ? emitter.addListener(event, cb) : null;
}

export const onPeerFound = (cb: (e: { peer: string }) => void): Sub => listen("onPeerFound", cb);
export const onPeerLost = (cb: (e: { peer: string }) => void): Sub => listen("onPeerLost", cb);
export const onPeerStateChange = (cb: (e: { peer: string; state: "connecting" | "connected" | "disconnected" }) => void): Sub =>
  listen("onPeerStateChange", cb);
export const onReceiveNote = (cb: (e: { payload: string }) => void): Sub => listen("onReceiveNote", cb);
export const onError = (cb: (e: { message: string }) => void): Sub => listen("onError", cb);

export async function start(displayName: string): Promise<void> {
  if (Native) await Native.start(displayName);
}
export async function advertise(): Promise<void> {
  if (Native) await Native.advertise();
}
export async function browse(): Promise<void> {
  if (Native) await Native.browse();
}
export async function invite(peer: string): Promise<void> {
  if (Native) await Native.invite(peer);
}
export async function sendNote(payload: string): Promise<boolean> {
  return Native ? Boolean(await Native.sendNote(payload)) : false;
}
export async function stop(): Promise<void> {
  if (Native) await Native.stop();
}
