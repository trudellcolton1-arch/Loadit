import { NextResponse } from "next/server";
import { AERO_CORS, aeroJson, authorizeAeroApi } from "@/lib/aeroApi";
import { getLedgerBalances, type RailMode } from "@/lib/rail/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/ledger/balances
 *
 * Account balances derived from the immutable double-entry ledger (never
 * from a cached running total). Optional `?mode=live|sim` filters postings
 * to that rail rig; omit to include both. Auth is the same API-key gate as
 * POST /api/v1/route. Read-only — does not move money.
 */

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: AERO_CORS });
}

export async function GET(req: Request) {
  const auth = authorizeAeroApi(req);
  if (!auth.ok) return auth.response;

  const raw = new URL(req.url).searchParams.get("mode");
  let mode: RailMode | undefined;
  if (raw === "live" || raw === "sim") mode = raw;
  else if (raw) {
    return aeroJson({ ok: false, error: "invalid_mode", message: "mode must be live or sim" }, 422);
  }

  const balances = await getLedgerBalances(mode);
  return aeroJson({
    ok: true,
    mode: mode ?? "all",
    balances: balances.map((b) => ({
      account_id: b.accountId,
      code: b.code,
      name: b.name,
      account_type: b.accountType,
      currency: b.currency,
      debit_minor: b.debitMinor,
      credit_minor: b.creditMinor,
      balance_minor: b.balanceMinor,
    })),
    meta: {
      engine: "HQ",
      version: "v1",
      plan: auth.plan,
      settlement: "non_custodial",
      amounts: "integer_minor_units",
      derived_from: "rail_ledger_line",
    },
  });
}
