# ChronoWalk Brand System

**Status:** Current production branding (as implemented in the app & website)  
**Source of truth:** `chronowalk/src/design/tokens.css` · `DESIGN_LAW.md` · `/public/brand/`  
**Product:** GPS-guided audio walks through Rome — place-aware stories, Threshold reconstructions, offline-first

---

## 1. Brand essence

| | |
|---|---|
| **Name** | ChronoWalk |
| **Wordmark** | `CHRONOWALK` (all caps, wide tracking) |
| **Tagline** | `WALK · LISTEN · TIME TRAVEL.` |
| **Positioning** | Premium, cinematic, historical — a pocket companion that collapses “then” and “now” while you walk |
| **Feeling** | Nat Geo depth + evening film grain: matte surfaces, photograph-led layouts, gold/ember as *time*, never neon tech |

ChronoWalk is **Rome first**, dark immersion for walking/story, and warm daylight for planning. The visual metaphor is a classical temple crossed by a seam of light — past and present meeting in one place.

---

## 2. Logo system

Official raster assets live in **`/public/brand/`**. React API: `ChronoWalkLogo` (`src/components/ui/ChronoWalkLogo.jsx`).

### 2.1 Emblem (mark only)

| Asset | Path | Use |
|-------|------|-----|
| Emblem on dark | `/brand/emblem-dark.png` | Favicons, PWA icons, dark UI chrome, splash |
| Emblem on light | `/brand/emblem-light.png` | Light/daylight surfaces, print on ivory |

**Composition**

- Classical temple silhouette (four columns, pediment) — bronze/stone texture  
- Thin **gold ring** encircling the temple  
- Vertical **gold seam / light beam** through the center (sharp tips, subtle flare) — the “Chrono” seam between eras  

**Clear space:** keep ~¼ of the emblem diameter free on all sides.  
**Minimum size:** prefer ≥ 32px digital; PWA uses 192 / 512.

```jsx
<ChronoWalkLogo size={48} variant="dark" />   // emblem only
<ChronoWalkLogo size={48} variant="light" />
```

### 2.2 Lockups

| Asset | Path | Layout |
|-------|------|--------|
| Horizontal dark | `/brand/lockup-horizontal-dark.png` | Emblem + wordmark + tagline (marketing headers) |
| Horizontal light | `/brand/lockup-horizontal-light.png` | Same on ivory / bone |
| Stacked dark | `/brand/lockup-stacked-dark.png` | Emblem above wordmark (narrow / square) |
| Master reference | `/brand/chronowalk-logo.png` | Full-resolution brand plate |

**Horizontal lockup structure**

1. Emblem (left)  
2. `CHRONOWALK` — Fraunces-like serif, uppercase, ~0.2–0.22em tracking  
3. Thin gold rule with a small four-point star / seam mark at center  
4. Tagline `WALK · LISTEN · TIME TRAVEL.` — gold, uppercase, smaller  

```jsx
<ChronoWalkLogo width={320} variant="dark" layout="horizontal" />
<ChronoWalkLogo width={280} variant="light" layout="horizontal" />
<ChronoWalkLogo width={200} variant="dark" layout="stacked" />
// hideTagline → emblem + typeset wordmark only
```

| Variant | Surface |
|---------|---------|
| `dark` | Obsidian / charcoal (warm ivory wordmark) |
| `light` | Warm ivory / bone (obsidian wordmark) |

### 2.3 PrismSeamLogo (protected product mark)

`PrismSeamLogo` (`src/components/welcome/PrismSeamLogo.jsx`) — **protected** (Design Law).  
Circle split by the vertical ember seam; right half fills with the spectrum prism gradient. Used at welcome / prism moments, not as a substitute for the official emblem lockups.

### 2.4 App icons & favicons

| File | Role |
|------|------|
| `/favicon.svg`, `favicon-32.png`, `favicon-16.png` | Browser tabs |
| `/apple-touch-icon.png`, `/pwa/apple-touch-icon.png` | iOS Home Screen |
| `/pwa/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | PWA / Android |

Theme color historically `#16130F`; canonical surface token is now **`--obsidian` `#0B0B0D`**. Prefer aligning new chrome to `#0B0B0D`.

### 2.5 Logo don’ts

- Do not recolor the seam gold arbitrarily (no purple, cyan, white-only neon)  
- Do not stretch, add drop shadows behind the full lockup, or place the dark emblem on charcoal without contrast check  
- Do not rebuild the temple mark as a flat icon font without design approval  
- Do not restyle `PrismSeamLogo` or `Threshold` without explicit approval  

---

## 3. Color system

Canonical CSS variables: **`src/design/tokens.css`** (imported first in the app).  
CI enforces Design Law via `npm run check:design`.

### 3.1 Core brand palette (official)

| Token | Hex | CSS | Role |
|-------|-----|-----|------|
| **Obsidian** | `#0B0B0D` | `--obsidian` | Immersion / landing background; darkest surface |
| **Charcoal** | `#1A1A1F` | `--charcoal` | Raised dark panels, cards on obsidian |
| **Warm ivory** | `#FAF6EF` | `--warm-ivory` → `--bone`, `--warm-white` | Daylight surfaces; primary text on dark |
| **Limestone** | `#E9E2D5` | `--limestone` | Soft borders, tagline tint, muted highlights |
| **Bronze** | `#8B8638` | `--bronze` | Editorial CTAs, secondary metal accent |
| **Gold** | `#D4AF37` | `--gold` | Brand metal — emblem seam glow, landing accents, arrival polish |
| **Olive** | `#6B7A52` | `--olive` | Success / soft positive (sparingly) |

### 3.2 Ink & utility (product UI)

| Token | Hex | CSS | Role |
|-------|-----|-----|------|
| **Ink 900** | `#211C15` | `--ink-900` / `--ink` | Primary text on daylight; dark card surfaces |
| **Ink 800** | `#26221B` | `--ink-800` | Borders, tracks, quiet fills on dark |
| **Muted** | `#B9AF9C` | `--muted` / `--muted-warm` | Secondary / meta copy |
| **Ember** | `#E8A13C` | `--ember` | **Sacred seam** — time fracture, Threshold glow, emphasis hairlines |
| **Ember deep** | `#C97F1E` | `--ember-deep` | Pressed ember / depth |
| **Ink on fill** | `#2A1206` | `--ink-on-fill` | Text sitting on ember/gold-filled buttons |

**Ember vs Gold**

- **Ember (`#E8A13C`)** — product “Seam of Time”: Threshold compare glow, eyebrows in begin/journey, sacred UI emphasis. Design Law: *sacred*.  
- **Gold (`#D4AF37`)** — brand metal in the logo / marketing lockup; landing often aliases “ember UI” to gold (`--v2-ember: var(--gold)`).  
Do not invent a third amber. Prefer tokens; do not hardcode alternate golds.

### 3.3 Vitality system — act accents

**Rule:** one act accent family per screen — eyebrows, hairlines, progress dots, pulses, data. **Never large fills.**

Resolve via `useActAccent()` / `actAccentValue(actId)` — never hardcode act colors in components.

| Act | Token | Hex | Character |
|-----|-------|-----|-----------|
| I · The Arena | `--act-arena` | `#E4552E` | Coral — blood, sand, energy |
| II · Gate & Hill | `--act-hill` | `#7C9A5C` | Laurel — pines, wreaths |
| III · The Forum | `--act-forum` | `#E8A13C` | Ember — classic heart |
| IV · The Market | `--act-market` | `#4E9B8F` | Verdigris — patina, coins |
| V · Living City | `--act-city` | `#B14A6E` | Tyrian rose — piazza life |
| VI · The River | `--act-river` | `#4E7D9B` | Tiber blue — dusk on water |
| Encore | `--act-encore` | `#8A6FB5` | Twilight violet — long road |

**Aliases:** `--coral` → arena · `--laurel` → hill · `--verdigris` / `--accent` → market / arena (compat) · `--rose` · `--tiber` · `--violet`

### 3.4 Spectrum (prism only)

```css
--spectrum: linear-gradient(
  135deg,
  #e4552e, #e8a13c, #7c9a5c, #4e9b8f, #4e7d9b, #8a6fb5, #b14a6e
);
```

**Only** at prism moments: splash, Threshold bloom, act completion, Letter route-line.  
No decorative surface gradients elsewhere.

### 3.5 Glow & borders

| Token | Value | When |
|-------|-------|------|
| `--seam-glow` | `0 0 12px rgba(212, 175, 55, 0.45)` | Seam / Threshold / compare |
| `--ember-glow` | `rgba(232, 161, 60, 0.55)` | Ember bloom (PrismSeam) |
| `--border-daylight` | ink mixed into bone | Daylight card edges |
| `--border-immersion` | warm-white/obsidian mix | Dark UI edges |

### 3.6 Surfaces — when to use which

| Mode | Background | Text | Examples |
|------|------------|------|----------|
| **Immersion** | Obsidian `#0B0B0D` | Bone / warm ivory | Walking, story, threshold, letter-in-walk, landing |
| **Raised immersion** | Charcoal `#1A1A1F` | Ivory | Cards, sheets, begin option tiles on dark |
| **Daylight** | Bone / warm ivory `#FAF6EF` | Ink 900 | Journal, planning, settings, My Tour daylight sheets |

### 3.7 Highlighting & CTA situations

| Situation | Color | Notes |
|-----------|-------|-------|
| Primary purchase CTA (landing) | **Coral / Act Arena** `#E4552E` | `.cw-v2-btn--coral` — strongest conversion fill |
| Brand / arrival accent | **Gold** `#D4AF37` | Header accents, progress, brand flourishes |
| Sacred time / Threshold | **Ember** `#E8A13C` | Seam line, eyebrows “YOUR TOUR”, Threshold glow |
| Editorial / explorer CTA (legacy Button) | **Bronze** `#8B8638` | Gradient bronze → bronze-dark primary button |
| Selected tour card / focus ring | Ember or gold rim + soft glow | Selected border `1.5px` ember/gold |
| Rome Complete pricing card | Gold tier accent | `--tier-accent: var(--gold)` |
| Rome Historica / Antica cards | Bronze / gold accents | Tier maps & ribbons |
| Success / complete quiet | Olive `#6B7A52` | Status only — not hero fills |
| Act progress dots | Current act accent | Tiny dots / hairlines only |
| Muted labels | Muted `#B9AF9C` or limestone mix | Meta, captions |
| Destructive / error | Soft coral/rose mixed for warnings | Prefer arena tint, not arbitrary red |

**Highlight discipline:** ≤ 2 accent colors visible on one screen besides surface + text. Act accents never become backgrounds.

### 3.8 Radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius-card` / `--r-card` | `14px` | Cards, tiles |
| `--radius-sheet` / `--r-sheet` | `20px` | Sheets, large panels |
| Pills | `999px` | Badges/tags only — not every button |

---

## 4. Typography

### 4.1 Families (live)

Loaded from Google Fonts in `src/index.css`:

| Role | Family | CSS | Fallback |
|------|--------|-----|----------|
| **Display** | **Fraunces** | `--font-display` | Georgia, serif |
| **UI / body** | **DM Sans** (optical size) | `--font-ui` | system-ui, sans-serif |

```text
Fraunces: ital, opsz 9–144; weights 500–700 (+ italic 500)
DM Sans:  opsz 9–40; weights 400–700 (+ italic 400)
```

> Note: An older Figma brief proposed Playfair Display + Inter. That is **not** what ships. Production is Fraunces + DM Sans.

### 4.2 Type scale

| Token | Size | Typical use |
|-------|------|-------------|
| `--fs-hero` | 40px | Landing / cinematic heroes |
| `--fs-title` | 34px | Screen titles |
| `--fs-place` | 32px | Place names |
| `--fs-h2` | 22px | Section titles |
| `--fs-reflect` | 20px | Reflection / letter beats |
| `--fs-body` | 17px | Primary reading |
| `--fs-secondary` | 15px | Supporting copy |
| `--fs-meta` | 13px | Meta, footnotes |
| `--fs-caption` | 11px | Eyebrows, chrome labels |

### 4.3 Tracking & wordmark type

| Class / token | Spec |
|---------------|------|
| `.cw-brand-header` | Fraunces, uppercase, `letter-spacing: 0.2em` |
| Wordmark in logo component | Fraunces, uppercase, ~`0.22em` |
| `.cw-tracking-tagline` | DM Sans 500, 10px, uppercase, `0.25em`, limestone color |

### 4.4 Usage rules

- **Fraunces** — display, place names, reflection, letter, brand headers. Prefer light/medium weight for large headlines (300–500 in redesign screens).  
- **DM Sans** — body, buttons, nav, captions, forms.  
- Italics: emotional single words or reflection, not entire UI sentences.  
- Tabular numbers: `.num` (`font-variant-numeric: tabular-nums`).  
- Minimum comfortable body ≈ 15–17px; captions 11–13px.  
- Touch targets: ≥ 48×48 CSS px (`tapTargets` in `design/tokens.js`).

---

## 5. Motion & materials

| Token | Value | Use |
|-------|-------|-----|
| `--d-ui` | 200ms | Buttons, toggles |
| `--d-trans` | 400ms | Screen crossfades |
| `--d-cinematic` | 1200ms | Prism / Threshold moments |
| `--ease` | `cubic-bezier(0.22, 0.8, 0.36, 1)` | Default easing |

**Materials**

- Matte, photograph-led — prefer full-bleed place photography with subtle brightness/saturate scrims  
- Soft card / sheet shadows via `--shadow-card` / `--shadow-sheet`  
- Optional fine grain (`.cw-grain`) on daylight map/preview for atmosphere  

**Banned (Design Law)**

- Glassmorphism / heavy backdrop-blur plaques  
- Surface gradients except `--spectrum` at prism moments  
- Medallions / parchment textures as default UI  
- Tailwind grays/whites (`bg-white`, `slate-*`)  
- Invented hex outside the token file  

---

## 6. Product modes (visual temperature)

| Mode | Surface | Accents | Screens |
|------|---------|---------|---------|
| **Landing / marketing** | Obsidian | Coral CTAs, gold brand, limestone muted | `/landing` premium sections |
| **Setup / begin** | Obsidian + charcoal cards | Ember eyebrows, terracotta continue | `/setup`, `/begin` |
| **Companion (walk)** | Obsidian, minimal chrome | Act accent hairlines, ember seam | Walking, approach, GPS |
| **Story / immersion** | Obsidian + photo | Ember/gold + act accent | Arrival, audio, Threshold |
| **Daylight explorer** | Bone / ivory | Ember/bronze links | Journal, settings, stops sheets |

---

## 7. Landing vs in-app accents (practical cheat sheet)

| Need | Prefer |
|------|--------|
| “Buy / Begin Journey” on landing | Coral `#E4552E` |
| Brand line, pricing highlight, complete ribbon | Gold `#D4AF37` |
| “Sacred” product moment (Threshold, seam, before-you-begin) | Ember `#E8A13C` |
| Quiet secondary control on dark | Transparent + ink800 border + bone text |
| Text on filled gold/ember/coral | Dark ink (`#2A1206` or near-obsidian) — check contrast |
| Background while walking | Obsidian, not pure `#000` flat UI panels without photo |

---

## 8. Spacing

| Token | Value |
|-------|-------|
| `--edge` | 24px (outdoor / HIG-friendly margin) |
| `--gap-s` | 8px |
| `--gap-m` | 16px |
| `--gap-l` | 24px |
| `--gap-xl` | 40px |

Immersive screens: prefer safe-area insets + shell tab bar inset tokens from redesign (`SHELL_TAB_BAR_INSET`).

---

## 9. Voice in the UI (brand-adjacent)

- Direct, place-first: “Review & begin,” “Rome kept your place,” not SaaS jargon  
- Package names on landing: **Roma Historica**, **Roma Antica**, **Roma Eterna**  
- After purchase: no pricing language — layout confirmation only  
- Tagline remains the brand promise: walk, listen, time travel  

---

## 10. Implementation map

| Concern | Location |
|---------|----------|
| CSS tokens | `src/design/tokens.css` |
| JS / Tailwind color maps | `src/design/tokens.js` |
| Redesign inline tokens | `src/redesign/tokens.js` |
| Act accent map | `src/design/actAccents.ts` |
| Act accent hook | `src/hooks/useActAccent.js` |
| Logo component | `src/components/ui/ChronoWalkLogo.jsx` |
| Prism mark | `src/components/welcome/PrismSeamLogo.jsx` |
| Brand assets | `public/brand/` |
| Design Law (CI) | `DESIGN_LAW.md` · `npm run check:design` |
| Landing premium styles | `src/landing/ChronoWalkLanding.v2.css` |

---

## 11. Quick reference swatches

```
Obsidian   ████  #0B0B0D
Charcoal   ████  #1A1A1F
Warm ivory ████  #FAF6EF
Limestone  ████  #E9E2D5
Muted      ████  #B9AF9C
Bronze     ████  #8B8638
Gold       ████  #D4AF37
Ember      ████  #E8A13C
Coral      ████  #E4552E
Olive      ████  #6B7A52
Laurel     ████  #7C9A5C
Verdigris  ████  #4E9B8F
Tyrian     ████  #B14A6E
Tiber      ████  #4E7D9B
Encore     ████  #8A6FB5
```

---

## 12. Known drifts (for editors)

Documented here so brand work stays honest:

1. **Design Law sample block** in the repo root still shows an older obsidian `#16130F` in places; **tokens.css `#0B0B0D` is canonical**.  
2. **Redesign `T.ember`** currently aliases to gold `#D4AF37` in `redesign/tokens.js` while CSS `--ember` remains `#E8A13C` — prefer CSS variables in new work.  
3. Landing maps `--v2-ember` → `--gold` for marketing polish; product Threshold should stay on **`--ember`**.  
4. Stacked **light** lockup asset is not present; light stacked layouts fall back to horizontal light + typeset wordmark patterns in code.

---

*This document describes ChronoWalk branding as implemented in the codebase today. When Design Law and a Figma brief disagree, ship tokens.css + `/public/brand/` assets as authority unless a new brand release updates both.*
