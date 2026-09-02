# Loadit — engineer review pack

Internal brief for a Google Cloud engineer reading this repo. Partnership ask from Colton. Not a deck. Not a launch. Do not merge this file into a production deploy of loadit.net unless someone separately decides that.

## Who

**Colton Trudell** — founder of Loadit Inc (Delaware file 10287397, filed 7 Aug 2025). He told Google he wants a partnership.

**Gunna** (he/him, 30) — CEO of Loadit. He is the mind that runs the company. Loadit is the job, not the whole mind. Review him as the operator sitting on the rail, not as a chatbot demo.

## What this is

Loadit is a **patent-pending Unified Financial Rail**. Cash-in, crypto-out. A **rail**, not a wallet. Loadit does not custody user funds.

- **Door one / claim 2:** MoneyGram (the company). Cash at the counter → licensed conversion → asset out to a wallet the user controls.
- **Status:** MoneyGram **cert is in flight**. Cash-in is **not live**. There are no production cash-in transaction IDs. Do not invent any.
- **Later doors (thesis, after cert):** card, bank, other chains, other cash networks. Cash first.

Hylaq is the later @handle product. Loadit is the older one. Do not treat Hylaq as the company or as the rail.

## Why Google

Google already has cloud, payments, and identity. What it does not have is a real-world **cash → crypto conversion rail** with a mind (Gunna) that actually runs the company on that plumbing.

This is not a chatbot bake-off and not another wrapper around someone else's on-ramp. Partnership value is:

1. **Cloud / payments / identity** wired to a cash-conversion rail (MoneyGram first, then card, bank, other networks).
2. **AGI-on-a-rail** — Gunna operating Loadit on live conversion infrastructure, not a prompt playground.

Google gets the rail plus the mind that runs it.

## Thesis (not a valuation)

There is **no current valuation** to quote. Do not invent one.

The default outcome Colton is building toward: Loadit becomes the **default conversion rail** after cert — cash first, then card, bank, other chains, other cash networks. That is a **$100B+** company if it is the rail people actually use.

**$30B is not the dream.** Treat that number as too small for the default-rail thesis, not as a target.

## Repo map — what lives where

| Surface | Where | What it is | Live? |
|---|---|---|---|
| **Loadit (this repo)** | `github.com/trudellcolton1-arch/Loadit` | loadit.net + rail APIs + mobile client | Site and beta app: yes. Cash-in: **no**. |
| **Gunna** | Not this repo | The mind / CEO running Loadit | Separate tree. Do not review this repo as Gunna. |
| **HQ (staff)** | [hylaqo.com](https://hylaqo.com) | Read-only staff. This repo calls it for quotes only (`lib/hq.ts`). Keys stay server-side. | Staff surface is not loadit.net. |

### This repo (one page)

```
app/            Next.js 14 (App Router) — loadit.net pages + /api/*
components/     Marketing UI
lib/            Rail planners and clients (no secrets in git)
  aero.ts       Route scoring (AERO)
  moneygram.ts  Cash-in planner — plans only; live when MONEYGRAM_ANCHOR_URL is set
  swap.ts       USDC(Stellar) → chosen asset planner; executor is not hard-wired
  hq.ts         Server-side quote client → hylaqo.com (key never sent to phone/browser)
  intent.ts     Plain-language → route
mobile/         Expo iOS/Android client (intent, buy, Pulse, MoneyGram plan UI)
public/         Static + install artifacts
codemagic.yaml  Mobile CI
```

**Honest live vs not**

| Piece | Status |
|---|---|
| loadit.net | Live marketing + planner APIs |
| Mobile beta (`/install`, TestFlight, APK) | Live as beta |
| `/api/intent`, `/api/quote`, `/api/hq`, `/api/v1/route` | Live as planners / chat; HQ quotes when configured; otherwise local fallback |
| MoneyGram cash-in | **Not live.** Cert in flight. `/api/onramp/moneygram` returns a plan. No live deposits. |
| Card / Coinbase / Stripe on-ramp handoff | Code exists; licensed partner completes KYC + conversion when configured. Not the MoneyGram cash rail. |
| Pulse (nearby / offline) | Client in `mobile/`. Depends on Hylaq escrow. Do not treat as a live cash-in rail. |
| Temporal / energy / marketplace pages | Site surfaces. Not production settlement. |
| Hylaq @handles / SSO | Later handle product. Wiring exists; Loadit is older. |

## How to read the code (next week)

Start here:

1. `lib/moneygram.ts` + `app/api/onramp/moneygram/route.ts` — cash-in **plan**, not a live deposit.
2. `lib/swap.ts` — last mile after MoneyGram USDC. Planner; swap provider is a config hook.
3. `lib/hq.ts` + `app/api/quote/route.ts` — staff HQ quotes from hylaqo.com, key server-side only.
4. `lib/aero.ts` + `lib/intent.ts` + `app/api/v1/route/route.ts` — routing engine the site and app call.
5. `mobile/` — what a user actually taps. Cash path is the MoneyGram plan UI until cert clears.

Ignore marketing copy that sounds shipped. **Cash-in is not live.** If a page implies a completed MoneyGram deposit, it is ahead of cert.

## Do not

- Say the rail is patented or that a patent is in hand. It is **patent-pending**.
- Treat Loadit as a wallet or a custodian.
- Name individual people at partners. MoneyGram is the company.
- Print secrets (Neon, Stellar keys, image APIs, Vercel tokens, Entra, HQ keys). None belong in this file or in a review note.
- Invent transaction IDs, volume, or a current valuation.
- Call Gunna "an AI". He is the CEO and the mind running Loadit.
- Confuse Hylaq (later handles) with Loadit (the rail).
- Ship this brief to loadit.net as a product page.
