# ChronoWalk landing — editorial architecture

Branch: `landing-editorial-restructure`  
Phase 2: page architecture (structure + scaffolds). Content craft and Threshold interactivity come later.

## Acts

| Act | Label | Beats |
|-----|--------|------|
| I | The Promise | Hero → Emotional interlude → Threshold → Early CTA |
| II | The Experience | How it works → Real-moment → Continuous route → Benefits → Free preview |
| III | The Decision | Pricing → Trust/proof → FAQ → After Rome → Final CTA → Footer |

Navigation (`LandingSiteHeader`) sits above the acts. Footer sits after Act III.

## Mount map

| # | Beat | Component | Content key | Status |
|---|------|-----------|-------------|--------|
| Nav | Navigation | `LandingSiteHeader.jsx` | `header` | Existing |
| 1 | Hero | `LandingHero.jsx` | `hero` | Existing |
| 2 | Emotional interlude | `LandingEmotionalInterludeSection.jsx` | `interlude` | New scaffold |
| 3 | Threshold | `LandingThresholdSection.jsx` | `threshold` | Existing (static visual — interactive demo later) |
| 4 | Early CTA | `LandingEarlyCtaSection.jsx` | `early-cta` | New scaffold |
| 5 | How the journey works | `LandingUserFlowSection.jsx` | `user-flow` | Existing |
| 6 | Real-moment narrative | `LandingRealMomentSection.jsx` | `real-moment` | New scaffold |
| 7 | Continuous route | `LandingMonumentsCarousel.jsx` | `monuments` | Existing |
| 8 | Essential benefits | `LandingBenefitsSection.jsx` | `benefits` | Existing |
| 9 | Free preview | `LandingTryFreeSection.jsx` | `try-free` | Existing |
| 10 | Pricing | `LandingRomeTiersSection.jsx` | `pricing` | Existing |
| 11 | Selected trust / proof | `LandingTrustProofSection.jsx` | `trust` | New (no fake reviews/metrics) |
| 12 | FAQ | `LandingFaqSectionV2.jsx` | `faq` | Existing |
| 13 | After Rome | `LandingAfterRomeSection.jsx` | `after-rome` | New (letter beat, no invented stats) |
| 14 | Final cinematic CTA | `LandingFinalCtaSectionV2.jsx` | `final-cta` | Existing |
| 15 | Footer | `LandingSiteFooter.jsx` | `footer` | Existing |

Shell: `ChronoWalkLanding.jsx`  
Act regions: `LandingAct.jsx` (`role="region"`, `display: contents`)  
Order source of truth: `LANDING_SECTION_ORDER` + `LANDING_ACTS` in `landingData.js`

## Intentionally demounted (files kept)

- `LandingWhoItsForSection` — persona rail; not in three-act outline  
- `LandingComparisonSection` — full competitor table; replaced by selected trust strip  
- `LandingStickyCta` — still unused  
- `LandingJourneyLetterSection` — superseded by `LandingAfterRomeSection` (avoids letter mock stats)

Baseline snapshot remains at `src/landing/archive/v3-premium-baseline-2026-07-14/`.

## Conversion / analytics (unchanged)

- `landing_view` on mount  
- Preview CTAs → `landing_cta_preview` → `/preview` (header, hero, early CTA, try-free, final)  
- Tier begin → `landing_cta_begin` + `checkout_open`  
- Secondary routes still `#pricing`

## Next phases (not this PR slice)

- Editorial copy pass (one idea per section; cut repeated claims)  
- Restore interactive Threshold or rewrite “Hold to reveal”  
- Hero first-viewport tightening  
- Mobile sticky CTA / focus-visible / SEO
