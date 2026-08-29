/**
 * FIXTURE EXECUTORS for the convert and payout legs — used by tests and the
 * DEMO console. They are idempotent on the key exactly the way a production
 * executor must be, and they can be sabotaged mid-pipe to exercise heal:
 *
 *  - killNext("before"): the pipe dies before the effect fires (nothing paid).
 *  - killNext("after"):  the effect FIRES, then the ack is lost — the caller
 *    sees a failure while money already moved. Only idempotency on the key
 *    makes the retry safe: it must replay the receipt, not pay again.
 *
 * Non-custodial invariant: an executor delivers to the merchant's wallet via
 * a liquidity provider. It never receives or holds keys — note the request
 * shape carries only the destination address.
 */
import type { PayoutExecutor, PayoutReceipt, ConvertExecutor, SwapAsset } from "./types";
import { DeadPipeError } from "./errors";
import { newInternalRef } from "./ids";

type KillMode = "before" | "after";

export class FixturePayoutExecutor implements PayoutExecutor {
  /** Every payout that actually moved money, in order. */
  readonly ledger: PayoutReceipt[] = [];
  private readonly byKey = new Map<string, PayoutReceipt>();
  private kill: { mode: KillMode; reason: string } | null = null;

  killNext(mode: KillMode, reason = `payout pipe died (${mode} effect)`): void {
    this.kill = { mode, reason };
  }

  async payout(req: {
    idempotencyKey: string;
    paymentId: string;
    routeId: string;
    amountUsd: number;
    wallet: string;
  }): Promise<PayoutReceipt> {
    const existing = this.byKey.get(req.idempotencyKey);
    if (existing) return { ...existing, replayed: true };

    if (this.kill?.mode === "before") {
      const reason = this.kill.reason;
      this.kill = null;
      throw new DeadPipeError(reason);
    }

    const receipt: PayoutReceipt = {
      receiptRef: newInternalRef(),
      idempotencyKey: req.idempotencyKey,
      paymentId: req.paymentId,
      routeId: req.routeId,
      amountUsd: req.amountUsd,
      deliveredTo: req.wallet,
      at: new Date().toISOString(),
      replayed: false,
    };
    this.ledger.push(receipt);
    this.byKey.set(req.idempotencyKey, receipt);

    if (this.kill?.mode === "after") {
      const reason = this.kill.reason;
      this.kill = null;
      throw new DeadPipeError(reason);
    }
    return receipt;
  }
}

export class FixtureConvertExecutor implements ConvertExecutor {
  readonly conversions: { idempotencyKey: string; paymentId: string; asset: SwapAsset }[] = [];
  private readonly done = new Set<string>();
  private kill: string | null = null;

  killNext(reason = "convert pipe died"): void {
    this.kill = reason;
  }

  async convert(req: {
    idempotencyKey: string;
    paymentId: string;
    routeId: string;
    amountUsd: number;
    asset: SwapAsset;
  }): Promise<void> {
    if (this.done.has(req.idempotencyKey)) return;
    if (this.kill) {
      const reason = this.kill;
      this.kill = null;
      throw new DeadPipeError(reason);
    }
    this.done.add(req.idempotencyKey);
    this.conversions.push({
      idempotencyKey: req.idempotencyKey,
      paymentId: req.paymentId,
      asset: req.asset,
    });
  }
}
