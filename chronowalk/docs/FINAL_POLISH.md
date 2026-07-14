# Final polish pass (craft only)

Date: 2026-07-14  
Branch: `cursor/calm-ui-density-5d36`  
Constraint: no redesign, no features — token alignment, hit targets, focus, motion cadence, safe areas.

## Improvements made

### Touch & focus
- Floating audio dock: play/expand/skip hit floors → 44px; `cw-motion-pressable` on controls
- C6 immersive: Back + threshold help + skip ±15 → 44px; topbar gutters → `--edge`
- Flow escape Back: 44px min height, `ICON.sm` + `ICON.stroke`, visible `:focus-visible` ring
- Shared `.cw-motion-pressable:focus-visible` ember focus ring (matches walking pressables)
- Settings segmented controls → `minHeight: TAP.min`
- Map chips → `TAP.min` hit floor
- Reveal invite + tour-onboarding close controls → 44px

### Token / radius hygiene
- Dock shell → `R.card`; replay CTA → `R.control`
- Sheet top radii (Map pin, Route) → `R.sheet`
- Sheet drag handle standardized to `36×4`
- Toggle on-state `#5B5249` → ink/muted `color-mix` (Settings, Family Walk, G1)
- Chip / cine skeleton `--bone` fallbacks → `#faf6ef` (no limestone drift)
- Walking companion local palette aliased to `--obsidian` / `--warm-white` / `--muted`
- Error “Start tour” CTAs → `R.control` + `TAP.min` + `TYPE.button`
- Tab bar tracking → `0.14em` (`--tracking-tab`)

### Motion cadence
- Sheet open (Map / Route) → `--d-sheet` + `--ease-exit` / `cwMotionSheetUp`
- Gold Seam easing → `--ease-standard` / `--ease-exit` / `--ease-breathe`
- FTAP enter → `--d-panel` (was 0.42s custom)
- My Tour act opacity → `--d-panel` + `--ease-enter`
- A1 Now/Then crossfade → `--d-rise` + `--ease-exit`
- Play glyph optical offset unified to `marginLeft: 2` across docks / C6 / C5 / FTAP

### Safe area
- Settings scroll body → `max(--gap-l, env(safe-area-inset-bottom))`
- Map pin sheet bottom pad → `max(44px, calc(env(safe-area-inset-bottom) + 16px))`

## Remaining imperfections

- Prototype D1 Map / C1b Route still carry some hardcoded map-art colors (SVG limestone fills) — intentional cartography, not chrome
- Walking companion parallel `--wc-*` system partially aliased; not fully merged into design tokens
- A few immersive screens still use ad-hoc `fontSize` literals beside `TYPE.*` roles
- Dual tab-bar prototypes (`TabBar.jsx` vs `ShellTabBar`) — production uses Shell only
- Exhaustive keyboard focus audit on every inline style button not complete
- Reduced-motion coverage for a minority of inline transitions still uneven
- Visual QA on real devices (iPhone home indicator + outdoor luminance) still needed before ship

## Scores

| Score | Value | Notes |
| --- | --- | --- |
| Confidence | **82** | Craft contract is consistent on production surfaces; some prototype screens lag |
| Design quality | **86** | Brand, ceremony, and type feel intentional; dual systems + map prototype keep it from 90+ |
| Implementation quality | **84** | Tokens and motion CSS are shared; residual inline magic numbers remain |
| Production readiness | **80** | Tour/journey path is solid; device QA + offline path + focus completeness remaining |
