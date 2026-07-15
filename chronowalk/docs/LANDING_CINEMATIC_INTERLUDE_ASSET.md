# Cinematic interlude — image asset spec

Used by `CinematicInterlude` (`src/landing/CinematicInterlude.jsx`) for narrative breaks between landing acts.

## Current assets (committed)

Derived from `public/landing/hero-rome.png` (Roman Forum / Colosseum dusk plate already in the repo):

| File | Crop | Size |
|------|------|------|
| `public/landing/interlude-desktop.jpg` | 16:9 | 1600×900 |
| `public/landing/interlude-mobile.jpg` | 4:5 | 960×1200 |
| `public/landing/interlude-lqip.jpg` | tiny LQIP | ~32×18 |

Paths wired in `LANDING_CINEMATIC_INTERLUDE` (`landingVisualAssets.js`).

## Recommended remaster (when shooting / selecting a dedicated plate)

| Criterion | Spec |
|-----------|------|
| Subject | Cinematic Rome street or monument |
| Crowd | Low tourist density |
| Light | Strong directional light (golden hour / dusk preferred) |
| Composition | Enough negative space for centered editorial copy |
| Desktop | 16:9, ≥1920×1080, jpeg/webp |
| Mobile | 4:5 (or 3:4), ≥1080×1350, jpeg/webp |
| Tone | Quiet, atmospheric — not a souvenir collage |

Replace files in place (same filenames) or update `LANDING_CINEMATIC_INTERLUDE` sources.

## Placeholder path (if assets are missing in a fork)

```
/landing/interlude-desktop.jpg
/landing/interlude-mobile.jpg
/landing/interlude-lqip.jpg
```

## Component reuse

```jsx
<CinematicInterlude
  id="interlude-act-ii"
  lines={['Line one.', 'Line two.', 'Line three.']}
  image={LANDING_CINEMATIC_INTERLUDE}
  seam="both"
  parallax
/>
```

Parallax is a few pixels of `translate3d` on scroll (rAF + IntersectionObserver). It is off when `prefers-reduced-motion: reduce` or `parallax={false}`. No scroll-jacking; no animation libraries.
