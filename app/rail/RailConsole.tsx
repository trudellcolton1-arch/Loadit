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
  driveToDeadPayout,
  type PaymentRecord,
  type ScoredRoute,
} from "@/lib/rail";

/**
 * RAIL RUNTIME — DEMO CONSOLE.
 *
 * The real lib/rail runtime, in the browser, against SIMULATED demo doors.
 * The path to WATCH: break a payout pipe, then Heal — same payment id,
 * new quote, strip moves, stale error clears. MoneyGram cash-in is a
 * separate honest refusal (cert in flight) and is not the heal demo.
 */

const AMOUNTS = [50, 150, 500];
const DEMO_WALLET = "demo-merchant-wallet (simulated)";
const BEAT_MS = 550;
const FAIL_HOLD_MS = 1400;

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
    certification: "CLEARED",
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

function snapshot(p: PaymentRecord): PaymentRecord {
  return {
    ...p,
    intent: { ...p.intent, outcome: { ...p.intent.outcome } },
    quote: { ...p.quote, route: { ...p.quote.route, legs: [...p.quote.route.legs] } },
    quotes: [...p.quotes],
    history: [...p.history],
    failedDoorIds: [...p.failedDoorIds],
    intake: p.intake ? { ...p.intake } : null,
    receipt: p.receipt ? { ...p.receipt } : null,
  };
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function RailConsole() {
  const rig = useRef<Rig>();
  if (!rig.current) rig.current = buildRig();

  const [amount, setAmount] = useState(150);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [routes, setRoutes] = useState<ScoredRoute[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [gateMsg, setGateMsg] = useState<string | null>(null);
  const [narration, setNarration] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [healIn, setHealIn] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const autoHealRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchGen = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => {
      clearInterval(t);
      if (autoHealRef.current) clearInterval(autoHealRef.current);
    };
  }, []);

  const mgDoor = useMemo(() => new MoneyGramDoor(), []);

  const intentFor = (amt: number) => ({
    amountUsd: amt,
    outcome: { asset: "USDC" as const, wallet: DEMO_WALLET },
  });

  const paint = (id: string) => {
    const p = snapshot(rig.current!.runtime.getPayment(id));
    setPayment(p);
    return p;
  };

  const cancelAutoHeal = () => {
    if (autoHealRef.current) {
      clearInterval(autoHealRef.current);
      autoHealRef.current = null;
    }
    setHealIn(null);
  };

  const seedPayment = (): PaymentRecord => {
    const p = rig.current!.runtime.createPayment(intentFor(amount));
    const intent = parsePaymentIntent(intentFor(amount));
    setRoutes(
      scoreRoutes(intent, [
        rig.current!.doorA.candidate(intent)!,
        rig.current!.doorB.candidate(intent)!,
        mgDoor.candidate(intent)!,
      ])
    );
    setPayment(snapshot(p));
    return p;
  };

  const newPayment = () => {
    cancelAutoHeal();
    setErr(null);
    setNarration(null);
    try {
      seedPayment();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const run = async (fn: () => Promise<unknown>, id?: string) => {
    cancelAutoHeal();
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
    const pid = id ?? payment?.id;
    if (pid) {
      try {
        paint(pid);
      } catch {
        setTick((n) => n + 1);
      }
    }
  };

  const beginIntake = () => run(() => rig.current!.runtime.beginIntake(payment!.id));
  const confirmIntake = () =>
    run(() =>
      rig.current!.runtime.handleWebhook(payment!.intake!.doorId, {
        internalRef: payment!.intake!.internalRef,
        type: "intake_confirmed",
      })
    );
  const settle = () => run(() => rig.current!.runtime.settle(payment!.id));

  const doHeal = async (id: string) => {
    cancelAutoHeal();
    setErr(null);
    try {
      await rig.current!.runtime.heal(id);
      const p = paint(id);
      setNarration(
        `Healed under the same payment id. Quote is now ${p.quote.quoteId} — finish convert + pay out to see the receipt.`
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      try {
        paint(id);
      } catch {
        /* payment gone */
      }
    }
  };

  const heal = () => {
    if (!payment) return;
    void doHeal(payment.id);
  };

  const scheduleAutoHeal = (id: string) => {
    cancelAutoHeal();
    let left = 2;
    setHealIn(left);
    setNarration("Pipe died (simulated). Same payment id is still on screen — Heal runs in 2s, or press Heal now.");
    autoHealRef.current = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        cancelAutoHeal();
        void doHeal(id);
      } else {
        setHealIn(left);
        setNarration(
          `Pipe died (simulated). Same payment id is still on screen — Heal runs in ${left}s, or press Heal now.`
        );
      }
    }, 1000);
  };

  const breakPipe = async () => {
    cancelAutoHeal();
    setBusy(true);
    setErr(null);
    try {
      const existing = payment && payment.state !== "settled" && payment.state !== "failed" ? payment : seedPayment();
      setNarration("SIMULATED — opening intake, then killing the payout pipe.");
      await driveToDeadPayout(rig.current!.runtime, rig.current!.payout, existing.id);
      const failed = paint(existing.id);
      setNarration(`Failed — ${failed.lastError}. Payment ${failed.id} did not change.`);
      scheduleAutoHeal(existing.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const watchSelfHeal = async () => {
    cancelAutoHeal();
    const gen = ++watchGen.current;
    setBusy(true);
    setErr(null);
    try {
      const p = seedPayment();
      const id = p.id;
      setNarration(`Quoted · payment ${id} — this id will not change.`);
      await sleep(BEAT_MS);
      if (watchGen.current !== gen) return;

      await rig.current!.runtime.beginIntake(id);
      paint(id);
      setNarration("Intake pending (simulated).");
      await sleep(BEAT_MS);
      if (watchGen.current !== gen) return;

      const afterIntake = rig.current!.runtime.getPayment(id);
      await rig.current!.runtime.handleWebhook(afterIntake.intake!.doorId, {
        internalRef: afterIntake.intake!.internalRef,
        type: "intake_confirmed",
      });
      paint(id);
      setNarration("Intake confirmed. Killing the payout pipe (simulated).");
      await sleep(BEAT_MS);
      if (watchGen.current !== gen) return;

      await driveToDeadPayout(rig.current!.runtime, rig.current!.payout, id);
      const failed = paint(id);
      setNarration(`Failed — ${failed.lastError}. Same payment ${id}. Healing next.`);
      await sleep(FAIL_HOLD_MS);
      if (watchGen.current !== gen) return;

      await rig.current!.runtime.heal(id);
      const healed = paint(id);
      setNarration(
        `Healed — quote ${healed.quotes[0]?.quoteId} → ${healed.quote.quoteId}. Payment ${id} unchanged. Finishing payout.`
      );
      await sleep(BEAT_MS);
      if (watchGen.current !== gen) return;

      await rig.current!.runtime.settle(id);
      paint(id);
      setNarration("Settled. One payout on the ledger — Heal did not pay twice.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      if (watchGen.current === gen) setBusy(false);
    }
  };

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
  const priorQuote = payment && payment.quotes.length > 1 ? payment.quotes[payment.quotes.length - 2] : null;

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-16">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black tracking-tight text-white">Rail runtime</h1>
        <span className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-amber-300">
          DEMO · simulated doors · no real money
        </span>
        <span className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-rose-300">
          MoneyGram cash-in: certification in flight — not live
        </span>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
        Watch the machine heal. Break a simulated payout pipe, then Heal:{" "}
        <b className="text-white/80">same payment id</b>, new quote, the state strip moves, the stale
        error clears. The MoneyGram button at the bottom is a different thing — cert in flight, honest
        409, Heal will not clear that gate.
      </p>

      {/* ——— The path Colton came to see ——— */}
      <div className="mt-8 rounded-xl border border-amber-400/35 bg-amber-400/[0.06] p-5">
        <h2 className="text-sm font-bold text-amber-200">See self-heal — simulated</h2>
        <p className="mt-2 text-xs leading-relaxed text-white/55">
          One control to break a pipe. Heal then runs on that same payment (auto, or press it). Labeled
          simulated the whole way. No real money, no partner tx ids.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={watchSelfHeal}
            disabled={busy}
            className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-black hover:bg-white/90 disabled:opacity-40"
          >
            Watch self-heal (simulated)
          </button>
          <button
            onClick={breakPipe}
            disabled={busy}
            className="rounded-lg border border-rose-400/50 px-4 py-2 text-xs font-bold text-rose-200 hover:border-rose-300 disabled:opacity-40"
          >
            Break the payout pipe
          </button>
          <button
            onClick={heal}
            disabled={!payment || busy}
            className="rounded-lg border border-amber-400/60 bg-amber-400/10 px-4 py-2 text-xs font-bold text-amber-200 hover:border-amber-300 disabled:opacity-40"
          >
            {healIn !== null ? `Heal in ${healIn}s — or press now` : "Heal — same payment id"}
          </button>
        </div>
        {narration && (
          <p className="mt-3 rounded-lg bg-black/35 px-3 py-2 font-mono text-[11px] leading-relaxed text-amber-100/90">
            {narration}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
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
          disabled={busy}
          className="rounded-lg border border-white/15 px-4 py-1.5 text-xs text-white/70 hover:border-white/40 disabled:opacity-40"
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
              </span>
            )}
            {payment.healCount > 0 && (
              <span className="ml-1 rounded-md bg-amber-400/20 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-amber-200">
                healed ×{payment.healCount} · same id
              </span>
            )}
          </div>

          <div
            className={`mt-6 rounded-xl border p-5 ${
              payment.quote.healed
                ? "border-amber-400/40 bg-amber-400/[0.07]"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold text-white">
                {payment.quote.healed ? "Healed quote" : "Locked quote"}{" "}
                <span className="font-mono text-[10px] font-normal text-white/40">{payment.quote.quoteId}</span>
              </h2>
              <span className={`font-mono text-xs ${ttlLeft > 15 ? "text-white/50" : "text-amber-300"}`}>
                TTL {ttlLeft}s
              </span>
            </div>
            <p className="mt-2 font-mono text-sm text-white">payment {payment.id}</p>
            {priorQuote && (
              <p className="mt-1 font-mono text-[11px] text-amber-200/80">
                quote {priorQuote.quoteId} → {payment.quote.quoteId} · payment id unchanged
              </p>
            )}
            <div className="mt-3 grid gap-1 font-mono text-xs text-white/70">
              <span>door: {payment.quote.route.doorLabel}</span>
              <span>
                score: {payment.quote.route.score} · fee ${payment.quote.route.feeUsd.toFixed(2)} ·
                non-custodial
              </span>
              <span className="text-white/45">{payment.quote.route.legs.map((l) => l.detail).join(" → ")}</span>
            </div>
            {payment.lastError && (
              <p className="mt-3 font-mono text-[11px] text-rose-300/80">last error: {payment.lastError}</p>
            )}
            {payment.quote.healed && !payment.lastError && (
              <p className="mt-3 font-mono text-[11px] text-amber-200/90">
                last error cleared — this is the healed quote on the original payment.
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={beginIntake}
              disabled={busy || payment.state !== "quoted"}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 enabled:hover:border-white/40 disabled:opacity-30"
            >
              1 · Begin intake
            </button>
            <button
              onClick={confirmIntake}
              disabled={busy || payment.state !== "intake_pending"}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 enabled:hover:border-white/40 disabled:opacity-30"
            >
              2 · Confirm intake (simulated webhook)
            </button>
            <button
              onClick={settle}
              disabled={busy || !["intake_confirmed", "converting", "paying_out"].includes(payment.state)}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 enabled:hover:border-white/40 disabled:opacity-30"
            >
              3 · Convert + pay out
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-bold text-white">Simulated payout ledger</h2>
            <p className="mt-1 font-mono text-xs text-white/50">
              {ledger.length} payout{ledger.length === 1 ? "" : "s"} recorded — heals and retries replay
              the receipt instead of paying again.
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

      <div className="mt-10 rounded-xl border border-rose-400/25 bg-rose-400/[0.04] p-5">
        <h2 className="text-sm font-bold text-white">MoneyGram door — certification gate (not the heal demo)</h2>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/55">
          MoneyGram cash-in is <b className="text-rose-300">not live</b>: certification is still in flight
          with MoneyGram. This button only shows the honest refuse. Heal will not clear{" "}
          <code className="text-white/70">MONEYGRAM_CASH_IN_CERT</code> or start a new payment.
        </p>
        <button
          onClick={tryMoneyGramConfirm}
          className="mt-3 rounded-lg border border-rose-400/40 px-3 py-1.5 text-xs text-rose-300 hover:border-rose-300"
        >
          Attempt confirm at the MoneyGram door
        </button>
        {gateMsg && (
          <p className="mt-3 rounded-lg bg-black/30 px-3 py-2 font-mono text-[11px] leading-relaxed text-rose-200/90">
            {gateMsg}
          </p>
        )}
      </div>

      <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
        DEMO — simulated doors and simulated money. MoneyGram cash-in certification in flight; nothing on
        this page moves real funds or generates real transaction ids.
      </p>
    </div>
  );
}
