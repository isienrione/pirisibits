# Landing conversion analytics — Phase 21

Do not change design without measuring whether it helps. This doc is the contract for funnel measurement.

Provider: **PostHog** (`src/lib/track.js`) — no new analytics dependency.  
Consent: `cw_analytics_consent` — `track()` is a no-op until `initAnalytics()` runs (key present + not declined).

## Primary funnel

```
landing_view
  → landing_cta_preview   OR   landing_route_view
  → landing_pricing_view  /  landing_cta_begin
  → checkout_open
  → purchase
```

Suggested PostHog funnels:

1. `landing_view` → `landing_cta_preview` → `preview_start` (preview path)
2. `landing_view` → `landing_route_view` → `landing_pricing_view` → `landing_cta_begin` → `checkout_open` → `purchase` (buy path)

## Event catalog

| Event | When | Payload (plus `host`, `ab_variant`) | Dupes avoided |
|-------|------|--------------------------------------|---------------|
| `landing_view` | Landing mount | `source: landing` | Once per SPA session |
| `landing_cta_preview` | Free preview CTA | `section`, `preview: pantheon`, `cta: preview` | Per click (expected) |
| `landing_cta_routes` | Explore routes / Keep the stories → `#pricing` | `section`, `cta: routes`, `target: pricing` | Per click |
| `threshold_demo` | Threshold start / complete | `section: threshold`, `action`, `via` (`hold`\|`button`), `waypoint_id` | Start once until reset; complete once |
| `threshold_hold` | Hold complete / cancelled | `section`, `action`, `via`, `duration_ms`, `waypoint_id` | — |
| `landing_route_view` | Monuments section ~35% visible | `section: monuments` | Once |
| `landing_route_expand` | Expand/collapse stop list | `section`, `expanded` | Per toggle |
| `landing_pricing_view` | Pricing section visible | `section: pricing` | Once |
| `landing_cta_begin` | Pricing card CTA | `section: pricing`, `tier`, `cta: begin` | Per click |
| `checkout_open` | Checkout URL assigned | `section: pricing`, `tier`, `price_cents` | Per handoff |
| `landing_faq_open` | FAQ question opened | `section: faq`, `question_id`, `group_id?` | Per open (not close) |
| `preview_start` | Preview page mount | `source: preview` (app) | App-owned |
| `purchase` | Access token success | `source` from access flow | App-owned |

`landing_scroll_product` remains in `TRACK_EVENTS` as **deprecated** (use `landing_pricing_view`).

### Section values

`hero` · `header` · `early-cta` · `threshold` · `monuments` · `try-free` · `pricing` · `faq` · `final-cta` · `after-rome`

### What we never send

Emails, names, payment tokens, card data, FAQ answer text, free-form inputs.

### Checkout return / completed

- **Checkout initiated:** `checkout_open` from landing.
- **Completed:** existing `purchase` on access confirmation (`AccessScreen` / access flow) when Lemon redirects to the access URL.
- No separate “checkout_returned” event yet — use PostHog session paths + `purchase` with `source`.

## Implementation map

| UI | Module API |
|----|------------|
| Shell mount | `trackLandingView()` |
| Hero / header / early / try-free / final preview | `trackLandingPreviewCta(section)` |
| Hero / try-free / final / after-rome routes links | `trackLandingRoutesCta(section)` |
| Threshold | `trackLandingThresholdStart/Complete/Cancelled` |
| Monuments | `trackLandingRouteView`, `trackLandingRouteExpand` |
| Pricing | `trackLandingPricingView`, `trackLandingPricingCta`, `trackLandingCheckoutOpen` |
| FAQ | `trackLandingFaqOpen` |

Code: `src/landing/landingAnalytics.js` · constants also on `TRACK_EVENTS` in `src/lib/track.js`.

## Test instructions

### Automated

```bash
cd chronowalk
npm test -- --run src/landing/__tests__/landingAnalytics.test.js src/landing/__tests__/LandingThresholdSection.test.jsx
```

### Manual (local, with PostHog key + consent accepted)

1. Open `/` or `/landing` with DevTools → Network filtered to `eu.i.posthog.com`.
2. Confirm one `landing_view`.
3. Click hero primary → `landing_cta_preview` with `section: hero`, then on `/preview` → `preview_start`.
4. Reload; click hero secondary → `landing_cta_routes` with `section: hero`.
5. Scroll to route → one `landing_route_view`; expand stops → `landing_route_expand`.
6. Scroll to pricing → one `landing_pricing_view`; click a tier CTA → `landing_cta_begin` + `checkout_open` with matching `tier`.
7. Open an FAQ item → `landing_faq_open` with `question_id`.
8. Decline analytics consent → no further `capture` calls.

### PostHog UI

Insights → Funnel using the primary funnel events; filter path `/` or `/landing`; break down `landing_cta_preview` by `section` and `landing_cta_begin` by `tier`.
