"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Wallet } from "./useWallet";
import { Btn, Card, Field, Label, Notice, Pill, Row, Spinner, TopBar, inputCls } from "./ui";
import { TxStatus } from "./TxStatus";
import { passphraseProblem } from "@/lib/wallet/vault";
import { fmtUsd, shortAddr } from "@/lib/wallet/stellar";
import type { Sep24Tx } from "@/app/api/anchor/sep24/route";

/* ------------------------------------------------------------------ onboarding */

export function Welcome({ wallet, onCreate, onRestore }: { wallet: Wallet; onCreate: () => void; onRestore: () => void }) {
  const test = wallet.cfg.network === "testnet";
  return (
    <div className="flex min-h-[80vh] flex-col justify-between gap-8 py-6">
      <div>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/loadit-mark.png" alt="" width={40} height={40} />
          <span className="text-lg font-semibold text-white">Loadit</span>
          {test && <Pill tone="test">Test mode</Pill>}
        </div>
        <h1 className="mt-10 text-balance text-4xl font-semibold leading-[1.05] tracking-tightest text-gradient">Cash in. USDC out. Your keys.</h1>
        <p className="mt-5 text-pretty text-base leading-relaxed text-white/60">
          Hand cash to a licensed counter and receive USDC in a wallet only you control. Cash out the same way. Loadit never holds your money.
        </p>
        <ul className="mt-8 grid gap-3 text-sm text-white/70">
          {[
            ["Non-custodial", "The key is created on this device and encrypted with your passphrase. Loadit cannot move your funds or recover your passphrase."],
            ["Licensed cash network", "Cash is taken and paid out at MoneyGram locations. They verify identity at the counter."],
            ["Nothing hidden", "Fees are shown by the cash network before you confirm. Every step has a status you can check."],
          ].map(([k, v]) => (
            <li key={k} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="font-semibold text-white">{k}</div>
              <div className="mt-1 text-white/55">{v}</div>
            </li>
          ))}
        </ul>
        {test && (
          <div className="mt-5">
            <Notice tone="warn">Test mode: this build runs on the Stellar test network with test USDC. No real money moves. The live network switches on with the production release.</Notice>
          </div>
        )}
      </div>
      <div className="grid gap-2">
        <Btn onClick={onCreate}>Create a wallet</Btn>
        <Btn tone="secondary" onClick={onRestore}>I have a secret key</Btn>
        <p className="mt-2 text-center text-[11px] text-white/35">
          By continuing you agree to the <a href="/privacy" className="underline">privacy policy</a>. Loadit is software; the cash network is the licensed money transmitter.
        </p>
      </div>
    </div>
  );
}

export function CreateWallet({ wallet, onBack, onCreated }: { wallet: Wallet; onBack: () => void; onCreated: (passphrase: string) => void }) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const problem = passphraseProblem(p1);

  const create = async () => {
    setErr(null);
    if (problem) return setErr(problem);
    if (p1 !== p2) return setErr("The two passphrases do not match.");
    setBusy(true);
    try {
      // The shell shows the backup screen before the wallet home once this resolves.
      onCreated(p1);
      await wallet.createWallet(p1);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "create_failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <TopBar title="Create a wallet" onBack={onBack} />
      <p className="mt-2 text-sm leading-relaxed text-white/60">
        Choose a passphrase. It encrypts your key on this device. <span className="text-white">If you forget it, nobody can reset it</span> — you would need the secret key backup you are about to receive.
      </p>
      <div className="mt-6 grid gap-4">
        <Field label="Passphrase" hint="At least 8 characters. A short sentence works well.">
          <input className={inputCls} type="password" autoComplete="new-password" value={p1} onChange={(e) => setP1(e.target.value)} />
        </Field>
        <Field label="Repeat passphrase">
          <input className={inputCls} type="password" autoComplete="new-password" value={p2} onChange={(e) => setP2(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void create()} />
        </Field>
        {err && <Notice tone="error">{err}</Notice>}
        <Btn onClick={create} disabled={busy || !p1 || !p2}>{busy ? <Spinner /> : null} Create wallet</Btn>
      </div>
    </div>
  );
}

export function Backup({ wallet, passphrase, onDone, firstTime = false }: { wallet: Wallet; passphrase?: string; onDone: () => void; firstTime?: boolean }) {
  const [pass, setPass] = useState(passphrase || "");
  const [secret, setSecret] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ack, setAck] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (passphrase) void reveal(passphrase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reveal(p: string) {
    setErr(null);
    try {
      setSecret(await wallet.revealSecret(p));
    } catch {
      setErr("Wrong passphrase.");
    }
  }

  return (
    <div>
      <TopBar title={firstTime ? "Back up your key" : "Secret key"} onBack={firstTime ? undefined : onDone} />
      <Notice tone="warn">
        This secret key <span className="font-semibold">is</span> your wallet. Anyone who has it can spend your funds. Write it down and keep it offline. Loadit never sees it and cannot recover it.
      </Notice>
      {!secret ? (
        <div className="mt-5 grid gap-3">
          <Field label="Enter your passphrase to reveal">
            <input className={inputCls} type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} />
          </Field>
          {err && <Notice tone="error">{err}</Notice>}
          <Btn onClick={() => void reveal(pass)} disabled={!pass}>Reveal</Btn>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          <Card>
            <Label>Secret key (keep private)</Label>
            <div className="mt-2 break-all font-mono text-[13px] leading-relaxed text-amber-200">{secret}</div>
          </Card>
          <Card>
            <Label>Public address (safe to share)</Label>
            <div className="mt-2 break-all font-mono text-[13px] leading-relaxed text-white/80">{wallet.publicKey}</div>
          </Card>
          <Btn tone="secondary" onClick={async () => { try { await navigator.clipboard.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ } }}>
            {copied ? "Copied" : "Copy secret key"}
          </Btn>
          {firstTime && (
            <>
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 p-4 text-sm text-white/70">
                <input type="checkbox" className="mt-0.5 h-4 w-4" checked={ack} onChange={(e) => setAck(e.target.checked)} />
                <span>I have written down my secret key and understand that Loadit cannot recover my wallet.</span>
              </label>
              <Btn onClick={onDone} disabled={!ack}>Continue to my wallet</Btn>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function RestoreWallet({ wallet, onBack, onDone }: { wallet: Wallet; onBack: () => void; onDone: () => void }) {
  const [secret, setSecret] = useState("");
  const [p1, setP1] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const restore = async () => {
    setErr(null);
    const problem = passphraseProblem(p1);
    if (problem) return setErr(problem);
    setBusy(true);
    try {
      await wallet.restoreWallet(secret, p1);
      onDone();
    } catch {
      setErr("That does not look like a valid Stellar secret key (it starts with S and is 56 characters).");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <TopBar title="Restore a wallet" onBack={onBack} />
      <div className="mt-4 grid gap-4">
        <Field label="Secret key" hint="Starts with S. Paste it only on a device you trust.">
          <textarea className={`${inputCls} min-h-24 font-mono text-[13px]`} value={secret} onChange={(e) => setSecret(e.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        </Field>
        <Field label="New passphrase for this device">
          <input className={inputCls} type="password" autoComplete="new-password" value={p1} onChange={(e) => setP1(e.target.value)} />
        </Field>
        {err && <Notice tone="error">{err}</Notice>}
        <Btn onClick={restore} disabled={busy || !secret || !p1}>{busy ? <Spinner /> : null} Restore</Btn>
      </div>
    </div>
  );
}

export function Unlock({ wallet, onForget }: { wallet: Wallet; onForget: () => void }) {
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const go = async () => {
    setBusy(true);
    setErr(null);
    try {
      await wallet.unlock(pass);
    } catch {
      setErr("Wrong passphrase.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex min-h-[80vh] flex-col justify-center gap-6">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/loadit-mark.png" alt="" width={36} height={36} />
        <div>
          <div className="text-lg font-semibold text-white">Welcome back</div>
          <div className="font-mono text-[11px] text-white/40">{wallet.publicKey ? shortAddr(wallet.publicKey) : ""}</div>
        </div>
        {wallet.cfg.network === "testnet" && <Pill tone="test">Test mode</Pill>}
      </div>
      <Field label="Passphrase">
        <input ref={ref} className={inputCls} type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && pass && void go()} />
      </Field>
      {err && <Notice tone="error">{err}</Notice>}
      <Btn onClick={go} disabled={busy || !pass}>{busy ? <Spinner /> : null} Unlock</Btn>
      <button type="button" onClick={onForget} className="text-center text-xs text-white/40 underline">Forget this wallet on this device</button>
    </div>
  );
}

/* ------------------------------------------------------------------ home */

export function Home({ wallet, go }: { wallet: Wallet; go: (s: Screen) => void }) {
  const { balances, cfg, accountChecked } = wallet;
  const [busy, setBusy] = useState<"activate" | "usdc" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const ready = balances.exists && balances.hasUsdcLine;

  const activate = async () => {
    setBusy("activate");
    setErr(null);
    try {
      await wallet.activate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "activate_failed");
    } finally {
      setBusy(null);
    }
  };
  const enable = async () => {
    setBusy("usdc");
    setErr(null);
    try {
      await wallet.enableUsdc();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "trustline_failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/loadit-mark.png" alt="" width={28} height={28} />
          <span className="font-semibold text-white">Loadit</span>
        </div>
        {cfg.network === "testnet" ? <Pill tone="test">Test mode · no real money</Pill> : <Pill tone="good">Live</Pill>}
      </div>

      <Card tone="accent" className="relative overflow-hidden">
        <Label>USDC balance</Label>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-5xl font-semibold tracking-tightest text-white">{Number(balances.usdc).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="font-mono text-sm text-cyan-glow">USDC</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-white/45">
          <span>{balances.exists ? `${Number(balances.xlm).toFixed(2)} XLM for network fees` : accountChecked ? "Not activated yet" : "Checking…"}</span>
          <button type="button" onClick={() => void wallet.refreshAccount()} className="underline">Refresh</button>
        </div>
      </Card>

      {accountChecked && !balances.exists && (
        <Card tone="warn">
          <div className="font-semibold text-white">Activate your wallet</div>
          <p className="mt-1 text-sm text-white/65">Stellar needs a tiny network reserve before an address can hold anything. {cfg.network === "testnet" ? "In test mode this is free." : "Loadit covers it."} Your key is not involved.</p>
          {!cfg.activationAvailable && <p className="mt-2 text-xs text-amber-200">Activation is not enabled on this network yet.</p>}
          <div className="mt-3"><Btn onClick={activate} disabled={busy !== null || !cfg.activationAvailable}>{busy === "activate" ? <Spinner /> : null} Activate</Btn></div>
        </Card>
      )}
      {balances.exists && !balances.hasUsdcLine && (
        <Card tone="warn">
          <div className="font-semibold text-white">Enable USDC</div>
          <p className="mt-1 text-sm text-white/65">One signed transaction tells the network this wallet accepts USDC. Signed on this device; costs a fraction of a cent in XLM.</p>
          <div className="mt-3"><Btn onClick={enable} disabled={busy !== null || balances.spareXlm < 0.6}>{busy === "usdc" ? <Spinner /> : null} Enable USDC</Btn></div>
          {balances.spareXlm < 0.6 && <p className="mt-2 text-xs text-amber-200">Needs about 0.6 XLM spare for the reserve and fee.</p>}
        </Card>
      )}
      {err && <Notice tone="error">{err}</Notice>}

      <div className="grid grid-cols-2 gap-3">
        <ActionTile title="Load cash" sub="Cash → USDC" onClick={() => go("load")} disabled={!ready} />
        <ActionTile title="Cash out" sub="USDC → cash" onClick={() => go("cashout")} disabled={!ready || Number(balances.usdc) <= 0} />
        <ActionTile title="Receive" sub="Show address" onClick={() => go("receive")} />
        <ActionTile title="Activity" sub="Status of each step" onClick={() => go("activity")} />
      </div>

      <p className="text-center text-[11px] leading-relaxed text-white/35">
        Cash in and out happen at MoneyGram locations, the licensed money transmitter. Loadit is non-custodial software and never holds your funds.
      </p>
    </div>
  );
}

function ActionTile({ title, sub, onClick, disabled }: { title: string; sub: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-40">
      <div className="text-base font-semibold text-white">{title}</div>
      <div className="mt-0.5 text-xs text-white/50">{sub}</div>
    </button>
  );
}

/* ------------------------------------------------------------------ load / cash out */

const AMOUNTS = [20, 50, 100, 250];

function useAnchorInfo() {
  const [info, setInfo] = useState<{ deposit?: Record<string, { enabled?: boolean; fee_fixed?: number; fee_percent?: number; min_amount?: number; max_amount?: number }>; withdraw?: Record<string, { enabled?: boolean; fee_fixed?: number; fee_percent?: number; min_amount?: number; max_amount?: number }> } | null>(null);
  useEffect(() => {
    fetch("/api/anchor/sep24?info=1").then((r) => r.json()).then((d) => d.ok && setInfo(d.info)).catch(() => undefined);
  }, []);
  return info;
}

function feeLine(f?: { fee_fixed?: number; fee_percent?: number; min_amount?: number; max_amount?: number }, amount?: number) {
  if (!f) return "Fee shown by the cash network before you confirm.";
  const parts: string[] = [];
  if (f.fee_fixed) parts.push(fmtUsd(f.fee_fixed));
  if (f.fee_percent) parts.push(`${f.fee_percent}%`);
  const fee = parts.length ? parts.join(" + ") : "shown at the counter";
  const est = amount && (f.fee_fixed || f.fee_percent) ? ` (≈ ${fmtUsd((f.fee_fixed || 0) + amount * ((f.fee_percent || 0) / 100))} on ${fmtUsd(amount)})` : "";
  const lim = f.min_amount || f.max_amount ? ` · limits ${f.min_amount ? fmtUsd(f.min_amount) : "—"} to ${f.max_amount ? fmtUsd(f.max_amount) : "—"}` : "";
  return `Cash network fee: ${fee}${est}${lim}`;
}

export function Load({ wallet, onBack }: { wallet: Wallet; onBack: () => void }) {
  return <RampFlow wallet={wallet} onBack={onBack} op="deposit" />;
}
export function CashOut({ wallet, onBack }: { wallet: Wallet; onBack: () => void }) {
  return <RampFlow wallet={wallet} onBack={onBack} op="withdraw" />;
}

function RampFlow({ wallet, onBack, op }: { wallet: Wallet; onBack: () => void; op: "deposit" | "withdraw" }) {
  const dep = op === "deposit";
  const [amount, setAmount] = useState<number>(dep ? 100 : Math.min(100, Math.floor(Number(wallet.balances.usdc))));
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [started, setStarted] = useState<{ id: string; url: string } | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const info = useAnchorInfo();
  const fees = dep ? info?.deposit?.USDC : info?.withdraw?.USDC;
  const max = dep ? 10_000 : Number(wallet.balances.usdc);
  const effective = custom ? Number(custom) : amount;
  const valid = Number.isFinite(effective) && effective >= 1 && effective <= max;

  const start = async () => {
    if (!valid) return;
    setBusy(true);
    setErr(null);
    // Open the window inside the tap so mobile browsers do not block it.
    const win = window.open("", "_blank");
    try {
      const r = await wallet.sep24Start(op, effective);
      if (win) {
        win.location.href = r.url;
      } else {
        setPopupBlocked(true);
      }
      setStarted(r);
    } catch (e) {
      win?.close();
      setErr(e instanceof Error ? e.message : "start_failed");
    } finally {
      setBusy(false);
    }
  };

  if (started) {
    return (
      <div>
        <TopBar title={dep ? "Load cash" : "Cash out"} onBack={onBack} />
        {popupBlocked && <div className="mb-4"><Notice tone="warn">Your browser blocked the pop-up. Use the button below to open the cash network&rsquo;s page.</Notice></div>}
        <TxStatus wallet={wallet} id={started.id} initialUrl={started.url} onDone={onBack} />
      </div>
    );
  }

  return (
    <div>
      <TopBar title={dep ? "Load cash" : "Cash out"} onBack={onBack} />
      <p className="mt-2 text-sm leading-relaxed text-white/60">
        {dep
          ? "Choose how much cash you will hand over. The cash network opens its own page to take your details and give you a reference number for the counter."
          : "Choose how much USDC to turn into cash. The cash network reserves it, you send the USDC from this wallet, then collect cash at the counter."}
      </p>
      <div className="mt-6 grid grid-cols-4 gap-2">
        {AMOUNTS.map((v) => (
          <button key={v} type="button" onClick={() => { setAmount(v); setCustom(""); }} disabled={v > max} className={`rounded-2xl border px-2 py-3 text-sm font-semibold disabled:opacity-30 ${!custom && amount === v ? "border-rail-400/60 bg-rail-400/10 text-white" : "border-white/15 text-white/70"}`}>
            ${v}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <Field label={dep ? "Or enter an amount (USD)" : "Or enter an amount (USDC)"} hint={dep ? "Between $1 and $10,000. The counter may apply its own limits." : `Up to ${Number(wallet.balances.usdc).toFixed(2)} USDC in this wallet.`}>
          <input className={inputCls} inputMode="decimal" placeholder="0.00" value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^0-9.]/g, ""))} />
        </Field>
      </div>
      <div className="mt-4 grid gap-3">
        <Card>
          <Row k={dep ? "You hand over" : "You send"} v={dep ? fmtUsd(valid ? effective : 0) : `${valid ? effective : 0} USDC`} />
          <Row k={dep ? "You receive" : "You collect"} v={dep ? "USDC, less the cash network fee" : "Cash, less the cash network fee"} />
          <p className="mt-2 text-xs text-white/45">{feeLine(fees, valid ? effective : undefined)}</p>
          <p className="mt-1 text-xs text-white/45">Loadit charges no fee in this version.</p>
        </Card>
        {wallet.cfg.network === "testnet" && <Notice tone="warn">Test mode: the cash network&rsquo;s sandbox page simulates the counter. No cash and no real USDC are involved.</Notice>}
        {err && <Notice tone="error">{err}</Notice>}
        <Btn onClick={start} disabled={!valid || busy}>{busy ? <Spinner /> : null} {dep ? "Start cash-in" : "Start cash-out"}</Btn>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ receive */

export function Receive({ wallet, onBack }: { wallet: Wallet; onBack: () => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const addr = wallet.publicKey || "";
  useEffect(() => {
    if (!addr) return;
    import("qrcode").then((Q) => Q.toDataURL(addr, { margin: 1, width: 480, color: { dark: "#FFFFFF", light: "#00000000" } })).then(setQr).catch(() => undefined);
  }, [addr]);
  return (
    <div>
      <TopBar title="Receive" onBack={onBack} />
      <p className="mt-2 text-sm leading-relaxed text-white/60">Share this address to receive USDC on the Stellar network. Only send Stellar USDC ({shortAddr(wallet.cfg.usdcIssuer)} issuer) or XLM here.</p>
      <Card className="mt-5 flex flex-col items-center">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR code of your Stellar address" className="h-56 w-56 rounded-xl bg-void p-2" />
        ) : (
          <div className="flex h-56 w-56 items-center justify-center"><Spinner /></div>
        )}
        <div className="mt-4 break-all text-center font-mono text-[12px] leading-relaxed text-white/80">{addr}</div>
      </Card>
      <div className="mt-3">
        <Btn tone="secondary" onClick={async () => { try { await navigator.clipboard.writeText(addr); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } }}>{copied ? "Copied" : "Copy address"}</Btn>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ activity */

export function Activity({ wallet, onBack }: { wallet: Wallet; onBack: () => void }) {
  const [list, setList] = useState<Sep24Tx[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const { sep24List } = wallet;
  useEffect(() => {
    sep24List().then(setList).catch((e) => setErr(e instanceof Error ? e.message : "list_failed"));
  }, [sep24List]);
  const merged = useMemo(() => {
    const byId = new Map<string, Sep24Tx>();
    (list || []).forEach((t) => t.id && byId.set(String(t.id), t));
    wallet.activity.forEach((a) => { if (!byId.has(a.id)) byId.set(a.id, { id: a.id, kind: a.kind, status: "incomplete", started_at: a.startedAt, amount_in: a.amount ?? null }); });
    return [...byId.values()].sort((a, b) => String(b.started_at || "").localeCompare(String(a.started_at || "")));
  }, [list, wallet.activity]);

  if (open) {
    const local = wallet.activity.find((a) => a.id === open);
    return (
      <div>
        <TopBar title="Transaction" onBack={() => setOpen(null)} />
        <TxStatus wallet={wallet} id={open} initialUrl={local?.url} onDone={() => setOpen(null)} />
      </div>
    );
  }
  return (
    <div>
      <TopBar title="Activity" onBack={onBack} />
      {err && <div className="mt-3"><Notice tone="error">{err}</Notice></div>}
      {list === null && !err && <div className="mt-6 flex justify-center"><Spinner /></div>}
      {list !== null && merged.length === 0 && <p className="mt-6 text-center text-sm text-white/45">No cash-ins or cash-outs yet.</p>}
      <ul className="mt-4 grid gap-2">
        {merged.map((t) => (
          <li key={String(t.id)}>
            <button type="button" onClick={() => setOpen(String(t.id))} className="w-full rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left hover:border-white/25">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{t.kind === "withdrawal" ? "Cash out" : "Load cash"}</span>
                <Pill tone={t.status === "completed" ? "good" : String(t.status).startsWith("pending_user") || t.status === "incomplete" ? "warn" : ["error", "expired", "no_market"].includes(String(t.status)) ? "bad" : "neutral"}>{String(t.status || "").replace(/_/g, " ")}</Pill>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-white/45">
                <span>{t.started_at ? new Date(String(t.started_at)).toLocaleString() : ""}</span>
                <span className="font-mono">{t.amount_in ? (t.kind === "withdrawal" ? `${t.amount_in} USDC` : fmtUsd(String(t.amount_in))) : ""}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ settings */

export function Settings({ wallet, onBack, go }: { wallet: Wallet; onBack: () => void; go: (s: Screen) => void }) {
  const [confirm, setConfirm] = useState("");
  const [forgetting, setForgetting] = useState(false);
  const standalone = typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone);
  return (
    <div>
      <TopBar title="Settings" onBack={onBack} />
      <div className="mt-4 grid gap-3">
        <Card>
          <Row k="Network" v={wallet.cfg.network === "testnet" ? "Stellar testnet (test mode)" : "Stellar public network"} />
          <Row k="Cash network" v={wallet.cfg.anchorHomeDomain} mono />
          <Row k="Address" v={wallet.publicKey ? shortAddr(wallet.publicKey) : ""} mono />
          <Row k="Installed" v={standalone ? "Yes" : "No — add to Home Screen for the app experience"} />
        </Card>
        <Btn tone="secondary" onClick={() => go("backup")}>Show secret key (backup)</Btn>
        <Btn tone="secondary" onClick={wallet.lock}>Lock now</Btn>
        {!standalone && (
          <Card>
            <div className="font-semibold text-white">Install Loadit</div>
            <p className="mt-1 text-sm text-white/60">iPhone: Share → Add to Home Screen. Android: menu → Install app. The wallet then opens full-screen and keeps working offline.</p>
          </Card>
        )}
        <Card tone="warn">
          <div className="font-semibold text-white">Forget this wallet on this device</div>
          <p className="mt-1 text-sm text-white/60">Deletes the encrypted key from this device. Your funds stay on the network; you can restore with your secret key. Type FORGET to confirm.</p>
          <input className={`${inputCls} mt-3`} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="FORGET" />
          <div className="mt-3"><Btn tone="danger" disabled={confirm !== "FORGET" || forgetting} onClick={async () => { setForgetting(true); await wallet.forgetWallet(); }}>Forget wallet</Btn></div>
        </Card>
        <p className="text-center text-[11px] text-white/35">
          <a href="/privacy" className="underline">Privacy</a> · <a href="/" className="underline">loadit.net</a>
        </p>
      </div>
    </div>
  );
}

export type Screen = "home" | "load" | "cashout" | "receive" | "activity" | "settings" | "backup";
