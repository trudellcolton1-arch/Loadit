import React, { createContext, useContext, useEffect, useState } from "react";
import { loadSession, signOut as doSignOut, type Session } from "./auth";

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
    loadSession().then((s) => {
      setSession(s);
      setReady(true);
    });
  }, []);

  const signOut = async () => {
    await doSignOut();
    setSession(null);
  };

  return <Ctx.Provider value={{ session, ready, setSession, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
