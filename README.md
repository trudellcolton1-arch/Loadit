# Loadit.net

**Move Value. Anywhere.**

The marketing site for Loadit — the AI-powered financial rail connecting cash,
cards, crypto, stablecoins, and the future of money.

Built to feel like infrastructure, not a startup landing page: a neural-interface
/ future-OS aesthetic with a live financial universe, an AI routing visualization,
a command-center architecture stack, and a fully interactive routing demo.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** — design system in `tailwind.config.ts`
- **Framer Motion** — scroll-driven storytelling, layout animations, reveals
- **Three.js** + **@react-three/fiber** — the hero's neural/financial-universe field
- **Lenis** — smooth scrolling (auto-disabled for `prefers-reduced-motion`)

## Architecture

```
app/
  layout.tsx            Root layout, fonts, metadata, JSON-LD
  page.tsx              Section composition
  globals.css           Design tokens + glassmorphism utilities
  opengraph-image.tsx   Dynamic OG image
  robots.ts / sitemap.ts / manifest.ts / icon.svg
components/
  Hero.tsx              Animated hero (lazy-loaded 3D background)
  Navbar.tsx / Footer.tsx
  three/NeuralField.tsx Particle network + energy pulses
  sections/             One file per homepage section
  ui/                   Button, Reveal, SectionHeading, Badge, Counter, Logo
  providers/            SmoothScroll (Lenis)
lib/
  constants.ts          All site copy — single source of truth
  seo.ts                FAQ content + JSON-LD graph builder
  utils.ts              cn(), formatUSD(), math helpers
```

All marketing copy lives in `lib/constants.ts` and `lib/seo.ts` so content can be
edited without touching component code.

## Sections

Hero → The Problem (timeline) → AERO AI Routing (live viz) → The Rail
(architecture stack) → How It Works → The Future of Money (expanding cards) →
Live Demo (interactive router) → Security (animated vault) → Roadmap →
Investors (animated metrics) → FAQ → Request Access → Footer.

## SEO

- Server-rendered, statically prerendered homepage (content crawlable without JS)
- Rich metadata, canonical URL, Open Graph + Twitter cards, dynamic OG image
- JSON-LD: `Organization`, `WebSite`, `Product`, and `FAQPage` schemas
- `robots.txt`, `sitemap.xml`, and web app manifest
- Semantic landmarks, accessible labels, AA contrast, reduced-motion support

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
```

## Deploy

Optimized for **Vercel** — zero config. Push the branch and import the repo, or
run `vercel`. Static pages are prerendered; the OG image runs on the edge runtime.
