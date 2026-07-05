import { requireNativeModule, EventEmitter } from "expo-modules-core";

/**
 * JS bridge for PulseBle — the cross-platform BLE PERIPHERAL side (advertise a
 * shared Loadit service + @handle, run a GATT server that receives note writes).
 * The CENTRAL side (scan + connect + write) is done with react-native-ble-plx
 * in lib/pulseBle.ts. Degrades to no-ops if the native module isn't linked.
 */

type Sub = { remove: () => void } | null;

let Native: any = null;
try {
  Native = requireNativeModule("PulseBle");
} catch {
  Native = null;
}

const emitter = Native ? new EventEmitter(Native) : null;

export function isBleNativeAvailable(): boolean {
  return !!Native;
}

export function onNoteReceived(cb: (e: { payload: string }) => void): Sub {
  return emitter ? emitter.addListener("onNoteReceived", cb) : null;
}
export function onBleError(cb: (e: { message: string }) => void): Sub {
  return emitter ? emitter.addListener("onError", cb) : null;
}

/** Advertise this @handle + start the GATT server that receives notes. */
export async function startPeripheral(handle: string): Promise<void> {
  if (Native) await Native.startPeripheral(handle);
}
export async function stopPeripheral(): Promise<void> {
  if (Native) await Native.stopPeripheral();
}
