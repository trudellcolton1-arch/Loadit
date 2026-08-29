import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { loadSession, signOut as doSignOut, probeHylaqSession, type Session } from "./auth";

/**
 * Server-verified state of the current Hylaq session.
 *
 * - "none":     no session, or a guest session.
 * - "checking": a Hylaq session exists but the backend hasn't confirmed it
 *               yet (also where "unknown" probe results stay). Gated surfaces
 *               treat this as NOT signed in — fail closed.
 * - "linked":   token verified and an @handle is linked. The ONLY state in
 *               which owner/founder-gated tiles may render.
 * - "unlinked": token verified but no @handle — show sign-in affordances,
 *               never gated tiles.
 *
 * A "dead" probe (token resolves to no Hylaq account) never becomes a status:
 * the stale session is cleared and the status drops to "none".
 */
export type HylaqStatus = "none" | "checking" | "linked" | "unlinked";

interface AuthCtx {
  session: Session | null;
  ready: boolean;
  hylaqStatus: HylaqStatus;
  setSession: (s: Session | null) => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  ready: false,
  hylaqStatus: "none",
  setSession: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [hylaqStatus, setHylaqStatus] = useState<HylaqStatus>("none");
  // Monotonic guard: a probe result only lands if no newer session replaced it.
  const probeSeq = useRef(0);

  const verify = (s: Session) => {
    const seq = probeSeq.current;
    setHylaqStatus("checking");
    probeHylaqSession(s).then((verdict) => {
      if (seq !== probeSeq.current) return; // superseded by a newer session
      if (verdict === "linked") {
        setHylaqStatus("linked");
      } else if (verdict === "unlinked") {
        setHylaqStatus("unlinked");
      } else if (verdict === "dead") {
        // Logged out of Hylaq (revoked/expired token): clear the stale session
        // so the app drops to signed-out instead of impersonating the owner.
        doSignOut().finally(() => {
          if (seq !== probeSeq.current) return;
          setSessionState(null);
          setHylaqStatus("none");
        });
      }
      // "unknown" (network/server trouble) stays "checking": gated tiles
      // remain hidden, but nobody is signed out over a flaky connection.
    });
  };

  const applySession = (s: Session | null) => {
    probeSeq.current += 1;
    setSessionState(s);
    if (s?.kind === "hylaq") verify(s);
    else setHylaqStatus("none");
  };

  useEffect(() => {
    loadSession().then((s) => {
      applySession(s);
      setReady(true);
    });
    return () => {
      probeSeq.current += 1; // cancel any in-flight probe on unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    probeSeq.current += 1;
    await doSignOut();
    setSessionState(null);
    setHylaqStatus("none");
  };

  return (
    <Ctx.Provider value={{ session, ready, hylaqStatus, setSession: applySession, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
