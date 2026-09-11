"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RailRuntime,
  FixtureDoor,
  FixturePayoutExecutor,
  FixtureConvertExecutor,
  MoneyGramDoor,
  scoreRoutes,
  parsePaymentIntent,
  type PaymentRecord,
  type ScoredRoute,
} from "@/lib/rail";

/**
 * RAIL RUNTIME — DEMO CONSOLE.
 *
 * The real lib/rail runtime, running in the browser against SIMULATED demo
 * doors. No real money moves here and no live provider is called. The
 * MoneyGram panel exists to demonstrate the certification gate: cash-in is
 * NOT live — certification is in flight with MoneyGram — so the door refuses
 * to confirm, and this page shows that refusal verbatim.
 */

const AMOUNTS = [50, 150, 500];
const DEMO_WALLET = "demo-merchant-wallet (simulated)";

interface Rig {
  runtime: RailRuntime;
  doorA: FixtureDoor;
  doorB: FixtureDoor;
  payout: FixturePayoutExecutor;
  convert: FixtureConvertExecutor;
}

function buildRig(): Rig {
  const doorA = new FixtureDoor({
    id: "demo_cash_a",
    kind: "cash",
    label: "Demo cash door A (simulated)",
    certification: "CLEARED", // simulated door, simulated money — clearly labeled
    feeUsd: 1.2,
    etaSeconds: 420,
    liquidity: 0.85,
    risk: 0.15,
  });
  const doorB = new FixtureDoor({
    id: "demo_bank_b",
    kind: "bank",
    label: "Demo bank door B (simulated)",
    certification: "CLEARED",
    feeUsd: 0.9,
    etaSeconds: 3600,
    liquidity: 0.95,
    risk: 0.1,
  });
  const payout = new FixturePayoutExecutor();
  const convert = new FixtureConvertExecutor();
  const runtime = new RailRuntime({ doors: [doorA, doorB], payout, convert });
  return { runtime, doorA, doorB, payout, convert };
}

const STATE_LABEL: Record<string, string> = {
  quoted: "Quoted",
  intake_pending: "Intake pending",
  intake_confirmed: "Intake confirmed",
  converting: "Converting",
  paying_out: "Paying out",
  settled: "Settled",
  failed: "Failed",
  healing: "Healing",
};

const STATE_ORDER = [
  "quoted",
  "intake_pending",
  "intake_confirmed",
  "converting",
  "paying_out",
  "settled",
] as const;

export function RailConsole() {
  const rig = useRef<Rig>();
  if (!rig.current) rig.current = buildRig();

  const [amount, setAmount] = useState(150);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [routes, setRoutes] = useState<ScoredRoute[]>([]);
  const [killPayout, setKillPayout] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [gateMsg, setGateMsg] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Second-by-second re-render for the quote TTL countdown.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const refresh = () => setTick((n) => n + 1);

  const mgDoor = useMemo(() => new MoneyGramDoor(), []);

  const intentFor = (amt: number) => ({
    amountUsd: amt,
    outcome: { asset: "USDC" as const, wallet: DEMO_WALLET },
  });

  const newPayment = () => {
    setErr(null);
    try {
      const p = rig.current!.runtime.createPayment(intentFor(amount));
      setPayment(p);
      // Show the whole scored field, including the gated MoneyGram candidate.
      const intent = parsePaymentIntent(intentFor(amount));
      const candidates = [
        rig.current!.doorA.candidate(intent)!,
        rig.current!.doorB.candidate(intent)!,
        mgDoor.candidate(intent)!,
      ];
      setRoutes(scoreRoutes(intent, candidates));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const run = async (fn: () => Promise<unknown>) => {
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
    refresh();
  };

  const beginIntake = () => run(() => rig.current!.runtime.beginIntake(payment!.id));

  const confirmIntake = () =>
    run(() =>
      rig.current!.runtime.handleWebhook(payment!.intake!.doorId, {
        internalRef: payment!.intake!.internalRef,
        type: "intake_confirmed",
      })
    );

  const settle = () =>
    run(async () => {
      if (killPayout) {
        rig.current!.payout.killNext("before", "demo: payout pipe killed mid-pay");
        setKillPayout(false);
      }
      await rig.current!.runtime.settle(payment!.id);
    });

  const heal = () => run(() => rig.current!.runtime.heal(payment!.id));

  const tryMoneyGramConfirm = async () => {
    setGateMsg(null);
    try {
      const intake = await mgDoor.create({
        paymentId: "pay_demo_gate",
        amountUsd: amount,
        asset: "USDC",
        idempotencyKey: `pay_demo_gate:${Date.now()}`,
      });
      await mgDoor.webhook({ internalRef: intake.internalRef, type: "intake_confirmed" });
      setGateMsg("Confirmed — certification flag is CLEARED on this build.");
    } catch (e) {
      setGateMsg(e instanceof Error ? e.message : String(e));
    }
  };

  const ttlLeft = payment ? Math.max(0, Math.ceil((payment.quote.expiresAt - Date.now()) / 1000)) : 0;
  const ledger = rig.current!.payout.ledger;

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-16">
      {/* ——— Header + honest labels ——— */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black tracking-tight text-white">Rail runtime</h1>
        <span className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-amber-300">
          DEMO · simulated doors · no real money
        </span>
        <span className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-rose-300">
          Cash-in: partner certification in flight — not live
        </span>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
        One machine: an intent (amount + outcome, <b className="text-white/80">no chain picker</b>) goes in,
        HQ scores the candidate doors on fee, time, liquidity, risk, and certification, locks a quote with a
        TTL, and drives one payment id through intake → convert → payout. Kill a pipe mid-pay and heal:
        same payment id, new quote, and idempotency keys guarantee the payout can never fire twice.
        Everything below runs the real <code className="text-white/70">lib/rail</code> code against
        simulated demo doors.
      </p>

      {/* ——— Controls ——— */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs ${
                amount === a
                  ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
                  : "border-white/15 text-white/60 hover:border-white/30"
              }`}
            >
              ${a}
            </button>
          ))}
        </div>
        <button
          onClick={newPayment}
          className="rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-black hover:bg-white/90"
        >
          New demo payment
        </button>
      </div>

      {err && (
        <div className="mt-4 rounded-lg border border-rose-400/40 bg-rose-400/10 px-4 py-3 font-mono text-xs text-rose-300">
          {err}
        </div>
      )}

      {payment && (
        <>
          {/* ——— State strip ——— */}
          <div className="mt-8 flex flex-wrap items-center gap-1.5">
            {STATE_ORDER.map((s, i) => {
              const active = payment.state === s;
              const passed = payment.history.some((h) => h.to === s);
              return (
                <div key={s} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-white/20">→</span>}
                  <span
                    className={`rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
                      active
                        ? "bg-emerald-400/20 text-emerald-300"
                        : passed
                          ? "bg-white/10 text-white/60"
                          : "bg-white/5 text-white/30"
                    }`}
                  >
                    {STATE_LABEL[s]}
                  </span>
                </div>
              );
            })}
            {(payment.state === "failed" || payment.state === "healing") && (
              <span className="ml-2 rounded-md bg-rose-400/20 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-rose-300">
                {STATE_LABEL[payment.state]}
                {payment.healCount > 0 ? ` · heals: ${payment.healCount}` : ""}
              </span>
            )}
          </div>

          {/* ——— Quote panel ——— */}
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold text-white">
                Locked quote{" "}
                <span className="font-mono text-[10px] font-normal text-white/40">{payment.quote.quoteId}</span>
                {payment.quote.healed && (
                  <span className="ml-2 rounded bg-amber-400/20 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                    healed — same payment id
                  </span>
                )}
              </h2>
              <span className={`font-mono text-xs ${ttlLeft > 15 ? "text-white/50" : "text-amber-300"}`}>
                TTL {ttlLeft}s
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-white/40">payment {payment.id}</p>
            <div className="mt-3 grid gap-1 font-mono text-xs text-white/70">
              <span>door: {payment.quote.route.doorLabel}</span>
              <span>score: {payment.quote.route.score} · fee ${payment.quote.route.feeUsd.toFixed(2)} · non-custodial</span>
              <span className="text-white/45">
                {payment.quote.route.legs.map((l) => l.detail).join(" → ")}
              </span>
            </div>
            {payment.lastError && (
              <p className="mt-3 font-mono text-[11px] text-rose-300/80">last error: {payment.lastError}</p>
            )}
          </div>

          {/* ——— Step buttons ——— */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={beginIntake}
              disabled={payment.state !== "quoted"}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 enabled:hover:border-white/40 disabled:opacity-30"
            >
              1 · Begin intake
            </button>
            <button
              onClick={confirmIntake}
              disabled={payment.state !== "intake_pending"}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 enabled:hover:border-white/40 disabled:opacity-30"
            >
              2 · Confirm intake (simulated webhook)
            </button>
            <button
              onClick={settle}
              disabled={!["intake_confirmed", "converting", "paying_out"].includes(payment.state)}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 enabled:hover:border-white/40 disabled:opacity-30"
            >
              3 · Convert + pay out
            </button>
            <button
              onClick={heal}
              disabled={payment.state !== "failed"}
              className="rounded-lg border border-amber-400/40 px-3 py-1.5 text-xs text-amber-300 enabled:hover:border-amber-300 disabled:opacity-30"
            >
              Heal (same payment id)
            </button>
            <label className="ml-1 flex items-center gap-1.5 font-mono text-[11px] text-white/50">
              <input
                type="checkbox"
                checked={killPayout}
                onChange={(e) => setKillPayout(e.target.checked)}
                className="accent-rose-400"
              />
              kill payout pipe on next step
            </label>
          </div>

          {/* ——— Payout ledger (idempotency proof) ——— */}
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-bold text-white">Simulated payout ledger</h2>
            <p className="mt-1 font-mono text-xs text-white/50">
              {ledger.length} payout{ledger.length === 1 ? "" : "s"} recorded — heals and retries replay the
              receipt instead of paying again.
            </p>
            {ledger.map((r) => (
              <p key={r.receiptRef} className="mt-2 font-mono text-[11px] text-white/60">
                {r.receiptRef} · ${r.amountUsd} → {r.deliveredTo}
                {payment.receipt?.replayed && payment.receipt.receiptRef === r.receiptRef
                  ? " · replayed on retry"
                  : ""}
              </p>
            ))}
          </div>

          {/* ——— Scored field ——— */}
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-bold text-white">HQ scored field (this payment)</h2>
            <div className="mt-3 grid gap-2">
              {routes.map((r) => (
                <div key={r.routeId} className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                  <span className="w-16 text-white/80">{r.score.toFixed(1)}</span>
                  <span className="text-white/60">{r.doorLabel}</span>
                  <span className="text-white/40">fee ${r.feeUsd.toFixed(2)}</span>
                  {r.confirmable ? (
                    <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-emerald-300">
                      certified (simulated)
                    </span>
                  ) : (
                    <span className="rounded bg-rose-400/15 px-1.5 py-0.5 text-rose-300">
                      cert in flight — cannot confirm real money
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ——— Cash partner certification gate ——— */}
      <div className="mt-10 rounded-xl border border-rose-400/25 bg-rose-400/[0.04] p-5">
        <h2 className="text-sm font-bold text-white">Cash door — certification gate</h2>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/55">
          Retail cash-in is <b className="text-rose-300">not live</b>: certification with our licensed
          cash partner is still in flight. The real cash door in <code className="text-white/70">lib/rail</code> refuses
          to confirm customer cash until the owner explicitly clears the certification flag. Press the button to see the
          runtime enforce it — this opens a simulated intake and attempts a confirm.
        </p>
        <button
          onClick={tryMoneyGramConfirm}
          className="mt-3 rounded-lg border border-rose-400/40 px-3 py-1.5 text-xs text-rose-300 hover:border-rose-300"
        >
          Attempt confirm at the cash door
        </button>
        {gateMsg && (
          <p className="mt-3 rounded-lg bg-black/30 px-3 py-2 font-mono text-[11px] leading-relaxed text-rose-200/90">
            {gateMsg}
          </p>
        )}
      </div>

      <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
        DEMO — simulated doors and simulated money. Cash-in partner certification in flight; nothing on
        this page moves real funds or generates real transaction ids.
      </p>
    </div>
  );
}
