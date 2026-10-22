# Loadit wallet (PWA) — loadit.net/app

Installable web app that does the first corridor for real: **cash → USDC** and
**USDC → cash** through the certified cash network's Stellar anchor, with a key
that only exists on the user's device. Built so the production app can ship
before the native build is finished.

## What it is

- **Non-custodial.** The Stellar keypair is generated in the browser and
  encrypted with the user's passphrase (AES-256-GCM, PBKDF2-SHA256 600k) in
  IndexedDB. Loadit's servers never see the seed, the passphrase, a balance,
  or a transaction. There is no account, login, or database row per user.
- **SEP-10 auth.** The wallet asks `/api/anchor/auth` for a challenge. The
  server fetches it from the anchor with `client_domain=loadit.net`, verifies
  it against the anchor's published SIGNING_KEY (`lib/anchorToml.ts`), and
  returns it. The user's key signs in the browser; the server adds the
  client-domain co-signature (`STELLAR_SIGNING_SECRET`, guarded by
  `lib/sep10Guard.ts`) and forwards it. The anchor's JWT is returned to the
  browser and kept in memory only.
- **SEP-24 deposit / withdraw** via `/api/anchor/sep24`, a thin proxy that
  forwards the user's JWT and whitelists response fields. The anchor's hosted
  page opens in a new window (`fixRampsUrl` routes it to the Ramps UI).
  Status is polled every 6 s and translated into a next step. Withdrawals
  end with a USDC payment signed on the device (`lib/wallet/stellar.ts`).
- **Activation** (`/api/wallet/activate`): Friendbot on testnet; on the public
  network a Loadit funder (`STELLAR_FUNDING_SECRET`) sends 2 XLM so the
  account exists and can add the USDC trustline. The anchor also advertises
  `account_creation` and `claimable_balances`, which could remove this step.
- **PWA.** Manifest scoped to `/app` (`display: standalone`), service worker
  `public/app-sw.js` caches the shell and hashed assets, never API calls.
  Auto-locks after 10 minutes idle. `/app` is `noindex`.

## Files

| Path | Purpose |
| --- | --- |
| `app/app/page.tsx`, `layout.tsx` | Server entry (network config → client), PWA metadata |
| `app/app/_components/AppShell.tsx` | State machine: onboarding → backup → unlock → wallet |
| `app/app/_components/useWallet.ts` | Vault, account, balances, SEP-10, SEP-24, payments |
| `app/app/_components/screens.tsx` | Welcome, Create, Backup, Restore, Unlock, Home, Load, CashOut, Receive, Activity, Settings |
| `app/app/_components/TxStatus.tsx` | Live SEP-24 status → plain next step, withdraw completion |
| `app/app/manifest.webmanifest/route.ts` | Scoped manifest |
| `app/api/anchor/auth/route.ts` | SEP-10 challenge (verified) + token |
| `app/api/anchor/sep24/route.ts` | SEP-24 info / start / status / list proxy |
| `app/api/wallet/activate/route.ts` | Account funding |
| `lib/anchor.ts` | Anchor endpoints per network, Horizon URLs, `fixRampsUrl`, `walletNetworkConfig` |
| `lib/anchorToml.ts`, `lib/sep10Guard.ts` | Anchor key cache; challenge guard shared with `sign-challenge` |
| `lib/wallet/{vault,store,stellar}.ts` | Encryption, storage, Horizon + signing helpers |

Tests: `lib/wallet/vault.test.ts`, `lib/anchor.test.ts` (`npm test`).

## Environment

| Var | Where | Purpose |
| --- | --- | --- |
| `STELLAR_NETWORK` | set (testnet) | `public` flips every endpoint to MoneyGram production + Horizon mainnet |
| `STELLAR_SIGNING_SECRET` | set | client_domain co-signature; public key must equal SIGNING_KEY in `public/.well-known/stellar.toml` |
| `LOADIT_CLIENT_DOMAIN` | default loadit.net | client_domain value |
| `STELLAR_FUNDING_SECRET` | **not set** | public-network funder for new accounts (needs XLM) |

## Verified (2026-10-22, preview deployment, testnet)

Create wallet → backup → activate (Friendbot) → USDC trustline (signed on
device, confirmed on Horizon) → SEP-10 with client_domain → SEP-24 deposit
started → MoneyGram sandbox cash-in page opened with the order → status
polled (`incomplete`) → activity listed → reload → wrong passphrase rejected →
unlock → receive QR → manifest + service worker registered. 20/20 checks.

Not verified end to end: a completed deposit (needs the counter simulation
inside MoneyGram's sandbox UI) and a withdrawal (needs test USDC in the wallet).

## Go-live checklist (public network)

1. MoneyGram enables `loadit.net` as a production wallet partner on
   `mgxanchor.moneygram.com` (partner action; 4/5 vs 5/5 wording in the repo
   disagrees — confirm with them).
2. Vercel: `STELLAR_NETWORK=public`; `STELLAR_FUNDING_SECRET` for a funded
   XLM account (≈2 XLM per new wallet); keep `STELLAR_SIGNING_SECRET`.
3. Confirm `/api/anchor/verify` reports `network: public` and SEP-10 succeeds.
4. Decide the Loadit fee mechanism (none is charged today; see below).
5. Legal copy review: the wallet names MoneyGram inside the flow because the
   user has to walk into one; the marketing sites still say "licensed national
   cash network".

## Revenue

The deposit lands USDC directly in the user's wallet; the anchor's fee goes to
the cash network. Loadit earns nothing per transaction in this version.
Options: (a) a revenue share in the MoneyGram agreement, if any; (b) a
Loadit service fee the user signs as a separate USDC payment after a
completed deposit (needs legal review); (c) a spread on the USDC → other
asset swap once a liquidity provider is wired.
