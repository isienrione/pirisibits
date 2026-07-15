# Landing final design QA — Phase 22

Do not add sections or features here. This is the editorial polish pass contract and readiness report.

The page should feel: emotionally stronger in the first third · clearer in the middle · easier to buy near the end · less defensive · less repetitive · more Rome · less UI-chrome · distinctly ChronoWalk.

## Files changed

| File | Change |
|------|--------|
| `src/landing/landingData.js` | CTA unification, brand eyebrow, softer trust/pricing/try-free copy, de-duplicated mantras, footer polish |
| `src/landing/ChronoWalkLanding.v2.css` | Title casing, gold-diet list seams, phone diet, coral glow restraint, early-cta rhythm, hero/trust/try-free layout |
| `src/landing/LandingTrustProofSection.jsx` | Evidence-only layout; no empty-review apology; no phone mockup |
| `src/landing/LandingEarlyCtaSection.jsx` | Quiet outline CTA after Threshold (not coral) |
| `src/landing/LandingUserFlowSection.jsx` | Comment: copy-first; phones desktop-only via CSS |
| `src/landing/__tests__/landingArchitecture.test.js` | Expectations aligned to Phase 22 copy |
| `src/landing/__tests__/LandingThresholdSection.test.jsx` | Disclaimer assertion match |
| `docs/LANDING_FINAL_QA.md` | This report |
| `docs/LANDING_EDITORIAL_ARCHITECTURE.md` | Phase 22 pointer |
| `docs/LANDING_RESPONSIVE.md` | Hero device breakpoint note (64rem) |

Archive / unused sections were not rewritten.

## Sections changed

| Section | Polish |
|---------|--------|
| Header | Softer coral glow on sticky CTA |
| Hero | Eyebrow `ChronoWalk · Rome`; calm trust line; secondary **See packages**; phone only ≥64rem |
| Early CTA | Unified preview label; short hint; outline button; tighter band |
| Threshold | Slightly quieter disclaimer (evidence stays) |
| How it works | Step-3 body de-duplicated; phones hidden &lt;64rem; copy ordered above device |
| Real moments | De-duplicated “Walk freely…”; prompts muted (not gold); hairline seams |
| Benefits | Unique body copy; hairline seams |
| Try free | Unified CTA; quieter scope lines; phone only ≥64rem |
| Pricing | Shorter intro/subheadline |
| Why ChronoWalk | Distinct headline; points in DM Sans |
| Trust | Evidence-led headline/lead; no pending-reviews note; no phone |
| After Rome | Crop shifted for warmer ground/rooftops feel |
| Ending | Secondary label **See packages** (shared CTA constant) |
| Footer | Tagline + credit lightly tightened |

Unchanged in structure: Interlude, Monuments trail, FAQ accordion, Act markers, Gold Seam placement, checkout prices.

## Remaining concerns

1. **Single Rome plate family** — Hero / interlude / After Rome / ending still share `hero-rome` DNA with crop/filter only. Stronger Rome variety needs new photography (out of polish scope).
2. **Sticky header still competes** with hero coral in the first viewport — intentional for conversion; worth A/B (below).
3. **Monument stop posters** carry most mid-page place imagery; how-it-works remains type-led on phone/tablet by design.
4. **FAQ still teaches** “do not fake certainty” — intentional home for scholarly tone; Threshold disclaimer was shortened instead of removing the FAQ item.
5. **Visual regression / Lighthouse** not run in this environment — verify on device before ship.
6. **Legacy uppercase tracking** may linger on unrelated archive CSS — live v2 titles are sentence case.

## Recommended A/B tests

| Test | A (current) | B | Primary metric |
|------|-------------|---|----------------|
| Hero secondary | `See packages` → `#pricing` | `Explore the route` → `#monuments` | `landing_cta_routes` → `landing_pricing_view` / `checkout_open` |
| Header CTA | Sticky coral always | Outline/ghost until scroll past `#threshold` | `landing_cta_preview` by `section:header` vs `hero` |
| Early CTA | Outline after Threshold | Remove early-cta band (scroll straight to Act II) | Preview starts vs bounce after Threshold |
| Try-free phone | Desktop only | Always show audio mockup | `landing_cta_preview` `section:try-free` |
| Why headline | `Tied to the stones…` | Restore `Walk freely. Keep the context.` | Scroll depth to pricing / `landing_cta_begin` |
| Pricing intro length | Short line | Feature laundry list | `landing_cta_begin` by tier |

Instrument via existing PostHog events in `LANDING_ANALYTICS.md` — do not change design without measuring.

## Readiness scores

Holistic editorial + responsive polish (10 = ship-confident). Not Lighthouse scores.

| Viewport | Score | Notes |
|----------|------:|-------|
| **Mobile** (~390) | **8.5 / 10** | Brand-first hero without phone chrome; CTA diet clearer; Threshold still the tactile peak; Early CTA quieter. Remaining: long Act II scroll, single Rome asset. |
| **Tablet** (48–64rem) | **8.0 / 10** | Phone diet + tablet section rhythm solid; hero stays single-column Rome-first until desktop. Remaining: Act marker / seam stacking at Act I→II join. |
| **Desktop** (≥64rem) | **8.5 / 10** | One hero phone + try-free phone + how-it-works compact phones only where space allows; list gold overuse fixed. Remaining: photography variety; header vs hero coral twin. |

**Overall ship readiness:** ready for measured release; run the A/B tests above before another redesign pass.
