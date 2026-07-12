# ChronoWalk Design Law

Binding rules for all UI work. Violations fail `npm run check:design` in CI.

## The Law

### Colors

Use **only** tokens from `chronowalk/src/design/tokens.css`. No invented hex, no legacy palette names (`ivory`, `parchment`, `bronze`, `gold`, `slate-*`, etc.).

**Muted split:** `--muted` is text-only (secondary / meta copy on bone). `--muted-decor` is decoration-only (hairlines, borders, tracks, dividers, disabled fills). Never use `--muted` for non-text chrome.

**Act accent text:** Accent-colored labels under 18px (or under 18.66px non-bold) use the `*-text` variant on bone. Dots, ticks, hairlines, progress fills, and pulses stay on the fill accent.

### Surfaces

| Context | Background | Text |
|---------|------------|------|
| **Immersion** (walking, story, threshold, letter in walk mode) | `--obsidian` `#16130F` | `--bone` / `--warm-white` |
| **Daylight** (journal, planning sheets, settings, stops) | `--bone` `#F7F1E6` | `--ink-900` `#211C15` |

### Act accents (Vitality system)

One act accent family per screen — eyebrows, hairlines, progress, pulses, data. **Never large fills.**

Use `useActAccent()` from `src/hooks/useActAccent.js`. It returns `{ accent, accentText }`. Components consume the hook; never hardcode an act accent.

### Spectrum gradient

Only at prism moments: splash, threshold bloom, act completion, Letter route-line.

### Ember

`--ember` `#E8A13C` is sacred — the Seam (time).

### Typography

- **Fraunces** — display / reflection only
- **DM Sans** — everything else

### Components

Reuse `src/components/ui` primitives. Surfaces: plain `div` with `bg-ink900 rounded-card` where needed.

### Banned

- Surface gradients (except `--spectrum` at prism moments)
- Glassmorphism (`glass`, `backdrop-blur-glass`, plaque shadows)
- Medallions, parchment textures
- Tailwind grays/whites (`bg-white`, `bg-gray-*`, `slate-*`)
- Hardcoded legacy hex (`#D4AF37`, `#EDE3CF`, `#F7F3EC`, …)

### Protected

Do not restyle without explicit approval:

- `Threshold` component
- `PrismSeamLogo`

---

## Token block (`src/design/tokens.css`)

Import **first** in `main.jsx`:

```css
:root {
  --obsidian:#16130F; --ink-900:#211C15; --ink-800:#26221B;
  --bone:#F7F1E6; --warm-white:#F5EFE3;
  --muted:#756C5C; --muted-decor:#B9AF9C;
  --ember:#E8A13C; --ember-deep:#C97F1E; --ink-on-fill:#2A1206;
  /* THE VITALITY SYSTEM — act accents (one family per screen, never big fills) */
  --act-arena:#E4552E;     /* I  · coral — blood, sand, energy   */
  --act-hill:#7C9A5C;      /* II · laurel — pines, wreaths       */
  --act-forum:#E8A13C;     /* III· ember — the classic heart     */
  --act-market:#4E9B8F;    /* IV · verdigris — patina, coins     */
  --act-city:#B14A6E;      /* V  · tyrian rose — piazza life     */
  --act-river:#4E7D9B;     /* VI · tiber blue — dusk on water    */
  --act-encore:#8A6FB5;    /* Enc· twilight violet — long road   */
  --act-arena-text:#B23413;
  --act-hill-text:#55703A;
  --act-forum-text:#8F5E10;
  --act-market-text:#2F6E63;
  --act-city-text:#963A5B;
  --act-river-text:#3A607A;
  --act-encore-text:#6A4F96;
  --act-city-on-dark:#D488A4;
  --spectrum:linear-gradient(135deg,#E4552E,#E8A13C,#7C9A5C,#4E9B8F,#4E7D9B,#8A6FB5,#B14A6E);
  --seam-glow:0 0 12px rgba(232,161,60,.45);
  --radius-card:14px; --radius-sheet:20px;
}
```

---

## Token table

| CSS variable | Hex | Tailwind name | Role |
|--------------|-----|---------------|------|
| `--obsidian` | `#16130F` | `obsidian` | Immersion surface |
| `--ink-900` | `#211C15` | `ink900` | Daylight primary text / card surface |
| `--ink-800` | `#26221B` | `ink800` | Borders, tracks, quiet fills |
| `--bone` | `#F7F1E6` | `bone` | Daylight surface / immersion text |
| `--warm-white` | `#F5EFE3` | `warmwhite` | Immersion primary text |
| `--muted` | `#756C5C` | `muted` | Secondary / meta **text** on bone |
| `--muted-decor` | `#B9AF9C` | `muteddecor` | Hairlines, borders, tracks, disabled fills |
| `--ember` | `#E8A13C` | `ember` | Sacred seam; primary CTA fill |
| `--ember-deep` | `#C97F1E` | `emberdeep` | Ember pressed / depth |
| `--ink-on-fill` | `#2A1206` | `inkonfill` | Text on ember / accent fills |
| `--act-arena` | `#E4552E` | `actarena` | Act I accent (fills, dots, hairlines) |
| `--act-arena-text` | `#B23413` | `actarenatext` | Act I labels on bone |
| `--act-hill` | `#7C9A5C` | `acthill` | Act II accent |
| `--act-hill-text` | `#55703A` | `acthilltext` | Act II labels on bone |
| `--act-forum` | `#E8A13C` | `actforum` | Act III accent |
| `--act-forum-text` | `#8F5E10` | `actforumtext` | Act III labels on bone |
| `--act-market` | `#4E9B8F` | `actmarket` | Act IV accent |
| `--act-market-text` | `#2F6E63` | `actmarkettext` | Act IV labels on bone |
| `--act-city` | `#B14A6E` | `actcity` | Act V accent |
| `--act-city-text` | `#963A5B` | `actcitytext` | Act V labels on bone |
| `--act-city-on-dark` | `#D488A4` | `actcityondark` | Act V labels on dark surfaces |
| `--act-river` | `#4E7D9B` | `actriver` | Act VI accent |
| `--act-river-text` | `#3A607A` | `actrivertext` | Act VI labels on bone |
| `--act-encore` | `#8A6FB5` | `actencore` | Encore accent |
| `--act-encore-text` | `#6A4F96` | `actencoretext` | Encore labels on bone |
| `--spectrum` | (gradient) | — | Prism moments only |
| `--seam-glow` | rgba ember | — | Threshold / compare seam |
| `--radius-card` | `14px` | `rounded-card` | Card radius |
| `--radius-sheet` | `20px` | `rounded-sheet` | Sheet radius |

### Act → accent map (`src/design/actAccents.ts`)

| Act id | Accent | Text on bone |
|--------|--------|--------------|
| `act1` | `--act-arena` | `--act-arena-text` |
| `act2` | `--act-hill` | `--act-hill-text` |
| `act3` | `--act-forum` | `--act-forum-text` |
| `act4` | `--act-market` | `--act-market-text` |
| `act5` | `--act-city` | `--act-city-text` |
| `act6` | `--act-river` | `--act-river-text` |
| `encore` | `--act-encore` | `--act-encore-text` |

### Button API (`Button.jsx`)

| Variant | Style |
|---------|-------|
| `primary` | ember fill, ink-on-fill text |
| `quiet` | transparent, bone text, 1px ink800 border |
| `ghost` | text only |

---

## Enforcement

```bash
npm run check:design   # forbidden strings + rogue hex in JSX className/style
npm test             # runs check:design then vitest
```
