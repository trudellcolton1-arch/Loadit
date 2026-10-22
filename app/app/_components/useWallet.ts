"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WalletNetworkConfig } from "@/lib/anchor";
import type { Sep24Tx } from "@/app/api/anchor/sep24/route";
import { sealSecret, openSecret, type VaultBlob } from "@/lib/wallet/vault";
import { kvGet, kvSet, kvDel, requestPersistence, KEYS } from "@/lib/wallet/store";
import { sdk, fetchAccount, usdcLine, usdcBalance, xlmBalance, spareXlm, addUsdcTrustline, sendUsdc, signChallenge, type HorizonAccount, type PaymentArgs } from "@/lib/wallet/stellar";

/**
 * All wallet state for the app shell. The decrypted seed lives only in a ref
 * while unlocked and is wiped on lock, on idle timeout, and when the tab is
 * hidden for long. Everything that touches the network is a plain fetch to
 * Loadit's thin proxies or straight to Horizon.
 */

export type VaultState = "loading" | "none" | "locked" | "unlocked";

export interface ActivityItem {
  id: string;
  kind: "deposit" | "withdrawal";
  startedAt: string;
  amount?: string;
  url?: string;
}

const AUTOLOCK_MS = 10 * 60 * 1000;

function jwtExp(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

export function useWallet(cfg: WalletNetworkConfig) {
  const [vaultState, setVaultState] = useState<VaultState>("loading");
  const [vault, setVault] = useState<VaultBlob | null>(null);
  const secretRef = useRef<string | null>(null);
  const [account, setAccount] = useState<HorizonAccount | null>(null);
  const [accountChecked, setAccountChecked] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const tokenRef = useRef<{ token: string; exp: number } | null>(null);
  const lockTimer = useRef<number | null>(null);

  // ---- boot
  useEffect(() => {
    let alive = true;
    (async () => {
      const blob = await kvGet<VaultBlob>(KEYS.vault);
      const acts = (await kvGet<ActivityItem[]>(KEYS.activity)) || [];
      if (!alive) return;
      setActivity(acts);
      if (blob) {
        setVault(blob);
        setVaultState("locked");
      } else {
        setVaultState("none");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const publicKey = vault?.pub ?? null;

  // ---- lock / unlock
  const lock = useCallback(() => {
    secretRef.current = null;
    tokenRef.current = null;
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
    setVaultState((s) => (s === "unlocked" ? "locked" : s));
  }, []);

  const touch = useCallback(() => {
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
    lockTimer.current = window.setTimeout(lock, AUTOLOCK_MS);
  }, [lock]);

  useEffect(() => {
    if (vaultState !== "unlocked") return;
    const onVis = () => {
      if (document.visibilityState === "hidden") touch();
    };
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart"];
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    document.addEventListener("visibilitychange", onVis);
    touch();
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener("visibilitychange", onVis);
      if (lockTimer.current) window.clearTimeout(lockTimer.current);
    };
  }, [vaultState, touch]);

  const unlock = useCallback(
    async (passphrase: string) => {
      if (!vault) throw new Error("no_vault");
      const secret = await openSecret(vault, passphrase); // throws wrong_passphrase
      secretRef.current = secret;
      setVaultState("unlocked");
    },
    [vault]
  );

  const createWallet = useCallback(async (passphrase: string) => {
    const S = await sdk();
    const kp = S.Keypair.random();
    const blob = await sealSecret(kp.secret(), passphrase, kp.publicKey());
    await kvSet(KEYS.vault, blob);
    void requestPersistence();
    secretRef.current = kp.secret();
    setVault(blob);
    setVaultState("unlocked");
    return kp.publicKey();
  }, []);

  const restoreWallet = useCallback(async (secret: string, passphrase: string) => {
    const S = await sdk();
    const kp = S.Keypair.fromSecret(secret.trim()); // throws on invalid
    const blob = await sealSecret(kp.secret(), passphrase, kp.publicKey());
    await kvSet(KEYS.vault, blob);
    void requestPersistence();
    secretRef.current = kp.secret();
    setVault(blob);
    setVaultState("unlocked");
    return kp.publicKey();
  }, []);

  const forgetWallet = useCallback(async () => {
    secretRef.current = null;
    tokenRef.current = null;
    await kvDel(KEYS.vault);
    await kvDel(KEYS.activity);
    setVault(null);
    setAccount(null);
    setActivity([]);
    setVaultState("none");
  }, []);

  /** Reveal the secret for backup. Requires the passphrase again even while unlocked. */
  const revealSecret = useCallback(
    async (passphrase: string) => {
      if (!vault) throw new Error("no_vault");
      return openSecret(vault, passphrase);
    },
    [vault]
  );

  const requireSecret = useCallback((): string => {
    const s = secretRef.current;
    if (!s) throw new Error("locked");
    return s;
  }, []);

  // ---- account / balances
  const refreshAccount = useCallback(async () => {
    if (!publicKey) return null;
    try {
      const a = await fetchAccount(cfg.horizon, publicKey);
      setAccount(a);
      return a;
    } finally {
      setAccountChecked(true);
    }
  }, [cfg.horizon, publicKey]);

  useEffect(() => {
    if (!publicKey) return;
    void refreshAccount();
  }, [publicKey, refreshAccount]);

  const balances = useMemo(
    () => ({
      exists: Boolean(account),
      usdc: usdcBalance(account, cfg.usdcIssuer),
      hasUsdcLine: Boolean(usdcLine(account, cfg.usdcIssuer)),
      xlm: xlmBalance(account),
      spareXlm: spareXlm(account),
    }),
    [account, cfg.usdcIssuer]
  );

  const activate = useCallback(async () => {
    if (!publicKey) throw new Error("no_wallet");
    const res = await fetch("/api/wallet/activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account: publicKey }) });
    const data = (await res.json()) as { ok: boolean; reason?: string; message?: string; already?: boolean };
    if (!data.ok) throw new Error(data.message || data.reason || "activate_failed");
    // Horizon may lag a moment behind the funding transaction.
    for (let i = 0; i < 6; i++) {
      const a = await refreshAccount();
      if (a) return a;
      await new Promise((r) => setTimeout(r, 1500));
    }
    return refreshAccount();
  }, [publicKey, refreshAccount]);

  const enableUsdc = useCallback(async () => {
    const secret = requireSecret();
    await addUsdcTrustline(cfg, secret);
    return refreshAccount();
  }, [cfg, requireSecret, refreshAccount]);

  const pay = useCallback(
    async (args: PaymentArgs) => {
      const secret = requireSecret();
      const r = await sendUsdc(cfg, secret, args);
      void refreshAccount();
      return r;
    },
    [cfg, requireSecret, refreshAccount]
  );

  // ---- SEP-10
  const auth = useCallback(async (): Promise<string> => {
    const cached = tokenRef.current;
    if (cached && cached.exp - Date.now() > 60_000) return cached.token;
    if (!publicKey) throw new Error("no_wallet");
    const secret = requireSecret();
    const chRes = await fetch(`/api/anchor/auth?account=${encodeURIComponent(publicKey)}`, { cache: "no-store" });
    const ch = (await chRes.json()) as { ok: boolean; transaction?: string; network_passphrase?: string; reason?: string; message?: string };
    if (!ch.ok || !ch.transaction) throw new Error(ch.message || ch.reason || "auth_failed");
    const signed = await signChallenge(ch.transaction, ch.network_passphrase || cfg.passphrase, secret);
    const tokRes = await fetch("/api/anchor/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transaction: signed }) });
    const tok = (await tokRes.json()) as { ok: boolean; token?: string; reason?: string; message?: string };
    if (!tok.ok || !tok.token) throw new Error(tok.message || tok.reason || "auth_failed");
    tokenRef.current = { token: tok.token, exp: jwtExp(tok.token) || Date.now() + 10 * 60 * 1000 };
    return tok.token;
  }, [publicKey, cfg.passphrase, requireSecret]);

  // ---- SEP-24
  const sep24Start = useCallback(
    async (op: "deposit" | "withdraw", amount?: number) => {
      if (!publicKey) throw new Error("no_wallet");
      const token = await auth();
      const res = await fetch("/api/anchor/sep24", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ op, account: publicKey, amount }),
      });
      const data = (await res.json()) as { ok: boolean; id?: string; url?: string; reason?: string; message?: string };
      if (res.status === 401) tokenRef.current = null;
      if (!data.ok || !data.id || !data.url) throw new Error(data.message || data.reason || "start_failed");
      const item: ActivityItem = { id: data.id, kind: op === "deposit" ? "deposit" : "withdrawal", startedAt: new Date().toISOString(), amount: amount ? String(amount) : undefined, url: data.url };
      const next = [item, ...activity.filter((a) => a.id !== item.id)].slice(0, 100);
      setActivity(next);
      void kvSet(KEYS.activity, next);
      return { id: data.id, url: data.url };
    },
    [publicKey, auth, activity]
  );

  const sep24Status = useCallback(
    async (id: string): Promise<Sep24Tx | null> => {
      const token = await auth();
      const res = await fetch(`/api/anchor/sep24?id=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (res.status === 401) {
        tokenRef.current = null;
        return null;
      }
      const data = (await res.json()) as { ok: boolean; transaction?: Sep24Tx };
      return data.ok && data.transaction ? data.transaction : null;
    },
    [auth]
  );

  const sep24List = useCallback(async (): Promise<Sep24Tx[]> => {
    const token = await auth();
    const res = await fetch("/api/anchor/sep24?list=1", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (res.status === 401) tokenRef.current = null;
    const data = (await res.json()) as { ok: boolean; transactions?: Sep24Tx[] };
    return data.ok && data.transactions ? data.transactions : [];
  }, [auth]);

  return {
    cfg,
    vaultState,
    publicKey,
    account,
    accountChecked,
    balances,
    activity,
    createWallet,
    restoreWallet,
    unlock,
    lock,
    forgetWallet,
    revealSecret,
    refreshAccount,
    activate,
    enableUsdc,
    pay,
    auth,
    sep24Start,
    sep24Status,
    sep24List,
  };
}

export type Wallet = ReturnType<typeof useWallet>;
