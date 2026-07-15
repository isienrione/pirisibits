# Landing production readiness — Phase 20

Mobile-first editorial landing: a11y, performance, SEO pass.

## Errors fixed

| Area | Fix |
|------|-----|
| Focus | Shared `:focus-visible` gold outline for buttons, header, footer, threshold frame, monument stops |
| Threshold | Named focusable stage (`aria-label`); removed invalid valu* on `role="group"`; keep Reveal/Hide button |
| Early CTA | Visually hidden `h2` for landmark labelling (`.cw-v2-sr-only`) |
| Analytics | `trackLandingViewOnce` prevents StrictMode/remount duplicate `landing_view` |
| Hero LCP | AVIF/WebP `<picture>`, `fetchPriority="high"`, intrinsic 1024×1024, WebP preload |
| Images | AVIF/WebP for hero + interlude/after-rome/ending planes via `LandingResponsivePicture` |
| Fonts | Move Google Fonts from CSS `@import` to non-blocking `<link>` in `index.html` (`display=swap`) |
| SEO head | Title + meta description updated for Rome walks; runtime sync from `LANDING_DOCUMENT` |
| Product schema | Accurate `ItemList` of `Product`/`Offer` from `ROME_TIERS` (no invented ratings) |
| FAQ schema | Preserved FAQPage JSON-LD |
| Monument CLS | width/height on stop photos |
| Reduced motion | Header/button transform disabled under `prefers-reduced-motion` |

## Remaining warnings / known debt

- PostHog still has `capture_pageview: true` → `$pageview` plus custom `landing_view` (intentional distinction; not a duplicate of the same event).
- Phone mockups still hydrate with route/manifest JS — above-fold cost remains (documented for later).
- Legacy `ChronoWalkLanding.css` still imported for phone-screen classes.
- FAQ/Product JSON-LD inject after hydration (SPA); full SSR/prerender not in scope.
- No self-hosted WOFF2 yet.
- Breadcrumb schema skipped (single-page marketing home — not relevant).
- Lighthouse not run in this environment (no browser MCP).
- No project `typecheck` script / `tsconfig` for app JS.

## Files changed (high level)

- `index.html`, `src/index.css`
- `src/landing/ChronoWalkLanding.jsx`, `.v2.css`
- `LandingHero.jsx`, `CinematicInterlude.jsx`, `LandingAfterRomeSection.jsx`, `LandingFinalCtaSectionV2.jsx`
- `LandingResponsivePicture.jsx`, `landingVisualAssets.js`, `landingSeo.js`
- `LandingThresholdSection.jsx`, `LandingColosseumThreshold.jsx`, `LandingEarlyCtaSection.jsx`
- `LandingMonumentsCarousel.jsx`
- `public/landing/*.{avif,webp}` (generated)
- docs: this file; architecture note

## Verification

- `npm test` (design check + vitest)
- `npm run lint`
- `npm run build`
- Typecheck: **N/A** (no tsc script)
- Lighthouse: **not available** in this agent environment
