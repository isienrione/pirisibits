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

1. **Cinematic variety shipping** — Hero / interlude / After Rome / ending now use four distinct plates under `public/landing/cinematic/` (Forum dusk, Colosseum, Castel, Trevi). Drop dusk masters into `_masters/` + `npm run prepare:landing-cinematic` to swap in blue-hour panoramas without code changes.
2. **Sticky header still competes** with hero coral in the first viewport — intentional for conversion; deprioritized vs the four post-launch tests in `LANDING_POST_LAUNCH_AB.md`.
3. **Monument stop posters** carry most mid-page place imagery; how-it-works remains type-led on phone/tablet by design.
4. **FAQ still teaches** “do not fake certainty” — intentional home for scholarly tone; Threshold disclaimer was shortened instead of removing the FAQ item.
5. **Visual regression / Lighthouse** not run in this environment — verify on device before ship.
6. **Legacy uppercase tracking** may linger on unrelated archive CSS — live v2 titles are sentence case.

## Recommended A/B tests (after launch)

**Do not test everything at once.** Authoritative plan: [`LANDING_POST_LAUNCH_AB.md`](./LANDING_POST_LAUNCH_AB.md).

| # | Test | A | B | Measure |
|---|------|---|---|---------|
| 1 | Hero positioning | *Walk until the city starts talking.* **(live)** | *Walk Rome freely—with the history you’d miss on your own.* | Preview-start · route-view · checkout-start |
| 2 | Early Threshold placement | Immediately after hero/interlude **(live)** | After How It Works | Threshold completion · preview-start · scroll depth · checkout-start |
| 3 | Primary CTA | *Try one stop free* **(live)** | *Hear the Pantheon free* | Preview-start · preview completion · paid conversion |
| 4 | Pricing order | Central → Ancient → Complete **(live)** | Complete → Ancient → Central | Product mix · AOV · checkout conversion |

Hero control is Test 1 **A**. Run A vs B in PostHog before another headline rewrite.

Instrument via existing PostHog events in `LANDING_ANALYTICS.md` — do not change design without measuring.

## Target page (what “done” feels like)

Visitor needs something to do in Rome → hero **curious** → cinematic **feel** → Threshold **different** → How It Works **clear** → Real Moments **relevant** → route **substance** → benefits **risk off** → preview **certainty** → pricing **easy choice** → trust **doubts** → After Rome **emotional value** → final CTA **memory**, not function.

That sequence is the Founder Playbook implementation order already reflected in the live mount map.

## Readiness scores

Holistic editorial + responsive polish (10 = ship-confident). Not Lighthouse scores.

| Viewport | Score | Notes |
|----------|------:|-------|
| **Mobile** (~390) | **8.5 / 10** | Brand-first hero without phone chrome; CTA diet clearer; Threshold still the tactile peak; Early CTA quieter. Remaining: long Act II scroll, single Rome asset. |
| **Tablet** (48–64rem) | **8.0 / 10** | Phone diet + tablet section rhythm solid; hero stays single-column Rome-first until desktop. Remaining: Act marker / seam stacking at Act I→II join. |
| **Desktop** (≥64rem) | **8.5 / 10** | One hero phone + try-free phone + how-it-works compact phones only where space allows; list gold overuse fixed. Remaining: photography variety; header vs hero coral twin. |

**Overall ship readiness:** ready for measured release; run Tests 1→4 in `LANDING_POST_LAUNCH_AB.md` sequentially before another redesign pass.
