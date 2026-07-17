import { NextResponse } from "next/server";
import { Keypair, Transaction, Networks } from "@stellar/stellar-sdk";
import { mgAnchor } from "@/lib/anchor";
import { limit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live integration self-check — powers the /moneygram/status page's badges.
 *
 * Runs the real SEP-10 handshake against MoneyGram's anchor (challenge → Loadit
 * client_domain co-sign → auth-account sign → JWT), then initiates a SEP-24
 * interactive deposit. Returns which milestones actually pass right now, so the
 * status page can't claim more than is true. Cached 5 min. Needs the testnet
 * auth account secret (STELLAR_AUTH_SECRET) + the client_domain signing secret.
 */

let cache: { ts: number; data: unknown } | null = null;
const TTL = 5 * 60_000;

export async function GET(req: Request) {
  const limited = limit(req, "anchor-verify", 10);
  if (limited) return limited;

  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }

  const authSecret = process.env.STELLAR_AUTH_SECRET;
  const signSecret = process.env.STELLAR_SIGNING_SECRET;
  const anchor = mgAnchor();
  const network =
    (process.env.STELLAR_NETWORK || "testnet").toLowerCase() === "public"
      ? Networks.PUBLIC
      : Networks.TESTNET;

  const result = {
    checkedAt: new Date().toISOString(),
    network: network === Networks.PUBLIC ? "public" : "testnet",
    tomlReachable: false,
    sep10Authenticated: false,
    sep24DepositInitiated: false,
    note: "" as string,
  };

  try {
    // 1. anchor TOML reachable
    const tomlRes = await fetchT(anchor.toml, {}, 6000);
    result.tomlReachable = Boolean(tomlRes && tomlRes.ok);

    if (!authSecret || !signSecret) {
      result.note = "Signing/auth keys not configured on this environment.";
      cache = { ts: Date.now(), data: result };
      return NextResponse.json(result);
    }

    const userKp = Keypair.fromSecret(authSecret);
    const signKp = Keypair.fromSecret(signSecret);

    // 2. SEP-10 challenge
    const chUrl = `${anchor.webAuth}?account=${userKp.publicKey()}&client_domain=loadit.net&home_domain=${anchor.homeDomain}`;
    const ch = await (await fetchT(chUrl, {}, 8000))?.json();
    if (!ch?.transaction) throw new Error("no_challenge");

    // 3. co-sign client_domain + auth account, exchange for JWT
    const tx = new Transaction(ch.transaction, ch.network_passphrase || network);
    tx.sign(signKp); // client_domain signer
    tx.sign(userKp); // auth account
    const tokRes = await fetchT(
      anchor.webAuth,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction: tx.toEnvelope().toXDR("base64") }),
      },
      8000
    );
    const tok = await tokRes?.json();
    if (!tok?.token) throw new Error("no_token");
    result.sep10Authenticated = true;

    // 4. SEP-24 interactive deposit initiation
    const depRes = await fetchT(
      `${anchor.sep24}/transactions/deposit/interactive`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${tok.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ asset_code: "USDC", account: userKp.publicKey(), amount: "20" }),
      },
      8000
    );
    const dep = await depRes?.json();
    result.sep24DepositInitiated = Boolean(dep?.url);
  } catch (e) {
    result.note = `check error: ${String((e as Error)?.message || e).slice(0, 80)}`;
  }

  cache = { ts: Date.now(), data: result };
  return NextResponse.json(result);
}

async function fetchT(url: string, opts: RequestInit = {}, ms = 6000): Promise<Response | null> {
  const c = new AbortController();
  const to = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: c.signal, cache: "no-store" });
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}
