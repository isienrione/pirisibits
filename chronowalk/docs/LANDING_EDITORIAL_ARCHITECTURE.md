# ChronoWalk landing — editorial architecture

Branch: `landing-editorial-restructure`  
Prompt 2 / Phase 2: **restructure section order only** — no wholesale copy rewrite, no component redesign.

## Acts (primary narrative)

| Act | DOM id | Beats |
|-----|--------|------|
| I — The Promise | `#act-promise` | Hero → Emotional interlude → Threshold → Early CTA |
| II — The Experience | `#act-experience` | How it works → Real-moment → Continuous route → Benefits → Free preview |
| III — The Decision | `#act-decision` | Pricing → Why ChronoWalk → Trust → After Rome → FAQ → Cinematic ending → Footer |

Navigation (`LandingSiteHeader`) sits above the acts. Footer sits after Act III.

### Act system (Prompt 17)

- Each act is a `role="region"` with `#act-*` for analytics / deep links (`data-landing-act`).
- Subtle editorial marker (`Act I` + gold hairline + italic name) — **not** an `h2`; H1 remains the hero.
- **Gold Seam** (`GoldSeam.jsx` / `.cw-gold-seam`) precedes Acts II and III as the only transition device — no full-screen interludes, no scroll-jacking.
- Act I marker floats quietly over the hero so the first viewport stays brand-first.
- Act visibility is **not** tracked (no clean existing event; do not invent `landing_act_*`).
- `prefers-reduced-motion`: seam glow removed.

## Mount map

| # | Beat | Component | Section id | Status |
|---|------|-----------|------------|--------|
| Nav | Navigation | `LandingSiteHeader.jsx` | — | Existing |
| 1 | Hero | `LandingHero.jsx` | `#top` | Existing |
| 2 | Emotional interlude | `LandingEmotionalInterludeSection.jsx` | `#interlude` | Scaffold |
| 3 | Threshold | `LandingThresholdSection.jsx` | `#threshold` | Existing (static for now) |
| 4 | Early CTA | `LandingEarlyCtaSection.jsx` | `#early-cta` | Scaffold |
| 5 | How it works | `LandingUserFlowSection.jsx` | `#how-it-works` | Existing |
| 6 | Real-moment | `LandingRealMomentSection.jsx` | `#real-moment` (+ `#who-its-for`) | Phase 7 scenarios |
| 7 | Continuous route | `LandingMonumentsCarousel.jsx` | `#monuments` | Phase 8 journey timeline |
| 8 | Benefits | `LandingBenefitsSection.jsx` | `#benefits` | Phase 9 — What stays with you (once) |
| 9 | Free preview | `LandingTryFreeSection.jsx` | `#try-free` | Phase 10 — sharpened Pantheon preview |
| 10 | Pricing | `LandingRomeTiersSection.jsx` | `#pricing` | Phase 11 — simplified hierarchy |
| 11 | Why ChronoWalk | `LandingWhyChronoWalkSection.jsx` | `#why-chronowalk` (+ `#compare`) | Phase 12 — no matrix |
| 12 | Trust | `LandingTrustProofSection.jsx` | `#trust` | Phase 13 — How we build trust |
| 13 | After Rome | `LandingAfterRomeSection.jsx` | `#after-rome` | Phase 14 — cinematic memory |
| 14 | FAQ | `LandingFaqSectionV2.jsx` | `#faq` (+ `#faq-<id>`) | Phase 15 — anxiety-grouped |
| 15 | Cinematic ending | `LandingFinalCtaSectionV2.jsx` | `#final-cta` | Prompt 16 — film-frame closing |
| 16 | Footer | `LandingSiteFooter.jsx` | — | Existing |

Also: `#rome-journey` deeplink anchor after pricing (legacy).

Shell: `ChronoWalkLanding.jsx`  
Order source of truth: `LANDING_SECTION_ORDER` + `LANDING_ACTS` in `landingData.js`  
Preserved lower: `LANDING_PRESERVED_LOWER_SECTIONS`  
Legacy hashes: `LANDING_LEGACY_DEEPLINK_IDS`

### Copy voice (Phase 18)

Primary live copy lives in `landingData.js`. Voice: intelligent, calm, direct, curious, cinematic. Prefer short confident lines; emotional headlines vs practical body. Avoid travel-marketing clichés (`discover`, `immersive`, `unforgettable`, `sneak peek`, etc.). Pricing amounts and checkout footnote are factual — CTA/badge phrasing only was normalized.

### Responsive (Phase 19)

Mobile-first; tablet band `48–63.99rem` is first-class. See `LANDING_RESPONSIVE.md` for viewport matrix and every fix (header deferred to 64rem, pricing container queries, ending 16∶9→21∶9, etc.).

### Production readiness (Phase 20)

See `LANDING_PRODUCTION_READINESS.md` — focus styles, Threshold a11y, AVIF/WebP + hero preload, font loading, Product + FAQ schema, analytics once-guard.

### Analytics (Phase 21)

Do not change design without measuring. Event catalog, primary funnel, and test instructions: `LANDING_ANALYTICS.md`. Helpers: `landingAnalytics.js` (section context, once-guards). Provider remains PostHog via `track()`.

### Final polish (Phase 22)

Copy + CSS restraint pass only — no new sections. Report: `LANDING_FINAL_QA.md` (files/sections changed, remaining concerns, A/B tests, readiness scores).

## Preserved (not redesigned)

- CTA destinations (`/preview`, `#pricing`, checkout)  
- Pricing logic (`useLandingPrice`, `landingCheckout`, `ROME_TIERS`)  
- FAQ accordion  
- Analytics — PostHog only; see `LANDING_ANALYTICS.md` (`landing_view` → preview/route → pricing → `checkout_open` → `purchase`)  
- Responsive `cw-v2-*` layouts  
- `#who-its-for` resolves inside real-moment scenarios (persona cards removed Phase 7)
- `#compare` resolves inside Why ChronoWalk (comparison matrix removed Phase 12)
- `#trust` is **How we build trust** — product evidence only (see `LANDING_TRUST_PROOF.md`)
- Benefits appear once under `#benefits` as **What stays with you** (see `LANDING_FEATURE_CONSOLIDATION.md`)
- Baseline archive under `archive/v3-premium-baseline-2026-07-14/`

## Next (not this prompt)

- Fresh Rome photography set (hero / interlude / after-rome / ending plates)
- Optional A/B: sticky header CTA treatment (see `LANDING_FINAL_QA.md`)
- Eventual removal of preserved-lower archive once replacements fully cover SEO intent