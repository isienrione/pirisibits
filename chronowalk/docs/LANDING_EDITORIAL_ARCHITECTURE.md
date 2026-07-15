# ChronoWalk landing — editorial architecture

Branch: `landing-editorial-restructure`  
Prompt 2 / Phase 2: **restructure section order only** — no wholesale copy rewrite, no component redesign.

## Acts (primary narrative)

| Act | DOM id | Beats |
|-----|--------|------|
| I — The Promise | `#act-promise` | Hero → Emotional interlude → Threshold → Early CTA |
| II — The Experience | `#act-experience` | How it works → Real-moment → Continuous route → Benefits → Free preview |
| III — The Decision | `#act-decision` | Pricing → Trust/proof → FAQ → After Rome → Final CTA → Footer |

Navigation (`LandingSiteHeader`) sits above the acts. Footer sits after Act III.

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
| 7 | Continuous route | `LandingMonumentsCarousel.jsx` | `#monuments` | Existing |
| 8 | Benefits | `LandingBenefitsSection.jsx` | `#benefits` | Existing |
| 9 | Free preview | `LandingTryFreeSection.jsx` | `#try-free` | Existing |
| 10 | Pricing | `LandingRomeTiersSection.jsx` | `#pricing` | Existing |
| 11 | Trust / proof | `LandingTrustProofSection.jsx` | `#trust` | Scaffold |
| 12 | FAQ | `LandingFaqSectionV2.jsx` | `#faq` | Existing |
| — | Comparison (preserved lower) | `LandingComparisonSection.jsx` | `#compare` | Existing, moved lower |
| 13 | After Rome | `LandingAfterRomeSection.jsx` | `#after-rome` | Scaffold (`#letter` anchor above) |
| 14 | Final CTA | `LandingFinalCtaSectionV2.jsx` | `#final-cta` | Existing |
| 15 | Footer | `LandingSiteFooter.jsx` | — | Existing |

Also: `#rome-journey` deeplink anchor after pricing (legacy).

Shell: `ChronoWalkLanding.jsx`  
Order source of truth: `LANDING_SECTION_ORDER` + `LANDING_ACTS` in `landingData.js`  
Preserved lower: `LANDING_PRESERVED_LOWER_SECTIONS`  
Legacy hashes: `LANDING_LEGACY_DEEPLINK_IDS`

## Preserved (not redesigned)

- CTA destinations (`/preview`, `#pricing`, checkout)  
- Pricing logic (`useLandingPrice`, `landingCheckout`, `ROME_TIERS`)  
- FAQ accordion  
- Analytics (`landing_view`, `landing_cta_preview`, `landing_cta_begin`, `checkout_open`)  
- Responsive `cw-v2-*` layouts  
- Comparison content (moved lower, not deleted)
- `#who-its-for` resolves inside real-moment scenarios (persona cards removed Phase 7)
- Baseline archive under `archive/v3-premium-baseline-2026-07-14/`

## Next (not this prompt)

- Editorial copy pass  
- Interactive Threshold or honest static rewrite  
- Hero first-viewport tightening  
- Eventual removal of preserved-lower sections once replacements fully cover SEO intent
