# Loadit — Mobile App (iOS + Android)

Native app for **cash/card → crypto, routed the cheapest way by AERO/HQ**.
Built with **Expo (React Native)**. Ships to the App Store + Google Play, and is
**Codemagic-buildable** (`../codemagic.yaml`).

## What it does

1. **Login with Hylaq** (OIDC/PKCE) — or continue as guest until Hylaq is wired.
2. **AI Intent Router** — say what you want in plain language; it calls the live
   Loadit backend (`/api/intent`) and shows the real, cheapest route.
3. **Buy** — you enter *your own* wallet address, HQ picks the licensed on-ramp
   (**Stripe Crypto** or **Coinbase Onramp**), and the provider's hosted flow
   opens in-app. They do KYC + the conversion and deliver crypto straight to
   your wallet.

> **Non-custodial by design.** Loadit never holds, converts, or transmits funds.
> Licensed partners (Stripe, Coinbase) are the money transmitters. This is what
> keeps Loadit out of money-transmitter licensing — do not add any flow where
> funds pass through Loadit.

## Architecture

The app is a thin native client over the **existing Next.js backend** at
`loadit.net`. No separate server to run.

```
app/         expo-router screens: login, index (Intent Router), buy (on-ramp)
lib/         config, api client, Hylaq auth, auth context
app.json     Expo config (bundle ids: net.loadit.app, scheme: loadit)
```

Backend endpoints it uses (already deployed): `/api/intent`, `/api/v1/route`,
`/api/onramp/coinbase`, `/api/onramp/stripe`.

## Configure

Edit `app.json → expo.extra`:

- `apiBase` — backend base URL (default `https://loadit.net`).
- `hylaq.issuer` + `hylaq.clientId` — from hylaq.com's OAuth/OIDC app (public
  PKCE client; **no client secret in the app**). Redirect URI to register:
  `loadit://redirect`.

Backend env (in Vercel) for the on-ramps:

- `COINBASE_ONRAMP_APP_ID` — Coinbase Developer Platform → Onramp.
- `STRIPE_SECRET_KEY` — enables the Stripe Crypto Onramp session endpoint.

## Run locally

```bash
cd mobile
npm install
npx expo start           # scan QR with Expo Go, or:
npm run ios              # needs Xcode
npm run android          # needs Android Studio
```

## Build on Codemagic

`codemagic.yaml` (repo root) defines two workflows: **Loadit Android** and
**Loadit iOS**. They run `expo prebuild` then a native gradle/Xcode build.

One-time in the Codemagic UI:

- **Android** — upload your upload-keystore as reference `loadit_keystore`.
  For Play publishing, add a service-account JSON as env var `GOOGLE_PLAY_SA`
  (group `loadit_env`) and uncomment the `google_play:` block.
- **iOS** — add an App Store Connect API key integration named `Loadit ASC`;
  ensure the bundle id `net.loadit.app` exists in your Apple account.
- Create env group `loadit_env` for any extra secrets.

Then trigger a build — artifacts (`.aab` / `.ipa`) are emailed and can auto-ship
to Google Play (internal) and TestFlight.

### Alternative: EAS

`eas.json` is included if you prefer Expo's cloud builds:
`npx eas-cli build --platform all --profile production`.

## Store checklist

- App icons + splash: add `assets/icon.png` (1024²) and reference in `app.json`.
- Privacy: both stores need a privacy policy URL and data-collection disclosure
  (you collect email via Hylaq; on-ramp KYC is handled by the provider).
- Apple review: the app has real functionality (routing + buy), which satisfies
  guideline 4.2 — don't ship it as a bare website wrapper.
