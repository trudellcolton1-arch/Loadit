import React, { createContext, useContext, useEffect, useState } from "react";
import { loadSession, signOut as doSignOut, hylaqSessionDead, type Session } from "./auth";

interface AuthCtx {
  session: Session | null;
  ready: boolean;
  setSession: (s: Session | null) => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  ready: false,
  setSession: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadSession().then((s) => {
      if (!mounted) return;
      setSession(s);
      setReady(true);
      // Validate a stored Hylaq session in the background: if the user logged
      // out of Hylaq (token revoked/expired), drop to signed-out so gated
      // surfaces disappear. App start is never blocked on this check, and a
      // network failure never signs anyone out.
      if (s?.kind === "hylaq") {
        hylaqSessionDead(s).then((dead) => {
          if (!dead || !mounted) return;
          doSignOut().finally(() => {
            if (mounted) setSession(null);
          });
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const signOut = async () => {
    await doSignOut();
    setSession(null);
  };

  return <Ctx.Provider value={{ session, ready, setSession, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
