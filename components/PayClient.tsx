"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Provider = "coinbase" | "stripe";

/**
 * Landing page for a scanned Loadit Cash QR. The payer completes the purchase
 * through a licensed on-ramp (Coinbase / Stripe); the crypto is delivered
 * straight to the requester's wallet. Loadit never touches the funds.
 */
export function PayClient() {
  const sp = useSearchParams();
  const asset = (sp.get("asset") || "USDC").toUpperCase().slice(0, 6);
  const amount = Math.max(1, Math.min(10000, Number(sp.get("amount")) || 50));
  const wallet = (sp.get("wallet") || "").slice(0, 120);
  const [provider, setProvider] = useState<Provider>("coinbase");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const short = wallet.length > 16 ? `${wallet.slice(0, 8)}…${wallet.slice(-6)}` : wallet;

  const go = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/onramp/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_usd: amount, asset, wallet }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setErr(
        data.configured === false
          ? `${provider === "coinbase" ? "Coinbase" : "Stripe"} isn't configured yet — try the other provider.`
          : data.message || "Couldn't start checkout. Try the other provider."
      );
    } catch {
      setErr("Network hiccup — try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!wallet) {
    return (
      <div className="mx-auto max-w-md text-center text-white/60">
        This payment link is missing a destination wallet. Ask the recipient to
        regenerate their Loadit Cash QR.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="glass rounded-4xl p-7">
        <div className="text-center">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-rail-400">
            Loadit Cash QR
          </span>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Send <span className="text-rail-gradient">${amount.toLocaleString()}</span> of{" "}
            <span className="text-rail-gradient">{asset}</span>
          </h1>
          <p className="mt-1 font-mono text-xs text-white/40">to wallet {short}</p>
        </div>

        <div className="mt-6">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-white/40">
            Pay with
          </span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["coinbase", "stripe"] as Provider[]).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={cn(
                  "rounded-2xl border px-3 py-3.5 text-sm font-medium transition-all",
                  provider === p
                    ? "border-rail-500/50 bg-rail-500/10 text-white"
                    : "border-white/10 bg-white/[0.02] text-white/55 hover:text-white"
                )}
              >
                {p === "coinbase" ? "Coinbase" : "Stripe"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={go}
          disabled={busy}
          className="mt-5 w-full rounded-full bg-rail-500 px-6 py-4 text-sm font-semibold text-void transition-all hover:shadow-glow disabled:opacity-60"
        >
          {busy ? "Opening secure checkout…" : "Continue to secure checkout →"}
        </button>
        {err && <p className="mt-3 text-center text-sm text-amber">{err}</p>}

        <p className="mt-5 text-center text-[0.7rem] leading-relaxed text-white/35">
          Checkout, identity verification, and settlement are handled by the
          licensed provider you choose (card, Apple&nbsp;Pay, or cash-funded
          balance). The crypto is delivered directly to the recipient&apos;s
          wallet above. Loadit routes the request and never holds funds. Only
          pay someone you know and trust — crypto transfers are irreversible.
        </p>
      </div>
    </div>
  );
}
