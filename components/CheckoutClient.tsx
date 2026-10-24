"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { cn, formatUSD } from "@/lib/utils";

/**
 * HOSTED MERCHANT CHECKOUT — the buyer-facing side of the merchant API.
 *
 * Non-custodial: the buyer sends USDC on Stellar straight to the merchant's
 * own address with the session id as the memo. This client polls the verify
 * endpoint, which confirms the payment on-chain and then redirects the buyer
 * back to the merchant's success URL.
 */

interface PublicSession {
  id: string;
  status: "pending" | "succeeded" | "expired";
  mode: "test" | "live";
  merchant_name: string;
  item: { name: string; sku?: string; image_url?: string };
  amount_usd: number;
  usdc_amount: string;
  network: string;
  destination: string;
  memo: string;
  sep7_uri: string;
  tx_hash: string | null;
  explorer_tx_url: string | null;
  success_url: string;
  cancel_url: string;
  expires_at: string;
}

const POLL_MS = 6000;

function shortAddr(a: string) {
  return a.length > 14 ? `${a.slice(0, 7)}…${a.slice(-7)}` : a;
}

function CopyRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
      className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-white/[0.16]"
    >
      <span className="min-w-0">
        <span className="block font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/40">
          {label}
        </span>
        <span
          className={cn(
            "block truncate text-sm text-white/90",
            mono && "font-mono text-[0.8rem]"
          )}
        >
          {value}
        </span>
      </span>
      <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-rail-400">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

function useCountdown(expiresAt?: string) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setLeft(Math.max(0, Date.parse(expiresAt) - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  if (left === null) return null;
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CheckoutClient({ id }: { id: string }) {
  const [session, setSession] = useState<PublicSession | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "not_found" | "error">("loading");
  const [checking, setChecking] = useState(false);
  const redirected = useRef(false);

  const verify = useCallback(async () => {
    try {
      const res = await fetch(`/api/checkout/session/${id}/verify`, { method: "POST" });
      if (res.status === 404) return setState("not_found");
      const data = await res.json();
      if (data.ok && data.session) {
        setSession(data.session as PublicSession);
        setState("ready");
      }
    } catch {
      /* transient — the next poll retries */
    }
  }, [id]);

  // Initial load.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/checkout/session/${id}`);
        if (res.status === 404) return setState("not_found");
        const data = await res.json();
        if (data.ok && data.session) {
          setSession(data.session as PublicSession);
          setState("ready");
        } else {
          setState("error");
        }
      } catch {
        setState("error");
      }
    })();
  }, [id]);

  // Poll on-chain settlement while pending.
  useEffect(() => {
    if (session?.status !== "pending") return;
    const t = setInterval(verify, POLL_MS);
    return () => clearInterval(t);
  }, [session?.status, verify]);

  // Succeeded → hand the buyer back to the merchant.
  useEffect(() => {
    if (session?.status !== "succeeded" || redirected.current) return;
    redirected.current = true;
    const url = new URL(session.success_url);
    url.searchParams.set("loadit_session_id", session.id);
    url.searchParams.set("loadit_status", "succeeded");
    const t = setTimeout(() => window.location.assign(url.toString()), 2500);
    return () => clearTimeout(t);
  }, [session]);

  const countdown = useCountdown(session?.status === "pending" ? session.expires_at : undefined);

  if (state === "loading") {
    return (
      <div className="glass rounded-4xl p-10 text-center text-sm text-white/50">
        Loading checkout…
      </div>
    );
  }
  if (state === "not_found") {
    return (
      <div className="glass rounded-4xl p-10 text-center">
        <p className="text-white/80">This checkout link doesn&apos;t exist.</p>
        <p className="mt-2 text-sm text-white/50">
          Ask the store to generate a new payment link.
        </p>
      </div>
    );
  }
  if (state === "error" || !session) {
    return (
      <div className="glass rounded-4xl p-10 text-center">
        <p className="text-white/80">Couldn&apos;t load this checkout.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-rail-400 hover:text-rail-500"
        >
          Try again
        </button>
      </div>
    );
  }

  const isTest = session.mode === "test";
  const qrSrc = `/api/qr?data=${encodeURIComponent(session.sep7_uri)}&size=360`;

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <a href="https://loadit.net" className="flex items-center gap-2" aria-label="Loadit">
          <Logo className="h-6 w-6" priority />
          <span className="text-sm font-semibold tracking-tight text-white">Loadit</span>
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.25em] text-white/40">
            Checkout
          </span>
        </a>
        {isTest && (
          <span className="rounded-full border border-amber/40 bg-amber/10 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-amber">
            Testnet — no real money
          </span>
        )}
      </div>

      <div className="glass rounded-4xl p-7">
        {/* Order summary */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-rail-400">
              {session.merchant_name}
            </p>
            <h1 className="mt-1 truncate text-lg font-semibold text-white">
              {session.item.name}
            </h1>
            {session.item.sku && (
              <p className="mt-0.5 font-mono text-[0.65rem] text-white/40">{session.item.sku}</p>
            )}
          </div>
          {session.item.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.item.image_url}
              alt=""
              className="h-14 w-14 shrink-0 rounded-xl border border-white/10 object-cover"
            />
          )}
        </div>

        <div className="mt-4 flex items-baseline justify-between border-t border-white/[0.06] pt-4">
          <span className="text-sm text-white/60">Total</span>
          <span className="text-right">
            <span className="block text-2xl font-semibold text-white">
              {formatUSD(session.amount_usd)}
            </span>
            <span className="block font-mono text-[0.7rem] text-white/50">
              {session.usdc_amount} USDC ·{" "}
              {session.network === "stellar" ? "Stellar" : "Stellar testnet"}
            </span>
          </span>
        </div>

        {session.status === "pending" && (
          <>
            {/* QR + wallet handoff */}
            <div className="mt-6 flex flex-col items-center">
              <div className="rounded-3xl bg-white p-3 shadow-glow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrSrc} alt="Payment QR code" className="h-44 w-44" />
              </div>
              <a
                href={session.sep7_uri}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-medium text-void transition-colors hover:bg-white/90"
              >
                Open in wallet
              </a>
              <p className="mt-2 text-center text-xs text-white/40">
                Scan with any Stellar wallet, or send manually below.
              </p>
            </div>

            {/* Manual payment details */}
            <div className="mt-5 space-y-2">
              <CopyRow label={`Send exactly (USDC)`} value={session.usdc_amount} />
              <CopyRow label="To address" value={session.destination} />
              <CopyRow label="Memo — required" value={session.memo} />
            </div>
            <p className="mt-3 rounded-xl border border-amber/20 bg-amber/5 px-3 py-2 text-[0.72rem] leading-relaxed text-amber/90">
              Include the memo exactly as shown — it&apos;s how your payment is matched to
              this order. Payments without it can&apos;t be confirmed automatically.
            </p>

            {/* Status */}
            <div className="mt-5 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-white/50">
                <span className="h-2 w-2 animate-pulse-rail rounded-full bg-rail-400" />
                Watching the network for your payment…
              </span>
              {countdown && (
                <span className="font-mono text-xs text-white/40">expires in {countdown}</span>
              )}
            </div>
            <button
              type="button"
              disabled={checking}
              onClick={async () => {
                setChecking(true);
                await verify();
                setChecking(false);
              }}
              className="mt-3 w-full rounded-full border border-white/10 py-2.5 text-sm text-white/80 transition-colors hover:border-rail-400/50 hover:text-white disabled:opacity-50"
            >
              {checking ? "Checking…" : "I've sent it — check now"}
            </button>
          </>
        )}

        {session.status === "succeeded" && (
          <div className="mt-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rail-500/15 text-2xl text-signal">
              ✓
            </div>
            <h2 className="mt-3 text-lg font-semibold text-white">Payment confirmed</h2>
            <p className="mt-1 text-sm text-white/55">
              Settled on-chain, straight to the merchant&apos;s wallet.
            </p>
            {session.explorer_tx_url && (
              <a
                href={session.explorer_tx_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-mono text-[0.7rem] text-rail-400 hover:text-rail-500"
              >
                View transaction ↗
              </a>
            )}
            <p className="mt-4 text-xs text-white/40">Returning you to {session.merchant_name}…</p>
            <a
              href={`${session.success_url}${session.success_url.includes("?") ? "&" : "?"}loadit_session_id=${session.id}&loadit_status=succeeded`}
              className="mt-3 inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-medium text-void hover:bg-white/90"
            >
              Back to the store
            </a>
          </div>
        )}

        {session.status === "expired" && (
          <div className="mt-6 text-center">
            <h2 className="text-lg font-semibold text-white">This checkout expired</h2>
            <p className="mt-2 text-sm text-white/55">
              No payment was detected in time. If you already sent USDC, contact the store
              with your transaction hash.
            </p>
            <a
              href={session.cancel_url}
              className="mt-4 inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-2.5 text-sm text-white/80 hover:border-white/30"
            >
              Back to the store
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between px-2">
        {session.status === "pending" ? (
          <a href={session.cancel_url} className="text-xs text-white/40 hover:text-white/70">
            Cancel and return
          </a>
        ) : (
          <span />
        )}
        <p className="text-right font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/30">
          Non-custodial · verified on-chain
        </p>
      </div>
    </div>
  );
}
