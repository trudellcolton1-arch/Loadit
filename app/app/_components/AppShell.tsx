"use client";

import { useEffect, useState } from "react";
import type { WalletNetworkConfig } from "@/lib/anchor";
import { useWallet } from "./useWallet";
import { Welcome, CreateWallet, RestoreWallet, Unlock, Home, Load, CashOut, Receive, Activity, Settings, Backup, type Screen } from "./screens";
import { Spinner } from "./ui";

type Onboard = "welcome" | "create" | "restore";

export function AppShell({ cfg }: { cfg: WalletNetworkConfig }) {
  const wallet = useWallet(cfg);
  const [onboard, setOnboard] = useState<Onboard>("welcome");
  const [screen, setScreen] = useState<Screen>("home");

  // Return to home whenever the wallet locks so a locked session never resumes mid-flow.
  useEffect(() => {
    if (wallet.vaultState !== "unlocked") setScreen("home");
  }, [wallet.vaultState]);

  let body: React.ReactNode;
  if (wallet.vaultState === "loading") {
    body = <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;
  } else if (wallet.vaultState === "none") {
    body =
      onboard === "create" ? <CreateWallet wallet={wallet} onBack={() => setOnboard("welcome")} onDone={() => setScreen("home")} /> :
      onboard === "restore" ? <RestoreWallet wallet={wallet} onBack={() => setOnboard("welcome")} onDone={() => setScreen("home")} /> :
      <Welcome wallet={wallet} onCreate={() => setOnboard("create")} onRestore={() => setOnboard("restore")} />;
  } else if (wallet.vaultState === "locked") {
    body = <Unlock wallet={wallet} onForget={() => { if (confirm("Forget this wallet on this device? You will need your secret key to restore it.")) void wallet.forgetWallet(); }} />;
  } else {
    const back = () => setScreen("home");
    body =
      screen === "load" ? <Load wallet={wallet} onBack={back} /> :
      screen === "cashout" ? <CashOut wallet={wallet} onBack={back} /> :
      screen === "receive" ? <Receive wallet={wallet} onBack={back} /> :
      screen === "activity" ? <Activity wallet={wallet} onBack={back} /> :
      screen === "settings" ? <Settings wallet={wallet} onBack={back} go={setScreen} /> :
      screen === "backup" ? <Backup wallet={wallet} onDone={() => setScreen("settings")} /> :
      <Home wallet={wallet} go={setScreen} />;
  }

  const showNav = wallet.vaultState === "unlocked";

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] pt-[env(safe-area-inset-top)]">
      <main className="flex-1">{body}</main>
      {showNav && (
        <nav aria-label="Wallet" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-void/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-3">
            {([["home", "Wallet"], ["activity", "Activity"], ["settings", "Settings"]] as [Screen, string][]).map(([s, label]) => {
              const on = screen === s || (s === "home" && ["load", "cashout", "receive"].includes(screen));
              return (
                <button key={s} type="button" onClick={() => setScreen(s)} aria-current={on ? "page" : undefined} className={`flex h-14 flex-col items-center justify-center text-xs font-semibold ${on ? "text-white" : "text-white/45"}`}>
                  <span className={`mb-1 h-1 w-6 rounded-full ${on ? "bg-rail-400" : "bg-transparent"}`} />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
