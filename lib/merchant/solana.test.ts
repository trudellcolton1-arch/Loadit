import assert from "node:assert/strict";
import { test } from "node:test";
import {
  base58Encode,
  base58Decode,
  isValidSolanaAddress,
  newSolanaReference,
  solanaPayUri,
  matchSolanaTransaction,
  SOLANA_NETWORKS,
  solanaRpcUrl,
  solanaUsdcMint,
  type SolanaTransaction,
} from "./solana";

const MERCHANT = "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy";
const DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

test("base58 round-trips arbitrary byte strings, including leading zeros", () => {
  const cases = [
    Uint8Array.from([0, 0, 1, 2, 3]),
    Uint8Array.from([255, 254, 253]),
    Uint8Array.from(Array.from({ length: 32 }, (_, i) => (i * 7) % 256)),
    Uint8Array.from([0]),
  ];
  for (const bytes of cases) {
    const enc = base58Encode(bytes);
    assert.deepEqual(Array.from(base58Decode(enc)!), Array.from(bytes));
  }
  assert.equal(base58Decode("0OIl"), null); // characters outside the alphabet
});

test("Solana address validation: exactly 32 base58 bytes", () => {
  assert.equal(isValidSolanaAddress(MERCHANT), true);
  assert.equal(isValidSolanaAddress(DEVNET_MINT), true);
  assert.equal(isValidSolanaAddress(""), false);
  assert.equal(isValidSolanaAddress("notbase58!@#"), false);
  assert.equal(isValidSolanaAddress("abc"), false);
  // 31 bytes encodes shorter — must be rejected.
  assert.equal(isValidSolanaAddress(base58Encode(Uint8Array.from(Array(31).fill(7)))), false);
  // A Stellar address is not a Solana address.
  assert.equal(
    isValidSolanaAddress("GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"),
    false
  );
});

test("session references are unique valid pubkeys", () => {
  const a = newSolanaReference();
  const b = newSolanaReference();
  assert.notEqual(a, b);
  assert.equal(isValidSolanaAddress(a), true);
  assert.equal(isValidSolanaAddress(b), true);
});

test("Solana Pay URIs carry recipient, amount, mint, reference, and memo", () => {
  const ref = newSolanaReference();
  const uri = solanaPayUri({
    recipient: MERCHANT,
    usdcAmount: "25.00",
    mint: DEVNET_MINT,
    reference: ref,
    label: "Billionaire Warfare",
    message: "Obsidian Mech Skin",
    memo: "lp_0123456789abcdef",
  });
  assert.ok(uri.startsWith(`solana:${MERCHANT}?`));
  const q = new URLSearchParams(uri.slice(uri.indexOf("?") + 1));
  assert.equal(q.get("amount"), "25.00");
  assert.equal(q.get("spl-token"), DEVNET_MINT);
  assert.equal(q.get("reference"), ref);
  assert.equal(q.get("label"), "Billionaire Warfare");
  assert.equal(q.get("message"), "Obsidian Mech Skin");
  assert.equal(q.get("memo"), "lp_0123456789abcdef");
});

/* ---------- transaction matching ---------- */

const CRITERIA = { recipient: MERCHANT, mint: DEVNET_MINT, minUsdc: 25 };

function tx(opts: {
  err?: unknown;
  preAmount?: string;
  postAmount?: string;
  mint?: string;
  owner?: string;
}): SolanaTransaction {
  return {
    blockTime: 1_800_000_000,
    meta: {
      err: opts.err ?? null,
      preTokenBalances: [
        {
          mint: opts.mint ?? DEVNET_MINT,
          owner: opts.owner ?? MERCHANT,
          uiTokenAmount: { amount: opts.preAmount ?? "0" },
        },
      ],
      postTokenBalances: [
        {
          mint: opts.mint ?? DEVNET_MINT,
          owner: opts.owner ?? MERCHANT,
          uiTokenAmount: { amount: opts.postAmount ?? "25000000" },
        },
      ],
    },
  };
}

test("a successful transfer that grows the merchant's USDC by the amount matches", () => {
  assert.equal(matchSolanaTransaction(tx({}), CRITERIA), true);
  // Existing balance + exact amount also matches (delta logic, not absolute).
  assert.equal(
    matchSolanaTransaction(tx({ preAmount: "100000000", postAmount: "125000000" }), CRITERIA),
    true
  );
  // Overpayment matches.
  assert.equal(matchSolanaTransaction(tx({ postAmount: "30000000" }), CRITERIA), true);
});

test("failed transactions never match", () => {
  assert.equal(matchSolanaTransaction(tx({ err: { InstructionError: [0, "Custom"] } }), CRITERIA), false);
  assert.equal(matchSolanaTransaction({ meta: null }, CRITERIA), false);
  assert.equal(matchSolanaTransaction({} as SolanaTransaction, CRITERIA), false);
});

test("wrong mint, wrong owner, or underpayment never matches", () => {
  assert.equal(
    matchSolanaTransaction(tx({ mint: "EPjFWdd5AufqSSqeM2qN1xQ1xvH8gKjXK8Wb3Bf7z7vZ" }), CRITERIA),
    false
  );
  assert.equal(matchSolanaTransaction(tx({ owner: DEVNET_MINT }), CRITERIA), false);
  assert.equal(matchSolanaTransaction(tx({ postAmount: "24500000" }), CRITERIA), false);
  // Half-cent tolerance mirrors the Stellar matcher.
  assert.equal(matchSolanaTransaction(tx({ postAmount: "24996000" }), CRITERIA), true);
});

test("a token drain (negative delta) never matches", () => {
  assert.equal(
    matchSolanaTransaction(tx({ preAmount: "50000000", postAmount: "10000000" }), CRITERIA),
    false
  );
});

test("network config: devnet in test mode, mainnet + Circle mint in live mode", () => {
  assert.equal(SOLANA_NETWORKS.test.network, "solana-devnet");
  assert.equal(SOLANA_NETWORKS.live.network, "solana");
  assert.equal(SOLANA_NETWORKS.live.defaultUsdcMint, "EPjFWdd5AufqSSqeM2qN1xQ1xvH8gKjXK8Wb3Bf7z7vZ");
  assert.equal(SOLANA_NETWORKS.test.defaultUsdcMint, DEVNET_MINT);
  assert.ok(SOLANA_NETWORKS.test.explorerTx("sig").includes("cluster=devnet"));

  // Env overrides for RPC + mint.
  delete process.env.SOLANA_RPC_URL;
  delete process.env.SOLANA_DEVNET_RPC_URL;
  delete process.env.SOLANA_DEVNET_USDC_MINT;
  assert.equal(solanaRpcUrl("live"), "https://api.mainnet-beta.solana.com");
  assert.equal(solanaRpcUrl("test"), "https://api.devnet.solana.com");
  process.env.SOLANA_RPC_URL = "https://rpc.example.com";
  process.env.SOLANA_DEVNET_RPC_URL = "https://devnet.example.com";
  process.env.SOLANA_DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
  try {
    assert.equal(solanaRpcUrl("live"), "https://rpc.example.com");
    assert.equal(solanaRpcUrl("test"), "https://devnet.example.com");
    assert.equal(solanaUsdcMint("test"), DEVNET_MINT);
  } finally {
    delete process.env.SOLANA_RPC_URL;
    delete process.env.SOLANA_DEVNET_RPC_URL;
    delete process.env.SOLANA_DEVNET_USDC_MINT;
  }
});
