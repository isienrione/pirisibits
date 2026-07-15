# Landing cinematic planes

Full-bleed Rome photography for hero, Act I interlude, After Rome, and the final ending — **four distinct plates**, not one crop family.

## Wired slots

| Export | Path | Default subject |
|--------|------|-----------------|
| `LANDING_HERO` | `public/landing/cinematic/hero/` | Forum dusk + Colosseum (`hero-rome.png`) |
| `LANDING_CINEMATIC_INTERLUDE` | `…/interlude/` | Colosseum exterior |
| `LANDING_AFTER_ROME` | `…/after-rome/` | Castel Sant’Angelo from Ponte |
| `LANDING_ENDING` | `…/ending/` | Trevi Fountain |

Each slot ships `desktop` / `mobile` JPG + WebP + AVIF + `lqip.jpg`. Sources live in `landingVisualAssets.js` via `cinematicPlane()`.

## Swap in dusk masters (recommended)

Your blue-hour aerials / lit Colosseum / Castel reflections / Trevi night / Trastevere / Victor Emmanuel plates belong here:

1. Save as:
   - `public/landing/cinematic/_masters/hero.jpg`
   - `public/landing/cinematic/_masters/interlude.jpg`
   - `public/landing/cinematic/_masters/after-rome.jpg`
   - `public/landing/cinematic/_masters/ending.jpg`
2. From `chronowalk/`:

```bash
npm run prepare:landing-cinematic
```

See `_masters/README.md` for suggested subject mapping.

## Component reuse (interlude)

```jsx
<CinematicInterlude
  id="interlude-act-i"
  lines={['…']}
  image={LANDING_CINEMATIC_INTERLUDE}
  seam="both"
  parallax
/>
```

Parallax is a few pixels of `translate3d` on scroll (rAF + IntersectionObserver). Off when `prefers-reduced-motion: reduce` or `parallax={false}`.

## Legacy root files

`public/landing/interlude-desktop.jpg` (and mobile / lqip) remain for older forks; live landing reads `cinematic/interlude/*` only.
