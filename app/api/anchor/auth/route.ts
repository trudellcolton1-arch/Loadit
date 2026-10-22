import { NextResponse } from "next/server";
import { Keypair, StrKey, Transaction, WebAuth } from "@stellar/stellar-sdk";
import { limit } from "@/lib/ratelimit";
import { mgAnchor, NETWORK_PASSPHRASE, stellarNetwork } from "@/lib/anchor";
import { anchorInfo } from "@/lib/anchorToml";
import { CLIENT_DOMAIN, validateClientDomainChallenge } from "@/lib/sep10Guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SEP-10 for the browser wallet — the user's own key signs, Loadit co-signs.
 *
 *   GET  ?account=G...   → fetch a challenge from the anchor (with our
 *                           client_domain), verify it was signed by the
 *                           anchor's published SIGNING_KEY and is addressed to
 *                           that account, return the XDR for the user to sign.
 *   POST { transaction } → the user-signed challenge comes back; we check it
 *                           is still a genuine challenge naming OUR domain,
 *                           add the client_domain signature, submit to the
 *                           anchor, and return the anchor's JWT to the wallet.
 *
 * The server holds no user key and keeps no token. The JWT belongs to the
 * user's Stellar account and lives in their browser session only.
 */

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function domainKeypair(): Keypair | null {
  try {
    return process.env.STELLAR_SIGNING_SECRET ? Keypair.fromSecret(process.env.STELLAR_SIGNING_SECRET) : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const limited = limit(req, "anchor-auth-challenge", 30);
  if (limited) return limited;

  const account = (new URL(req.url).searchParams.get("account") || "").trim();
  if (!StrKey.isValidEd25519PublicKey(account)) return json({ ok: false, reason: "invalid_account" }, 422);

  const anchor = mgAnchor();
  const net = stellarNetwork();
  const info = await anchorInfo();
  if (!info) return json({ ok: false, reason: "anchor_unavailable", message: "The cash network's auth service is unreachable right now. Try again in a minute." }, 502);

  // The anchor only talks to whitelisted wallets: client_domain is mandatory,
  // and the server must be able to co-sign for it.
  const withDomain = Boolean(domainKeypair());
  if (!withDomain) {
    return json({ ok: false, reason: "not_configured", message: "This server cannot sign for the Loadit wallet yet (no signing key)." }, 503);
  }
  const params = new URLSearchParams({ account, client_domain: CLIENT_DOMAIN });

  let res: Response;
  try {
    res = await fetch(`${anchor.webAuth}?${params}`, { cache: "no-store" });
  } catch {
    return json({ ok: false, reason: "anchor_unavailable" }, 502);
  }
  if (!res.ok) return json({ ok: false, reason: "challenge_failed", status: res.status }, 502);
  const ch = (await res.json()) as { transaction?: string; network_passphrase?: string };
  if (!ch.transaction) return json({ ok: false, reason: "no_challenge" }, 502);

  const passphrase = ch.network_passphrase || NETWORK_PASSPHRASE[net];
  if (passphrase !== NETWORK_PASSPHRASE[net]) return json({ ok: false, reason: "network_mismatch" }, 502);

  // Verify the anchor really signed this challenge and it is for this account.
  try {
    const webAuthDomain = new URL(anchor.webAuth).host;
    const read = WebAuth.readChallengeTx(ch.transaction, info.signingKey, passphrase, [anchor.homeDomain], webAuthDomain);
    if (read.clientAccountID !== account) return json({ ok: false, reason: "challenge_account_mismatch" }, 502);
  } catch (e) {
    return json({ ok: false, reason: "challenge_invalid", message: e instanceof Error ? e.message : "invalid challenge" }, 502);
  }

  return json({
    ok: true,
    transaction: ch.transaction,
    network_passphrase: passphrase,
    client_domain: CLIENT_DOMAIN,
    anchor: anchor.homeDomain,
  });
}

export async function POST(req: Request) {
  const limited = limit(req, "anchor-auth-token", 30);
  if (limited) return limited;

  let body: { transaction?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, reason: "bad_request" }, 400);
  }
  const xdr = (body.transaction || "").trim();
  if (!xdr) return json({ ok: false, reason: "missing_transaction" }, 422);

  const net = stellarNetwork();
  const passphrase = NETWORK_PASSPHRASE[net];
  let tx: Transaction;
  try {
    tx = new Transaction(xdr, passphrase);
  } catch {
    return json({ ok: false, reason: "invalid_xdr" }, 422);
  }

  const kp = domainKeypair();
  if (!kp) return json({ ok: false, reason: "not_configured" }, 503);
  const guard = validateClientDomainChallenge(tx);
  if (!guard.ok) return json({ ok: false, reason: guard.reason }, 422);
  tx.sign(kp);

  let res: Response;
  try {
    res = await fetch(mgAnchor().webAuth, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction: tx.toEnvelope().toXDR("base64") }),
      cache: "no-store",
    });
  } catch {
    return json({ ok: false, reason: "anchor_unavailable" }, 502);
  }
  const data = (await res.json().catch(() => ({}))) as { token?: string; error?: string };
  if (!res.ok || !data.token) {
    return json({ ok: false, reason: "token_rejected", status: res.status, message: data.error || null }, 502);
  }
  return json({ ok: true, token: data.token });
}
