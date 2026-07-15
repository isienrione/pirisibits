# Landing trust & proof (Phase 13)

## Principle

Use **product evidence** only. Never invent testimonials, star ratings, user counts, completion rates, popularity percentages, press logos, historians, or research partners.

## Live section

- Component: `src/landing/LandingTrustProofSection.jsx`
- Copy: `LANDING_CONTENT.trust` in `landingData.js`
- DOM: `#trust`
- Placement: Act III after Why ChronoWalk, before FAQ

## What we cite today (repo-backed)

| Proof point | Source in product / repo |
|-------------|--------------------------|
| Uncertainty labeled | Threshold disclaimer + FAQ + waypoint captions |
| Viewpoint-matched reconstructions | Threshold section / FAQ |
| Studio-written scripts for this Rome route | FAQ narration claim (scripts); do **not** claim “human VO / not TTS” |
| No account for Pantheon preview | Try-free + FAQ |
| One-time purchase / no subscription | Hero, pricing, FAQ |
| Ticket honesty | Pricing footnote + FAQ |
| Imagery credits | Public route `/credits` (`imageCredits.js`) |
| Product UI | Live phone mockup (`LandingLivePhoneMockup` threshold variant) |

There is **no** public `/methodology` page. Closest source page: `/credits`.

## Verified reviews integration point

```js
// landingData.js
export const LANDING_VERIFIED_REVIEWS = [
  // {
  //   id: 'unique-id',
  //   quote: '…',
  //   attribution: 'Name or handle',
  //   context: 'optional — Rome · beta',
  // },
]
```

Rules:

1. Only push entries that are **explicitly approved** for marketing.
2. Keep the array empty otherwise — the section shows `verifiedReviewsEmptyNote`.
3. `LandingTrustProofSection` renders quotes only when `LANDING_VERIFIED_REVIEWS.length > 0`.
4. Markup hook: `[data-landing-verified-reviews="pending"|"ready"]`.

## Forbidden

- Remounting `LandingSocialProofSection` without approved `social-proof` data
- Trustpilot / star widgets
- Logo walls without real logo assets and permission
- Absolute “not AI” claims for voice or reconstructions (pipeline uses TTS + AI-informed imagery; captions say so)
