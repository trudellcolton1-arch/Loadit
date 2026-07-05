import { HYLAQ } from "./config";

/**
 * HYLAQ WALLET SEND — "I have crypto" path.
 *
 * Talks DIRECTLY to Hylaq (never through Loadit's servers) so the user's
 * wallet password only ever travels app → Hylaq. Hylaq is non-custodial: it
 * decrypts the seed to sign and never keeps it. Two-phase by design:
 *   1) mint a short-lived Hylaq API JWT from { handleId, walletPassword }
 *   2) POST /api/wallet/send        → builds the tx (does NOT broadcast)
 *   3) POST /api/wallet/sign-and-submit → signs + broadcasts
 * The password is held only for the duration of one send and never persisted.
 */

const BASE = (HYLAQ.issuer || "https://www.hylaq.com").replace(/\/$/, "");

export type SendAsset = "USDC" | "SOL" | "BTC" | "ETH" | "BNB";
export type BtcNetworkType = "lightning" | "onchain";

export interface SendBuild {
  success: boolean;
  type?: string;
  transaction?: string;
  transactionType?: "legacy" | "versioned";
  receiptId?: string;
  feeSponsored?: boolean;
  from?: { handle?: string; address?: string; asset?: string; amount?: number };
  to?: { handle?: string; address?: string; asset?: string };
  amount?: number;
  amountFormatted?: string;
  route?: { provider?: string; estimatedFees?: unknown; estimatedTime?: string };
  fee?: { amount?: number; formatted?: string; description?: string };
  message?: string;
  error?: string;
  errorType?: string;
}

export interface SendSubmit {
  success: boolean;
  signature?: string;
  error?: string;
  errorType?: string;
}

async function postJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (res.status === 429) {
    return { ...(data as object), error: (data.error as string) || "Too many requests — wait a moment and try again.", errorType: "RATE_LIMITED" } as T;
  }
  return data as T;
}

/** Mint the Hylaq API JWT (needs the wallet password). */
export async function mintApiToken(handleId: string, walletPassword: string): Promise<string | null> {
  try {
    const data = await postJson<{ token?: string }>("/api/auth/api-token", {
      handleId,
      walletPassword,
      purpose: "api",
    });
    return data.token || null;
  } catch {
    return null;
  }
}

export interface BuildParams {
  fromHandleId: string;
  toHandle?: string;
  toExternalAddress?: string;
  amount: number; // USD
  recipientAsset: SendAsset;
  btcNetworkType?: BtcNetworkType;
}

/** Phase 1 — build the transaction (does not broadcast). */
export async function buildSend(token: string, p: BuildParams): Promise<SendBuild> {
  return postJson<SendBuild>(
    "/api/wallet/send",
    {
      fromHandleId: p.fromHandleId,
      ...(p.toHandle ? { toHandle: p.toHandle } : {}),
      ...(p.toExternalAddress ? { toExternalAddress: p.toExternalAddress } : {}),
      amount: p.amount,
      recipientAsset: p.recipientAsset,
      ...(p.recipientAsset === "BTC" && p.btcNetworkType ? { btcNetworkType: p.btcNetworkType } : {}),
    },
    token
  );
}

/** Phase 2 — sign the built tx and broadcast (needs the wallet password again). */
export async function signAndSubmit(
  token: string,
  handleId: string,
  build: SendBuild,
  walletPassword: string
): Promise<SendSubmit> {
  return postJson<SendSubmit>(
    "/api/wallet/sign-and-submit",
    {
      handleId,
      transaction: build.transaction,
      transactionType: build.transactionType,
      walletPassword,
      receiptId: build.receiptId,
    },
    token
  );
}
