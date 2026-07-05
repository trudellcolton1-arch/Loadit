import { useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { getMyHandle } from "@/lib/api";
import { tapAvailable } from "@/lib/pulseBle";
import { startGlobalPresence, stopGlobalPresence } from "@/lib/pulsePresence";

/**
 * Mounted once at the app root: as soon as you're logged in with a Hylaq handle,
 * this makes the phone a live Pulse target over Bluetooth — discoverable and
 * ready to receive money on any screen. Renders nothing.
 */
export function PulsePresence() {
  const { session, ready } = useAuth();

  useEffect(() => {
    let active = true;
    if (ready && session && tapAvailable()) {
      getMyHandle(session.accessToken)
        .then((r) => {
          if (active && r.linked && r.profile) {
            startGlobalPresence(r.profile.id, r.profile.handle);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
      stopGlobalPresence();
    };
  }, [ready, session]);

  return null;
}
