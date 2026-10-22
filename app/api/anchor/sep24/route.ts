import { NextResponse } from "next/server";
import { StrKey } from "@stellar/stellar-sdk";
import { limit } from "@/lib/ratelimit";
import { mgAnchor, fixRampsUrl, stellarNetwork } from "@/lib/anchor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SEP-24 proxy for the browser wallet. The user's own SEP-10 JWT (issued to
 * their Stellar account) is forwarded as-is; the server adds nothing and
 * stores nothing. Operations:
 *
 *   GET  ?info=1                → anchor /info (assets, fee schedule, limits)
 *   GET  ?id=<tx>               → one transaction's status
 *   GET  ?list=1[&kind=deposit] → the account's transactions
 *   POST { op: "deposit"|"withdraw", account, amount? }
 *                               → start an interactive flow; returns the
 *                                 MoneyGram-hosted URL the wallet opens
 */

const ALLOWED_TX_FIELDS = [
  "id", "kind", "status", "status_eta", "more_info_url", "amount_in", "amount_in_asset", "amount_out", "amount_out_asset",
  "amount_fee", "amount_fee_asset", "started_at", "updated_at", "completed_at", "stellar_transaction_id", "external_transaction_id",
  "message", "refunded", "from", "to", "withdraw_anchor_account", "withdraw_memo", "withdraw_memo_type", "deposit_memo",
  "deposit_memo_type", "claimable_balance_id",
] as const;

export type Sep24Tx = Partial<Record<(typeof ALLOWED_TX_FIELDS)[number], string | boolean | null>>;

function pick(t: Record<string, unknown>): Sep24Tx {
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED_TX_FIELDS) if (k in t) out[k] = t[k];
  return out as Sep24Tx;
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export async function GET(req: Request) {
  const limited = limit(req, "anchor-sep24-read", 60);
  if (limited) return limited;
  const { searchParams } = new URL(req.url);
  const anchor = mgAnchor();

  if (searchParams.get("info")) {
    try {
      const res = await fetch(`${anchor.sep24}/info`, { cache: "no-store" });
      if (!res.ok) return json({ ok: false, reason: "anchor_unavailable" }, 502);
      return json({ ok: true, network: stellarNetwork(), info: await res.json() });
    } catch {
      return json({ ok: false, reason: "anchor_unavailable" }, 502);
    }
  }

  const token = bearer(req);
  if (!token) return json({ ok: false, reason: "unauthorized" }, 401);

  const id = (searchParams.get("id") || "").trim();
  try {
    if (id) {
      const res = await fetch(`${anchor.sep24}/transaction?id=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.status === 401 || res.status === 403) return json({ ok: false, reason: "unauthorized" }, 401);
      if (res.status === 404) return json({ ok: false, reason: "not_found" }, 404);
      if (!res.ok) return json({ ok: false, reason: "anchor_unavailable", status: res.status }, 502);
      const data = (await res.json()) as { transaction?: Record<string, unknown> };
      if (!data.transaction) return json({ ok: false, reason: "not_found" }, 404);
      return json({ ok: true, transaction: pick(data.transaction) });
    }
    if (searchParams.get("list")) {
      const kind = searchParams.get("kind");
      const q = new URLSearchParams({ asset_code: "USDC" });
      if (kind === "deposit" || kind === "withdrawal") q.set("kind", kind);
      const res = await fetch(`${anchor.sep24}/transactions?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.status === 401 || res.status === 403) return json({ ok: false, reason: "unauthorized" }, 401);
      if (!res.ok) return json({ ok: false, reason: "anchor_unavailable", status: res.status }, 502);
      const data = (await res.json()) as { transactions?: Record<string, unknown>[] };
      const list = Array.isArray(data.transactions) ? data.transactions.map(pick) : [];
      return json({ ok: true, transactions: list });
    }
  } catch {
    return json({ ok: false, reason: "anchor_unavailable" }, 502);
  }
  return json({ ok: false, reason: "bad_request" }, 400);
}

export async function POST(req: Request) {
  const limited = limit(req, "anchor-sep24-start", 10);
  if (limited) return limited;
  const token = bearer(req);
  if (!token) return json({ ok: false, reason: "unauthorized" }, 401);

  let body: { op?: string; account?: string; amount?: number | string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, reason: "bad_request" }, 400);
  }
  const op = body.op === "withdraw" ? "withdraw" : body.op === "deposit" ? "deposit" : null;
  if (!op) return json({ ok: false, reason: "invalid_op" }, 422);
  const account = (body.account || "").trim();
  if (!StrKey.isValidEd25519PublicKey(account)) return json({ ok: false, reason: "invalid_account" }, 422);
  let amount: number | undefined;
  if (body.amount !== undefined && body.amount !== "") {
    amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 1 || amount > 10_000) return json({ ok: false, reason: "invalid_amount" }, 422);
    amount = Math.round(amount * 100) / 100;
  }

  const anchor = mgAnchor();
  const payload: Record<string, string> = { asset_code: "USDC", account, lang: body.lang === "es" ? "es" : "en" };
  if (amount !== undefined) payload.amount = String(amount);

  let res: Response;
  try {
    res = await fetch(`${anchor.sep24}/transactions/${op}/interactive`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    return json({ ok: false, reason: "anchor_unavailable" }, 502);
  }
  if (res.status === 401 || res.status === 403) return json({ ok: false, reason: "unauthorized" }, 401);
  const data = (await res.json().catch(() => ({}))) as { url?: string; id?: string; type?: string; error?: string };
  if (!res.ok || !data.url || !data.id) {
    return json({ ok: false, reason: "start_failed", status: res.status, message: data.error || null }, 502);
  }
  return json({
    ok: true,
    op,
    id: data.id,
    url: fixRampsUrl(data.url, amount, op),
    url_raw: data.url,
    anchor: anchor.homeDomain,
    network: stellarNetwork(),
  });
}
