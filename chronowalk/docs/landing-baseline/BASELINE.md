# Landing page baseline — pre editorial restructure

Captured **2026-07-15** on branch `landing-editorial-restructure` before redesign work.

Live implementation remains intact under `src/landing/`. A frozen copy is at:

`src/landing/archive/v3-premium-baseline-2026-07-14/`

Re-capture:

```bash
npm run build && npx vite preview --host 127.0.0.1 --port 4173
# other terminal:
node scripts/capture-landing-baseline.mjs http://127.0.0.1:4173/
```

Requires temporary `puppeteer`, `lighthouse`, and `chrome-launcher` (`npm install --no-save …`).

---

## Screenshots

Source build: local `vite preview` of this branch (H1 matches production `https://chronowalk.com/`).

| Viewport | Above the fold | Full page |
|----------|----------------|-----------|
| 390 × 844 | [screenshots/landing-390x844-above-fold.jpg](./screenshots/landing-390x844-above-fold.jpg) | [screenshots/landing-390x844-full.jpg](./screenshots/landing-390x844-full.jpg) |
| 430 × 932 | [screenshots/landing-430x932-above-fold.jpg](./screenshots/landing-430x932-above-fold.jpg) | [screenshots/landing-430x932-full.jpg](./screenshots/landing-430x932-full.jpg) |
| 768 × 1024 | [screenshots/landing-768x1024-above-fold.jpg](./screenshots/landing-768x1024-above-fold.jpg) | [screenshots/landing-768x1024-full.jpg](./screenshots/landing-768x1024-full.jpg) |
| 1024 × 1366 | [screenshots/landing-1024x1366-above-fold.jpg](./screenshots/landing-1024x1366-above-fold.jpg) | [screenshots/landing-1024x1366-full.jpg](./screenshots/landing-1024x1366-full.jpg) |
| 1440 × 1000 | [screenshots/landing-1440x1000-above-fold.jpg](./screenshots/landing-1440x1000-above-fold.jpg) | [screenshots/landing-1440x1000-full.jpg](./screenshots/landing-1440x1000-full.jpg) |

**Hero copy at capture:** “Walk Rome freely — with the history you'd miss on your own.”

---

## Lighthouse scores

### Production — `https://chronowalk.com/`

| Category | Mobile | Desktop |
|----------|--------|---------|
| Performance | **68** | **56** |
| Accessibility | **95** | **95** |
| Best Practices | **96** | **96** |
| SEO | **92** | **92** |

| Metric | Mobile | Desktop |
|--------|--------|---------|
| FCP | 3.4 s | 4.6 s |
| LCP | 16.9 s | 19.2 s |
| TBT | 0 ms | 0 ms |
| CLS | 0 | 0 |
| Speed Index | 3.4 s | 4.6 s |
| TTI | 17.6 s | 20.1 s |

Top opportunities (both): oversized / non–next-gen images (~6–7 MiB), unused JS (~612 KiB), render-blocking resources (~320 ms).

Raw summary: [lighthouse-production.json](./lighthouse-production.json)

### Local preview — `http://127.0.0.1:4173/` (same branch build)

| Category | Mobile | Desktop |
|----------|--------|---------|
| Performance | **69** | **58** |
| Accessibility | **95** | **95** |
| Best Practices | **100** | **100** |
| SEO | **92** | **92** |

Machine-readable: [capture-meta.json](./capture-meta.json)

---

## Conversion analytics

### Status

Live funnel numbers were **not available** in this environment:

- `VITE_POSTHOG_KEY` is not set locally (only documented in `.env.example`).
- No PostHog personal API key / project credentials were present, so EU PostHog dashboards could not be queried.
- Consent-gated client (`src/lib/track.js` → `https://eu.i.posthog.com`) means browser capture only runs after consent / when a key is present.

### Instrumented landing funnel (code)

Defined in `src/lib/track.js` and fired from `src/landing/ChronoWalkLanding.jsx` (+ threshold demo):

| Event | When | Key props |
|-------|------|-----------|
| `landing_view` | Landing mounts | `source: landing` |
| `landing_cta_preview` | “Try free” / preview CTA | `source`, `preview: pantheon` |
| `landing_cta_begin` | Begin / buy tier CTA | `source`, `tier` |
| `checkout_open` | Checkout URL assigned | `price_cents`, `source`, `tier` |
| `threshold_demo` | Threshold interaction start | `source` |
| `threshold_hold` | Threshold hold complete | hold metadata |
| `purchase` | Purchase completion (app-wide) | host / AB props via `baseProps` |
| `qr_scan` | `?h=` host param on init | host via `baseProps` |
| `landing_scroll_product` | Declared in `TRACK_EVENTS` | **not fired** by current ChronoWalkLanding |

Base properties on every event: `host`, `ab_variant` (price AB cents).

Suggested conversion rates once PostHog is accessible:

1. `landing_view` → `landing_cta_preview` (preview CTR)
2. `landing_view` → `landing_cta_begin` (purchase intent CTR)
3. `landing_cta_begin` → `checkout_open` (checkout handoff)
4. `checkout_open` → `purchase` (paid conversion)
5. Optional: `threshold_demo` / `threshold_hold` engagement on landing

### How to pull live numbers

In PostHog (EU): Insights → Trends / Funnels on the events above, filtered to path `/` or `/landing`, last 7–28 days. Export counts into this folder as `conversion-analytics.json` when credentials are available.

---

## Preserve / revert

Do **not** delete `src/landing/*` during redesign without copying first. Baseline archive:

```bash
cp src/landing/archive/v3-premium-baseline-2026-07-14/* src/landing/
```
