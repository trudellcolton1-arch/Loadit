import { NextResponse } from "next/server";
import { AERO_CORS, aeroJson, authorizeAeroApi } from "@/lib/aeroApi";
import { getTransferById } from "@/lib/rail/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/transfers/:id
 *
 * Public (API-key) read of one rail transfer: machine state, public status
 * (created / funded / in_transit / paid_out / failed / refunded), and the
 * append-only status history. Amounts in the payload include integer
 * `amount_minor` (USD cents). Auth is the same signed-key gate as
 * POST /api/v1/route. Does not move money.
 */

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: AERO_CORS });
}

export async function GET(req: Request, ctx: { params: { id: string } }) {
  const auth = authorizeAeroApi(req);
  if (!auth.ok) return auth.response;

  const id = (ctx.params?.id || "").trim();
  if (!id) {
    return aeroJson({ ok: false, error: "invalid_id", message: "transfer id is required" }, 422);
  }

  const transfer = await getTransferById(id);
  if (!transfer) {
    return aeroJson({ ok: false, error: "unknown_transfer" }, 404);
  }

  return aeroJson({
    ok: true,
    transfer: {
      id: transfer.id,
      mode: transfer.mode,
      status: transfer.status,
      state: transfer.state,
      amount_minor: transfer.amountMinor,
      fee_minor: transfer.feeMinor,
      net_minor: transfer.netMinor,
      currency: transfer.currency,
      history: transfer.history,
      intent: transfer.intent,
      quote: {
        quoteId: transfer.quote.quoteId,
        amountUsd: transfer.quote.amountUsd,
        loaditFeeUsd: transfer.quote.loaditFeeUsd,
        doorId: transfer.quote.route.doorId,
      },
      intake: transfer.intake
        ? {
            internalRef: transfer.intake.internalRef,
            doorId: transfer.intake.doorId,
            status: transfer.intake.status,
            partnerTxId: transfer.intake.partnerTxId,
          }
        : null,
      receipt: transfer.receipt
        ? {
            receiptRef: transfer.receipt.receiptRef,
            deliveredTo: transfer.receipt.deliveredTo,
            replayed: transfer.receipt.replayed,
            at: transfer.receipt.at,
          }
        : null,
      heal_count: transfer.healCount,
      last_error: transfer.lastError,
    },
    meta: {
      engine: "HQ",
      version: "v1",
      plan: auth.plan,
      settlement: "non_custodial",
      amounts: "integer_minor_units",
    },
  });
}
