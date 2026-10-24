# Loadit Merchant API — accept USDC on your site

Let any site — including a fully static one — sell items for USDC through a
hosted Loadit checkout. **Non-custodial by construction:** the buyer pays USDC
straight to *your* wallet address — on Stellar (with a per-session memo) or on
Solana (via a Solana Pay transfer request carrying a per-session reference).
Loadit never holds, routes, or forwards the funds. Loadit only reads public
ledger records to confirm the payment, then redirects the buyer back to you
and fires a signed webhook.

- **Asset / networks:** USDC on **Stellar** and/or **Solana** — whichever
  settlement addresses your key carries. With both, the buyer picks a network
  on the hosted checkout. Test mode = Stellar testnet / Solana devnet; live =
  the public networks.
- **Fee:** Loadit's standard convenience fee — **0.75% with a $1 minimum** —
  computed and recorded on every session (`fee_usd`). Because settlement is
  non-custodial, the fee is never deducted from the buyer's payment; it is
  billed to the merchant against recorded sessions.
- **Modes:** `test` keys settle on the Stellar **testnet** (free test USDC, no
  real money) and allow `http://localhost` redirect/webhook URLs. `live` keys
  use the public network and Circle's USDC issuer.

---

## 1. Get keys

Keys are minted by the Loadit operator (there is no self-serve signup yet).
You receive two secrets — store both; they are stateless and cannot be looked
up later:

| Secret | Looks like | Used for |
| --- | --- | --- |
| API key | `lk_…` | `x-api-key` header on merchant API calls |
| Webhook secret | `whsec_…` | Verifying the `loadit-signature` header on webhooks |

The API key is bound to your **settlement address(es)** — Stellar, Solana, or
both — and your mode. Buyers' USDC goes directly to those addresses —
double-check them.

- **Stellar:** your wallet must hold a USDC **trustline** (test mode: the
  testnet issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`;
  live: Circle's issuer `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`),
  or payments to it will fail in the buyer's wallet.
- **Solana:** your wallet should already hold an initialized **USDC token
  account** (devnet mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`;
  mainnet: Circle's mint `EPjFWdd5AufqSSqeM2qN1xQ1xvH8gKjXK8Wb3Bf7z7vZ`) —
  most wallets create it on first receive, but some Solana Pay wallets refuse
  to pay a recipient whose token account doesn't exist yet.

<details>
<summary>Operator: minting a key</summary>

```bash
curl -X POST https://loadit.net/api/merchant/v1/keys \
  -H "Authorization: Bearer $MERCHANT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Billionaire Warfare",
    "email": "dev@billionairewarfare.com",
    "stellar_address": "G...MERCHANT_WALLET...",
    "solana_address": "...MERCHANT_SOLANA_WALLET...",
    "mode": "test"
  }'
# At least one of stellar_address / solana_address is required.
# → { merchant_id, api_key, webhook_secret, mode, settlement }
```

Revoke a key by adding its `merchant_id` to the `API_KEYS_REVOKED` env var.
</details>

---

## 2. Create a checkout session

`POST /api/merchant/v1/sessions` with your API key. Call this from a server or
serverless function so the key stays secret (see the snippet in §5).

```bash
curl -X POST https://loadit.net/api/merchant/v1/sessions \
  -H "x-api-key: lk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "amount_usd": 25,
    "order_id": "bw-order-1042",
    "item": { "name": "Obsidian Mech Skin", "sku": "SKIN-OBS-01" },
    "success_url": "https://billionairewarfare.com/store/thanks.html",
    "cancel_url": "https://billionairewarfare.com/store/",
    "webhook_url": "https://billionairewarfare.com/api/loadit-webhook",
    "metadata": { "player_id": "p_883" }
  }'
```

Response (`201`, or `200` with `replayed: true` on an idempotent retry):

```json
{
  "ok": true,
  "replayed": false,
  "session": {
    "id": "lp_9f2c41d6a8b03e71",
    "object": "checkout.session",
    "url": "https://loadit.net/checkout/lp_9f2c41d6a8b03e71",
    "mode": "test",
    "status": "pending",
    "order_id": "bw-order-1042",
    "amount_usd": 25,
    "fee_usd": 1,
    "fee": { "percent": 0.75, "min_usd": 1, "billed_to": "merchant" },
    "usdc_amount": "25.00",
    "settlement": {
      "asset": "USDC",
      "non_custodial": true,
      "options": [
        {
          "network": "stellar-testnet",
          "destination": "G...MERCHANT_WALLET...",
          "memo": "lp_9f2c41d6a8b03e71",
          "usdc_issuer": "GBBD47IF…"
        },
        {
          "network": "solana-devnet",
          "destination": "...MERCHANT_SOLANA_WALLET...",
          "reference": "…unique per-session reference pubkey…",
          "usdc_mint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
        }
      ]
    },
    "expires_at": "2026-10-24T13:57:00Z"
  }
}
```

Redirect the buyer to `session.url`. The hosted page lets the buyer pick a
network (when your key carries both), shows a QR / wallet link for the exact
USDC amount — a SEP-7 link on Stellar (with the session memo), a Solana Pay
transfer request on Solana (Phantom, Solflare, any Solana Pay wallet; the
per-session `reference` is how the payment is found on-chain) — watches the
ledger, and on confirmation sends the buyer to
`success_url?loadit_session_id=<id>&loadit_status=succeeded`.

**Fields**

| Field | Required | Notes |
| --- | --- | --- |
| `amount_usd` | yes | 0.50 – 50,000. The buyer pays exactly this in USDC (1 USDC = $1). |
| `order_id` | yes | Your order reference, 1–64 chars `[A-Za-z0-9_.:-]`. **Idempotency key:** re-creating with the same `order_id` returns the original session. |
| `item.name` | yes | Shown on the checkout (max 80 chars). `sku`, `image_url` optional. |
| `success_url` / `cancel_url` | yes | `https` (test mode also allows `http://localhost`). |
| `webhook_url` | no | Where signed `payment.*` events are POSTed. |
| `metadata` | no | Up to 20 string pairs, echoed back in status and webhooks. |
| `expires_in_minutes` | no | 5–1440, default 60. Unpaid sessions expire. |

## 3. Get payment status

`GET /api/merchant/v1/sessions/:id` with `x-api-key`. Polling this is always
authoritative — it also verifies on-chain settlement server-side, so it works
even if a webhook delivery was missed or the buyer closed the tab after
paying. Terminal statuses: `succeeded` (with `tx_hash` — a Stellar transaction
hash or Solana signature, `paid_network`, `paid_at`) or `expired`.

## 4. Webhooks

On settlement (or expiry) Loadit POSTs a JSON event to your `webhook_url`:

```json
{
  "id": "evt_6f0d…",
  "type": "payment.succeeded",            // or "payment.failed" (failure_reason: "expired")
  "created": "2026-10-24T13:02:11.000Z",
  "livemode": false,
  "data": { "object": { /* the full session: order_id, tx_hash, paid_network, … */ } }
}
```

Every delivery is signed with your `whsec_…` secret:

```
loadit-signature: t=1761310931,v1=<hex HMAC-SHA256(secret, `${t}.${rawBody}`)>
```

Verify before trusting (constant-time compare, reject stale timestamps), and
**check the amount and `livemode`** against your own price list — never ship
goods for a webhook alone without them. Delivery is at-least-once with short
retries; dedupe on `data.object.id` and reconcile with §3 polling if needed.

## 5. Static-site integration (e.g. a Vite/Three.js game on Vercel)

A static site needs two tiny serverless functions so the API key and webhook
secret stay off the client. On Vercel, drop these in `api/`.

**`api/checkout.js` — create a session and redirect:**

```js
// Buy button → location.href = `/api/checkout?item=SKIN-OBS-01`
const CATALOG = {
  "SKIN-OBS-01": { name: "Obsidian Mech Skin", usd: 25 },
  "BUNDLE-GOLD-M": { name: "Gold Bundle (M)", usd: 9.99 },
};

export default async function handler(req, res) {
  const item = CATALOG[req.query.item];
  if (!item) return res.status(404).send("Unknown item");

  const r = await fetch("https://loadit.net/api/merchant/v1/sessions", {
    method: "POST",
    headers: { "x-api-key": process.env.LOADIT_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount_usd: item.usd,
      order_id: `bw-${req.query.item}-${Date.now()}`,
      item: { name: item.name, sku: req.query.item },
      success_url: "https://billionairewarfare.com/store/thanks.html",
      cancel_url: "https://billionairewarfare.com/store/",
      webhook_url: "https://billionairewarfare.com/api/loadit-webhook",
      metadata: { player_id: String(req.query.player || "") },
    }),
  });
  const data = await r.json();
  if (!data.ok) return res.status(502).send("Checkout unavailable");
  res.redirect(303, data.session.url);
}
```

On the static page itself, the entire integration is one line per buy button:

```html
<button onclick="location.href='/api/checkout?item=SKIN-OBS-01&player='+playerId">
  Buy Obsidian Mech Skin — $25
</button>
```

**`api/loadit-webhook.js` — verified fulfillment:**

```js
import crypto from "node:crypto";

function verify(secret, header, rawBody, toleranceSec = 300) {
  const parts = Object.fromEntries(
    (header || "").split(",").map((s) => s.split("=").map((x) => x.trim()))
  );
  const t = Number(parts.t);
  if (!Number.isFinite(t) || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  return (
    typeof parts.v1 === "string" &&
    parts.v1.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected))
  );
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const rawBody = await new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => resolve(b));
  });

  if (!verify(process.env.LOADIT_WEBHOOK_SECRET, req.headers["loadit-signature"], rawBody)) {
    return res.status(400).send("bad signature");
  }

  const event = JSON.parse(rawBody);
  if (event.type === "payment.succeeded") {
    const s = event.data.object;
    // Trust nothing but the signature + your own price list:
    // assert s.livemode === true in production, s.amount_usd matches the SKU.
    // Then grant the item to s.metadata.player_id / your order s.order_id.
    console.log("paid:", s.order_id, s.tx_hash);
  }
  res.status(200).json({ received: true });
}
```

**Env vars on the merchant's Vercel project:** `LOADIT_API_KEY`,
`LOADIT_WEBHOOK_SECRET`.

## 6. Testing end-to-end (test mode)

**Stellar testnet**

1. Get a `test`-mode key bound to a testnet wallet
   ([create + fund one on Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test),
   then add the testnet USDC trustline).
2. Create a session; open `session.url`; pay from a second testnet wallet —
   send the shown USDC amount **with the memo**.
3. The checkout flips to "Payment confirmed", your webhook fires, and
   `GET /sessions/:id` reports `succeeded` with the `tx_hash`.

**Solana devnet**

1. Get a `test`-mode key with a `solana_address` (any devnet wallet; grab
   devnet USDC for the *buyer* wallet from [Circle's faucet](https://faucet.circle.com)).
2. Create a session; open `session.url`; pick Solana; pay via the QR / Solana
   Pay link so the transaction carries the session's `reference`.
3. Same confirmation flow — `tx_hash` is the Solana signature and
   `paid_network` is `solana`.

## 7. Operating it (Loadit side)

Env vars on the loadit.net deployment:

| Var | Required | Purpose |
| --- | --- | --- |
| `AERO_SIGNING_SECRET` | yes (existing) | Signs merchant API keys and derives webhook secrets. Rotating it invalidates all keys. |
| `MERCHANT_ADMIN_TOKEN` | yes | Bearer token guarding `POST /api/merchant/v1/keys`. |
| `MERCHANT_DATABASE_URL` | one of these | Neon Postgres (HTTP SQL endpoint) holding the `loadit_merchant_payment` table — created automatically on first use. Falls back to `HQ_CONTENT_DATABASE_URL`, then `HYLAQ_DATABASE_URL`. |
| `API_KEYS_REVOKED` | no (existing) | Comma-separated kids to revoke. |
| `SOLANA_RPC_URL` | recommended for live | Solana mainnet RPC for settlement verification (defaults to the public `api.mainnet-beta.solana.com`, which is heavily rate-limited — use a provider RPC in production). |
| `SOLANA_DEVNET_RPC_URL` | no | Devnet RPC override (defaults to `api.devnet.solana.com`). |
| `SOLANA_USDC_MINT` / `SOLANA_DEVNET_USDC_MINT` | no | USDC mint overrides, mainly for testing against a custom devnet mint. |

No Stellar or Solana secret keys are needed anywhere — Loadit only reads
public Horizon / RPC data. Fee collection is off-chain: bill merchants from
the recorded `fee_usd` on succeeded sessions (e.g. monthly, straight from the
table).
