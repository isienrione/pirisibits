# Landing responsive QA — Phase 19

Mobile remains the primary format. Tablet (iPad portrait especially) is a first-class mid-band, not stretched desktop.

## Viewports covered

| Viewport | Role |
|----------|------|
| 320 × 568 | Small phone |
| 375 × 667 | Classic phone |
| 390 × 844 | Modern phone |
| 430 × 932 | Large phone |
| 768 × 1024 | iPad portrait |
| 820 × 1180 | iPad portrait (larger) |
| 1024 × 1366 | iPad landscape / small desktop |
| 1280 × 800 | Desktop |
| 1440 × 1000 | Desktop |
| 1728 × 1117 | Large desktop |

## Breakpoint policy (no proliferation)

Reuse existing rem stops:

- `47.99rem` — phone-only overrides  
- `48rem` — tablet floor  
- `56rem` — hero two-column  
- `64rem` — desktop nav / denser grids / ultrawide ending  

Plus one intentional **tablet band**: `(min-width: 48rem) and (max-width: 63.99rem)`.

## Fixes

| Area | Problem | Fix |
|------|---------|-----|
| Root | Horizontal overflow risk | `overflow-x: clip` on `.cw-landing--premium` |
| Sticky nav clearance | Hard-coded paddings/margins drift | `--v2-header-height` / `--v2-header-offset` drive hero padding, Act I marker, FAQ `scroll-margin`, trust sticky `top` |
| Headings | Excessively wide on tablet | Section titles clamp + `max-width: 22ch` (18ch in tablet band) |
| Header nav | Six links crush at 768–820 | Full nav from **`64rem`** only; tablet = brand + CTA |
| Header CTA | Sub-44px touch | `min-height: 2.75rem` (+ mobile) |
| Header / footer links | Tiny hit areas | `min-height: 2.75rem` on links |
| How-it-works | Three phone columns at 768 | 3-col deferred to **`64rem`** |
| Pricing imbalance | Awkward 2+1 orphan at tablet | Drop 2-col media rule; `@container cw-pricing (min-width: 52rem)` → 3 equal columns; featured card order until `<64rem` |
| Route visualization | Squashed `flex: 1` stops | Tablet track: `flex: 0 0 auto`, larger photo (5rem), readable titles; horizontal scroll intentional |
| Monuments toggle | Tiny tap target | `min-height: 2.75rem` |
| Ending crop | 21∶9 from 768 squeezes copy | **16∶9** at `48rem`; **21∶9** from `64rem` |
| FAQ | Tiny group labels; sticky clearance | Labels `0.78rem`; scroll-margin via header offset; tablet max-width `38rem` |
| Captions | Tiny (0.7–0.72rem) | Try-free / trust captions → `0.78rem` |
| Tablet empty space | Desktop `6rem` section padding on iPad | Tablet band `4.5rem`; tighter hero / phone visuals |
| Hero tablet | Stacked “desktop” type | Tablet: restrained headline clamp, smaller device, no forced min-height stretch |
| Footer imbalance | Row layout + large logo at mid widths | Stacked until `64rem`; logo `width={220}` + `max-width: min(100%, …)` |
| Touch CTAs | Preserve ≥44px | Core `.cw-v2-btn` unchanged (`min-height` ≥ 2.875rem mobile) |

## Container queries

`.cw-v2-wrap--pricing` sets `container-type: inline-size; container-name: cw-pricing`. Pricing columns respond to **content width**, with `@media (min-width: 64rem)` as fallback for environments without container queries.

## Out of scope / unchanged

- Checkout amounts and pricing footnote copy  
- No new sticky bottom CTA (not mounted on editorial landing)  
- No scroll-jacking or full-screen act interruptions  
- Legacy unused CSS (`who`, `compare`, `experience`) left in place — not driving live tablet bugs
