import { NextResponse } from "next/server";
import { Transaction, Keypair, Networks, Operation } from "@stellar/stellar-sdk";
import { limit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SEP-10 client_domain signing service.
 *
 * MoneyGram Ramps (and any Stellar anchor) authenticates a non-custodial wallet
 * with SEP-10. The anchor returns a challenge transaction that includes a
 * `client_domain` ManageData operation, which must be co-signed by the key
 * published as SIGNING_KEY in loadit.net/.well-known/stellar.toml. That
 * signature is what proves the request came from the Loadit wallet — it's the
 * basis of wallet-partner attribution.
 *
 * The private key never leaves the server. The app POSTs the anchor's challenge
 * XDR here; we verify it is a legitimate SEP-10 challenge that carries OUR
 * client_domain (so we can't be tricked into signing an arbitrary transaction),
 * add our signature, and return the re-serialized XDR for the app to submit.
 */

const CLIENT_DOMAIN = process.env.LOADIT_CLIENT_DOMAIN || "loadit.net";
const NETWORK =
  (process.env.STELLAR_NETWORK || "testnet").toLowerCase() === "public"
    ? Networks.PUBLIC
    : Networks.TESTNET;

export function GET() {
  // Non-secret readiness probe for the status page.
  const kp = signingKeypair();
  return NextResponse.json({
    configured: Boolean(kp),
    network: NETWORK === Networks.PUBLIC ? "public" : "testnet",
    client_domain: CLIENT_DOMAIN,
    signing_key: kp ? kp.publicKey() : null,
  });
}

function signingKeypair(): Keypair | null {
  const secret = process.env.STELLAR_SIGNING_SECRET;
  if (!secret) return null;
  try {
    return Keypair.fromSecret(secret);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const limited = limit(req, "anchor-sign", 30);
  if (limited) return limited;

  const kp = signingKeypair();
  if (!kp) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  let body: { challenge?: string; transaction?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  const xdr = (body.challenge || body.transaction || "").trim();
  if (!xdr) return NextResponse.json({ ok: false, reason: "missing_challenge" }, { status: 422 });

  let tx: Transaction;
  try {
    tx = new Transaction(xdr, NETWORK);
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_xdr" }, { status: 422 });
  }

  // Guard: only ever sign a genuine SEP-10 challenge that names OUR client
  // domain. This is what stops the endpoint being abused to sign anything else.
  const guard = validateChallenge(tx);
  if (!guard.ok) {
    return NextResponse.json({ ok: false, reason: guard.reason }, { status: 422 });
  }

  try {
    tx.sign(kp);
    return NextResponse.json({
      ok: true,
      transaction: tx.toEnvelope().toXDR("base64"),
      network_passphrase: NETWORK,
      signer: kp.publicKey(),
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "sign_failed" }, { status: 500 });
  }
}

/**
 * Validate the anchor's SEP-10 challenge before signing:
 *  - sequence number must be 0 (challenge txs are never submitted)
 *  - the first op must be a ManageData auth op ("<home_domain> auth")
 *  - there must be a `client_domain` ManageData op whose value is OUR domain
 * We do NOT verify the anchor's signature here (the app/anchor does that);
 * our only job is to refuse to sign anything that isn't clearly a challenge
 * asking for loadit.net's client_domain attestation.
 */
function validateChallenge(tx: Transaction): { ok: true } | { ok: false; reason: string } {
  if (tx.sequence !== "0") return { ok: false, reason: "not_a_challenge" };
  const ops = tx.operations;
  if (!ops.length) return { ok: false, reason: "no_operations" };
  if (ops[0].type !== "manageData") return { ok: false, reason: "bad_challenge_shape" };

  let hasClientDomain = false;
  for (const op of ops) {
    if (op.type !== "manageData") continue;
    if (op.name === "client_domain") {
      const val = op.value ? op.value.toString("utf8") : "";
      if (val !== CLIENT_DOMAIN) return { ok: false, reason: "wrong_client_domain" };
      hasClientDomain = true;
    }
  }
  if (!hasClientDomain) return { ok: false, reason: "no_client_domain_op" };
  return { ok: true };
}
