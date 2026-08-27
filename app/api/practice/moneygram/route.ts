import { NextResponse } from "next/server";
import { limit } from "@/lib/ratelimit";
import {
  mgSandboxConfigured,
  startSandboxDeposit,
  sandboxDepositStatus,
  latestSandboxReport,
} from "@/lib/moneygramSandbox";
import { authorizeStatusRead, isQueryFlagEnabled } from "@/lib/practiceStatusAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * FOUNDER PRACTICE RUN — MoneyGram sandbox leg.
 *
 * POST { amountUsd } → starts a real SEP-24 interactive deposit at MoneyGram's
 * TESTNET anchor and returns their hosted sandbox URL + transaction id.
 * GET ?id=<sep24 id> → live transaction status from the anchor.
 * GET ?latest=1 → read-only snapshot of the latest practice run for Gunna
 *   (secret-gated). Does not start a new MoneyGram transaction unless
 *   start=1 is passed (default false).
 *
 * Test network, test USDC, no real money — the lib refuses to run against
 * the public network, so this endpoint cannot be pointed at production.
 *
 * Gunna (curl):
 *   curl -sS -H "Authorization: Bearer $GUNNA_LOADIT_STATUS_SECRET" \
 *     "https://loadit.net/api/practice/moneygram?latest=1"
 */

const NO_STORE = { "Cache-Control": "no-store" };

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

function parseAmountUsd(raw: string | null): number | null {
  if (raw === null || raw === "") return 20;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 10_000) return null;
  return n;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const latest = isQueryFlagEnabled(searchParams, "latest");
  const start = isQueryFlagEnabled(searchParams, "start");

  if (latest || start) {
    const limited = limit(req, start ? "practice-mg" : "practice-mg-latest", start ? 10 : 30);
    if (limited) return limited;

    const auth = authorizeStatusRead(req);
    if (!auth.ok) {
      const message =
        auth.reason === "gate_unconfigured"
          ? "Set GUNNA_LOADIT_STATUS_SECRET or PRACTICE_KEY to enable this read."
          : "Provide the status secret as Authorization: Bearer, x-gunna-secret, or ?key=.";
      return json({ ok: false, reason: auth.reason, message }, auth.status);
    }

    if (start) {
      const amountUsd = parseAmountUsd(searchParams.get("amountUsd"));
      if (amountUsd === null) {
        return json({ ok: false, reason: "invalid_params", message: "amountUsd must be between 1 and 10000." }, 422);
      }
    }

    try {
      const report = await latestSandboxReport({
        start,
        amountUsd: start ? parseAmountUsd(searchParams.get("amountUsd")) ?? 20 : undefined,
      });
      const status =
        report.reason === "not_configured"
          ? 503
          : report.reason === "public_network"
            ? 403
            : report.reason === "anchor_unavailable"
              ? 502
              : 200;
      return json(report, status);
    } catch {
      return json(
        { ok: false, empty: true, reason: "anchor_unavailable", message: "MoneyGram's testnet anchor was unavailable." },
        502
      );
    }
  }

  const id = (searchParams.get("id") || "").trim();
  if (!id) {
    return json({ configured: mgSandboxConfigured(), mode: "sandbox" });
  }
  const limited = limit(req, "practice-mg-status", 30);
  if (limited) return limited;
  try {
    const s = await sandboxDepositStatus(id);
    return s
      ? json({ ok: true, mode: "sandbox", ...s })
      : json({ ok: false, reason: "not_found" }, 404);
  } catch {
    return json({ ok: false, reason: "anchor_unavailable" }, 502);
  }
}

export async function POST(req: Request) {
  const limited = limit(req, "practice-mg", 10);
  if (limited) return limited;

  if (!mgSandboxConfigured()) {
    return json({ ok: false, reason: "not_configured" }, 503);
  }

  let body: { amountUsd?: number };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, reason: "bad_request" }, 400);
  }
  const amountUsd = Number(body.amountUsd);
  if (!Number.isFinite(amountUsd) || amountUsd < 1 || amountUsd > 10_000) {
    return json({ ok: false, reason: "invalid_params" }, 422);
  }

  try {
    const dep = await startSandboxDeposit(amountUsd);
    return json({ ok: true, mode: "sandbox", ...dep });
  } catch {
    return json({ ok: false, reason: "anchor_unavailable" }, 502);
  }
}
