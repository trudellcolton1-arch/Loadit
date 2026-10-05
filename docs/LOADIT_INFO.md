# Loadit.info — investor site

## Architecture

Hostname-routed inside the single Next.js app, like loaditglobal.com (`/global`),
loadit.world (`/world`), and load.club (`/club`): `middleware.ts` maps `loadit.info`
and `www.loadit.info` to `app/info/*`, with per-host `robots.txt` and `sitemap.xml`.
Copies reachable at `/info` on other hosts (used for previews) get
`X-Robots-Tag: noindex, nofollow` from middleware, and every canonical points at
`https://loadit.info`, so there is one indexable copy.

| Path | Purpose |
| --- | --- |
| `app/info/_lib/claims.ts` | **Server-only** registry of investor claims with internal `source`, `asOf`, `status`, `approved`. Only approved `text` renders. Throws if bundled for the client. |
| `app/info/_lib/content.ts` | Client-safe constants, nav, and the route explorer's data/status logic |
| `app/info/_components/*` | Hero, Problem, HowItWorks (+ `RouteExplorer` client), MarketEntry, Progress, BusinessModel, Roadmap, Differentiation, Leadership, FAQ, Contact (+ `InquiryForm` client), nav, footer, JSON-LD |
| `app/api/investor-inquiry/route.ts` | Form backend: server validation, honeypot, 5/min/IP rate limit, Resend delivery, optional `INVESTOR_WEBHOOK_URL` forward. Returns `ok:true` only when Resend accepts. |
| `lib/investorInquiry.ts` (+ `.test.ts`) | Pure validation + email formatting, unit-tested |
| `app/info/{robots.txt,sitemap.xml}/route.ts`, `opengraph-image.tsx`, `not-found.tsx`, `[...rest]/page.tsx` | Per-host SEO, share card, branded 404 |

## Preview

- Local: `npm run build && npx next start -p 3999`, then
  `curl -H 'Host: loadit.info' http://127.0.0.1:3999/` or open `http://127.0.0.1:3999/info`.
- Deployed: `https://loadit.net/info` (noindex) until DNS points `loadit.info` at Vercel.

## Deployment steps (remaining)

1. Vercel → project `loadit` → Settings → Domains: add `loadit.info` and `www.loadit.info`
   (www redirects to apex). The session attaches these via the API when authorized.
2. DNS at the registrar (proxy off if Cloudflare): `A @ 76.76.21.21`, `CNAME www cname.vercel-dns.com`.
3. Env (already present on the project): `RESEND_API_KEY`, optional `LEADS_TO`, `LEADS_FROM`,
   optional `INVESTOR_WEBHOOK_URL` for a CRM. Without `RESEND_API_KEY` the form returns
   `503 not_configured` and shows the direct email — it never silently discards.
4. Recommended: verify `loadit.net` in Resend and set `LEADS_FROM` so inquiries arrive from a
   Loadit address rather than Resend's onboarding sender.

## Form behaviour

- Fields: name, email (required); firm, investor type, message (optional); hidden honeypot.
- 422 with per-field errors → shown inline, announced via `aria-invalid`/`aria-describedby`.
- 429 (rate limit), 502 (Resend failed), 503 (not configured) → honest error with `mailto:`.
- Success only after Resend returns 2xx. Logs contain no name, email, or message.
- Analytics: one event `investor_inquiry_submitted` with investor type only.
- Submitting never grants data-room access; access is granted individually at loadit.net/data-room.

## Internal claims checklist (not published)

Omitted or unresolved — add to `claims.ts` with a source when available:

| Claim | Why omitted |
| --- | --- |
| Cash-network partner name | Founder asked it not appear publicly (2026-09-11). Public copy says "licensed national cash network". |
| Patent filing date / application number | Not in an approved public source. Site says "filed", "pending", "25 claims". |
| Team beyond the founder, bios, photos | No verified roster or approved bios. Only "Colton Trudell — Founder, CEO & Chairman" (from the founder-authored Global company page). |
| Users, transactions, volume, revenue | None exist; site states pre-launch / no customer revenue. |
| Round size, valuation, instrument, use of funds | Not approved. No fundraising terms appear. |
| Market size (TAM/SAM) | No sourced figures approved. |
| Production-app or cash-in launch dates | Not committed. Roadmap is dependency-ordered, undated. |
| Fee economics / margins | Only intended fee levels (already public on loadit.net) are shown, labeled intent. No margins. |
| "Book a conversation" scheduling link | No scheduling destination exists; CTA is the form + email. |
| Legal opinions / licensing analysis | FAQ says in preparation, available under NDA when ready. |

Status vocabulary on the site: **Available today** (exists and can be shown),
**In testing** (prototype or pre-launch), **Planned** (intended, not built).
