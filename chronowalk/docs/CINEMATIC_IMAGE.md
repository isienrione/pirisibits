# Cinematic Image Presentation

Photos in ChronoWalk should feel like stills from a film — never bright tourism snapshots.
**Assets stay the same**; presentation does the work.

## Components

| Component | Use |
|-----------|-----|
| `CinematicImage` | Inset stills, thumbs, card media |
| `PhotoHero` | Full-bleed immersive backgrounds |

Tokens live in `src/redesign/ui/cinematicImage.js` and are re-exported from `src/redesign/ui/index.js`.

## Presentation levers

1. **Corner radius** — `IMAGE_RADIUS` (`sm` 8 → `xl` 20). Prefer softer radii on thumbs; `none` when clipped by a parent card.
2. **Overlay** — soft / bottom / immersive / vignette gradients that pull focus toward architecture and text.
3. **Gradient grade** — CSS filters (`film`, `day`, `dusk`, `nocturne`) desaturate and lower brightness so photos do not read as vacation snaps.
4. **Shadow** — `still` (list thumbs), `soft`, `deep`. Skip inside clipped cards.
5. **Loading** — limestone shimmer skeleton until decode.
6. **Fade / transition** — opacity + slight scale settle on load (`--d-rise` / `--ease-exit`). Reduced motion collapses to a short opacity fade.
7. **Aspect ratio** — square / portrait / landscape / wide / cinema / fill. Prefer intentional crop ratios over freeform tourist framing.
8. **Position** — landmark bias (`center 28%`) frames stone, not empty sky.

## Defaults

```jsx
<CinematicImage
  src={photo}
  aspect="portrait"
  radius="md"
  grade="film"
  overlay="soft"
  position="landmark"
  shadow="still"
/>
```

Full-bleed:

```jsx
<PhotoHero src={photo} grade="dusk" position="landmark" />
```

## Rules

- Do not replace or crop source assets for presentation.
- Prefer lowering saturation over boosting vibrance.
- One clear still per row; avoid collage tiles.
- Use `faded` for locked / upcoming stops instead of ad-hoc filters.
- Use `extraFilter` only for intentional historical treatments (e.g. Journal “THEN” sepia).
