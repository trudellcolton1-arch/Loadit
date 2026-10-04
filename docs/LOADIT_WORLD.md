# Loadit.world — architecture and deployment

Loadit.world is the vision site. It lives in this repository at `app/world/*` and is
served on `loadit.world` by the same hostname middleware that serves
`loaditglobal.com` (`/global`), `load.club` (`/club`), and `load.money` (pay links).

## Why hostname routing, not a monorepo split

- It is the pattern three sibling domains already use here; one Vercel project, one build.
- Shares Tailwind tokens, `Reveal`, the OG renderer, and fonts with zero duplication.
- Cannot change loadit.net's routes or bundle: everything is under `app/world`, plus one
  additive host match in `middleware.ts`.
- Trade-off: no independent deploy. If that is ever needed, `app/world` lifts into its own
  Next app unchanged (it imports only `@/components/ui/Reveal`, `@/lib/utils`, `@/lib/og`).

## What is where

| Path | Purpose |
| --- | --- |
| `app/world/_lib/world.ts` | All content and the network data model (nodes, routes, stack, phases, use cases, status system) |
| `app/world/_components/` | Hero + canvas globe, fragmentation scene, layer diagram, intent, route builder, stack, audiences, developers, world map, roadmap, end state, nav, footer, JSON-LD |
| `app/world/layout.tsx` | Metadata (metadataBase `https://loadit.world`), manifest, viewport, global styles |
| `app/world/{robots.txt,sitemap.xml,manifest.webmanifest}/route.ts` | Per-host SEO + PWA files, routed by middleware |
| `app/world/opengraph-image.tsx` | Social card via the shared `lib/og` renderer |
| `app/world/[...rest]/page.tsx` + `not-found.tsx` | World-branded 404 for unknown paths |
| `middleware.ts` | `loadit.world` / `www.loadit.world` → `/world/*`; www → apex 308 |

## Truthfulness system

Every route, layer, phase, and example carries a status: `live`, `building`, or `vision`
(`StatusBadge`). Route statuses are derived in `buildRoute()` from what actually exists:
card → digital asset is live; cash → digital and bank → digital are building; anything
ending in cash, a bank account, or merchant settlement is vision. Change the data, not the
components, when capabilities change.

## Vercel setup

The site deploys with the existing `loadit` project. Steps:

1. Vercel → project `loadit` → Settings → Domains → add `loadit.world` and `www.loadit.world`
   (set www to redirect to the apex). This is also done via the API in the deploy session.
2. DNS at the registrar / Cloudflare, proxy off (grey cloud):
   - `A     @    76.76.21.21`
   - `CNAME  www  cname.vercel-dns.com`
3. No new environment variables are required.
4. Verify after propagation:
   - `https://loadit.world/` renders the world, `https://www.loadit.world/` 308s to the apex
   - `https://loadit.world/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/opengraph-image`
   - an unknown path renders the World 404, not loadit.net's

Until DNS resolves, the site is viewable at `https://loadit.net/world`.

## Local verification

```bash
npm run build && npx next start -p 3999
curl -s -H 'Host: loadit.world' http://127.0.0.1:3999/ | grep -o '<title>[^<]*'
curl -s -H 'Host: loadit.world' http://127.0.0.1:3999/robots.txt
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: loadit.net' http://127.0.0.1:3999/   # unchanged
```
