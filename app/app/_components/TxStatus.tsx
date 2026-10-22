"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Sep24Tx } from "@/app/api/anchor/sep24/route";
import type { Wallet } from "./useWallet";
import { Btn, Card, Label, Notice, Pill, Row, Spinner } from "./ui";
import { fmtUsd } from "@/lib/wallet/stellar";

/**
 * Live view of one SEP-24 transaction at the anchor. Polls while the
 * transaction is in flight and turns each anchor status into a plain next
 * step for the person holding the phone.
 */

const TERMINAL = new Set(["completed", "refunded", "expired", "error", "no_market", "too_small", "too_large"]);

export function describe(tx: Sep24Tx): { title: string; detail: string; tone: "neutral" | "good" | "warn" | "bad"; step: number } {
  const dep = tx.kind === "deposit";
  switch (tx.status) {
    case "incomplete":
      return { title: "Finish the form", detail: "The cash network's page is waiting for you to complete it. Open it to continue.", tone: "warn", step: 1 };
    case "pending_user_transfer_start":
      return dep
        ? { title: "Pay cash at the counter", detail: "Take the reference number from the cash network's page to any MoneyGram location and hand over the cash. The USDC arrives in this wallet once they confirm.", tone: "warn", step: 2 }
        : { title: "Send the USDC to complete", detail: "Your cash-out is reserved. Send the USDC from this wallet to lock it in; cash is then ready for pickup.", tone: "warn", step: 2 };
    case "pending_user_transfer_complete":
      return { title: "Cash is ready for pickup", detail: "Show the reference number on the cash network's page at any MoneyGram location to collect your cash.", tone: "good", step: 3 };
    case "pending_external":
    case "pending_anchor":
    case "pending_stellar":
    case "pending_trust":
    case "pending_user":
      return { title: "Processing", detail: dep ? "The cash network is confirming your payment and sending USDC to this wallet." : "The cash network is preparing your cash.", tone: "neutral", step: 3 };
    case "completed":
      return { title: "Completed", detail: dep ? "USDC is in your wallet." : "Cash collected.", tone: "good", step: 4 };
    case "refunded":
      return { title: "Refunded", detail: "The cash network refunded this transaction.", tone: "warn", step: 4 };
    case "expired":
      return { title: "Expired", detail: "This request timed out before it was funded. Start a new one.", tone: "bad", step: 4 };
    case "error":
    case "no_market":
    case "too_small":
    case "too_large":
      return { title: "Could not complete", detail: tx.message ? String(tx.message) : "The cash network reported a problem with this transaction.", tone: "bad", step: 4 };
    default:
      return { title: String(tx.status || "Pending"), detail: tx.message ? String(tx.message) : "Waiting for the cash network.", tone: "neutral", step: 1 };
  }
}

export function TxStatus({ wallet, id, initialUrl, onDone }: { wallet: Wallet; id: string; initialUrl?: string; onDone?: () => void }) {
  const [tx, setTx] = useState<Sep24Tx | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const t = await wallet.sep24Status(id);
      if (t) {
        setTx(t);
        setErr(null);
        if (t.status === "completed") void wallet.refreshAccount();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "status_failed");
    }
  }, [wallet, id]);

  useEffect(() => {
    void refresh();
    const tick = () => {
      if (tx && TERMINAL.has(String(tx.status))) return;
      timer.current = window.setTimeout(async () => {
        await refresh();
        tick();
      }, 6000);
    };
    tick();
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tx?.status]);

  const openUrl = (tx?.more_info_url as string | undefined) || initialUrl;
  const d = tx ? describe(tx) : null;
  const needsPayment = tx?.kind === "withdrawal" && tx.status === "pending_user_transfer_start" && tx.withdraw_anchor_account && tx.amount_in;

  const completeWithdraw = async () => {
    if (!tx || !needsPayment) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await wallet.pay({
        destination: String(tx.withdraw_anchor_account),
        amount: String(tx.amount_in),
        memo: tx.withdraw_memo ? { type: String(tx.withdraw_memo_type || "text"), value: String(tx.withdraw_memo) } : null,
      });
      setSent(r.hash);
      setTimeout(() => void refresh(), 4000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "payment_failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Card tone={d?.tone === "good" ? "accent" : d?.tone === "warn" ? "warn" : "default"}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Label>{tx?.kind === "withdrawal" ? "Cash out" : "Load cash"}</Label>
            <h2 className="mt-1 text-xl font-semibold text-white">{d ? d.title : "Checking status"}</h2>
          </div>
          {tx ? <Pill tone={d!.tone === "bad" ? "bad" : d!.tone === "good" ? "good" : d!.tone === "warn" ? "warn" : "neutral"}>{String(tx.status).replace(/_/g, " ")}</Pill> : <Spinner />}
        </div>
        {d && <p className="mt-3 text-sm leading-relaxed text-white/70">{d.detail}</p>}

        {d && (
          <ol className="mt-4 grid grid-cols-4 gap-1" aria-label="Progress">
            {["Start", tx?.kind === "withdrawal" ? "Send USDC" : "Pay cash", tx?.kind === "withdrawal" ? "Pickup" : "Confirm", "Done"].map((s, i) => (
              <li key={s} className="text-center">
                <div className={`h-1 rounded-full ${i < d.step ? (d.tone === "bad" ? "bg-red-400" : "bg-rail-400") : "bg-white/10"}`} />
                <div className={`mt-1.5 text-[10px] ${i < d.step ? "text-white/80" : "text-white/35"}`}>{s}</div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {tx && (
        <Card>
          <Row k="Reference" v={String(tx.external_transaction_id || tx.id)} mono />
          {tx.amount_in && <Row k={tx.kind === "withdrawal" ? "USDC to send" : "Cash in"} v={tx.kind === "withdrawal" ? `${tx.amount_in} USDC` : fmtUsd(String(tx.amount_in))} />}
          {tx.amount_fee && <Row k="Cash network fee" v={fmtUsd(String(tx.amount_fee))} />}
          {tx.amount_out && <Row k={tx.kind === "withdrawal" ? "Cash out" : "USDC to wallet"} v={tx.kind === "withdrawal" ? fmtUsd(String(tx.amount_out)) : `${tx.amount_out} USDC`} />}
          {tx.started_at && <Row k="Started" v={new Date(String(tx.started_at)).toLocaleString()} />}
          {tx.stellar_transaction_id && <Row k="Stellar tx" v={String(tx.stellar_transaction_id).slice(0, 12) + "…"} mono />}
        </Card>
      )}

      {err && <Notice tone="error">{err}</Notice>}
      {sent && <Notice tone="good">USDC sent. Transaction {sent.slice(0, 10)}… The cash network will confirm shortly.</Notice>}

      <div className="grid gap-2">
        {needsPayment && !sent && (
          <Btn onClick={completeWithdraw} disabled={busy}>
            {busy ? <Spinner /> : null} Send {String(tx!.amount_in)} USDC to complete
          </Btn>
        )}
        {openUrl && !TERMINAL.has(String(tx?.status)) && (
          <Btn tone={needsPayment ? "secondary" : "primary"} onClick={() => window.open(openUrl, "_blank", "noopener")}>
            Open the cash network page
          </Btn>
        )}
        <Btn tone="ghost" onClick={() => void refresh()}>Refresh status</Btn>
        {onDone && <Btn tone="secondary" onClick={onDone}>{tx && TERMINAL.has(String(tx.status)) ? "Done" : "Back to wallet"}</Btn>}
      </div>
    </div>
  );
}
