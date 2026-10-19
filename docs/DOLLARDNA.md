# DollarDNA — loadit.net/dollardna

Premium explainer for DollarDNA, Loadit's asset-agnostic provenance framework.
Lives inside the main loadit.net site (same Navbar/Footer/tokens), route `/dollardna`.

## Status rules (do not relax without founder sign-off)

- DollarDNA is **in design**. Nothing on the page may be described as live,
  available, shipped, or integrated. Every operation in "How it works" is
  tagged *Conceptual*; the journey is tagged *Illustrative*.
- The simulation is labeled verbatim: **"Illustrative simulation. Example
  rates. No real funds move."** Rates are examples, people are fictional,
  transaction references are fake.
- No partner, chain, custodian, or exchange is named as an integration.
  Asset families are described as *intended coverage*, not supported today.
- "Hylaq" must not appear anywhere on this page (source or rendered output).
- Patent language: *patent pending*, never *patented*.

## Model (`lib/dollardna.ts`)

- Amounts are integers in each asset's minor unit (sats, cents, USDC micro-units)
  held as `bigint`. Nothing is ever a float.
- Conversions use `mulDivRound` (half-up) and report `rounding` explicitly;
  `gross − fee − rounding = output` is asserted in tests.
- Parcels form a multi-parent / multi-child graph. Consumed parcels remain in
  history and are never counted in holdings or valuation.
- Cross-asset valuation only ever sums after converting each asset at a
  labeled example rate.

Tests: `lib/dollardna.test.ts` (run with `npm test`).

## Files

- `app/dollardna/page.tsx` — metadata, canonical, OG, JSON-LD, section order
- `app/dollardna/opengraph-image.tsx`
- `app/dollardna/_components/{Hero,Journey,Sections,FinalCta,Bits}.tsx`
- `lib/dollardna.ts`, `lib/dollardna.test.ts`
- Wiring: `lib/constants.ts` (NAV_LINKS), `app/sitemap.ts`, `middleware.ts` (RESERVED)

## Review checklist

- [ ] Copy reviewed for availability claims (see Status rules)
- [ ] Decide whether DollarDNA belongs in the desktop primary nav (today: mobile menu + footer only)
- [ ] Confirm asset-family wording in "Built for more than dollars"
- [ ] Production deploy — requires explicit authorization
