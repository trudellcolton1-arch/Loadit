/**
 * IDEMPOTENCY STORE — a retry can never pay twice.
 *
 * Every side-effecting step (door intake create, convert, payout) runs under
 * a deterministic idempotency key. The first successful run records its
 * result; any replay with the same key returns that recorded result without
 * re-executing the effect. Failures are NOT recorded, so a genuinely failed
 * step can be retried.
 *
 * `StepCache` is the durable contract (memory today, Postgres when
 * RAIL_DATABASE_URL is set). IdempotencyStore remains the in-process helper
 * the fixture executors and tests already use.
 */
export interface IdempotentResult<T> {
  result: T;
  replayed: boolean;
}

/** Async get/put used by doors, executors, and the transfer store. */
export interface StepCache {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
}

export class IdempotencyStore implements StepCache {
  private readonly results = new Map<string, unknown>();

  has(key: string): boolean {
    return this.results.has(key);
  }

  get<T>(key: string): Promise<T | undefined> {
    return Promise.resolve(this.results.get(key) as T | undefined);
  }

  async put<T>(key: string, value: T): Promise<void> {
    if (!this.results.has(key)) this.results.set(key, value);
  }

  /**
   * Run `fn` exactly once for `key`. A replay returns the recorded result
   * and never re-executes the effect.
   */
  async run<T>(key: string, fn: () => Promise<T> | T): Promise<IdempotentResult<T>> {
    if (this.results.has(key)) {
      return { result: this.results.get(key) as T, replayed: true };
    }
    const result = await fn();
    this.results.set(key, result);
    return { result, replayed: false };
  }
}

/** Deterministic step keys — stable across heals so retries dedupe. */
export const stepKey = {
  /** Keyed by door so a heal that picks a NEW door may open a fresh intake
   *  (no customer money moved through the dead one), while a retry at the
   *  SAME door replays the original intake. */
  intake: (paymentId: string, doorId: string) => `${paymentId}:intake:${doorId}`,
  /** Stable per payment: however many heals happen, at most one conversion. */
  convert: (paymentId: string) => `${paymentId}:convert`,
  /** Stable per payment: however many heals happen, at most one payout. */
  payout: (paymentId: string) => `${paymentId}:payout`,
  /** One ledger posting per money-moving kind, ever, per payment. */
  ledger: (paymentId: string, kind: string) => `${paymentId}:ledger:${kind}`,
};
