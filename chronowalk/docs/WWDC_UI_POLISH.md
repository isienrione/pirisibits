# WWDC UI polish pass

Date: 2026-07-14  
Branch: `cursor/calm-ui-density-5d36`

## Contract (shared)

| Token | Value | Role |
|---|---|---|
| `--radius-control` / `R.control` | 12px | Buttons, chips |
| `--radius-card` / `R.card` | 14px | Cards / surfaces |
| `--radius-sheet` / `R.sheet` | 20px | Sheets |
| `--tap-min` / `TAP.min` | 44px | Minimum hit target |
| `ICON.sm/md/lg` | 16 / 18 / 22 | Lucide kit |
| `SHELL_TAB_BAR_INSET` | tab height + gap-s | No double safe-area |

## Button family

Primary / Secondary / Ghost share:
- `minHeight: TAP.min`
- `cw-motion-pressable`
- disabled opacity **0.55**, cursor `not-allowed` (or `wait` when `busy`)
- `TYPE.button` / `buttonQuiet` tracking

TextButton / BackLink / IconButton grow hit boxes without enlarging optical glyphs.

## Screens migrated this pass

- A1 purchase / preview → Primary + Ghost  
- A2 unlock → Primary + TextButton  
- MapBottomCard CTA → PrimaryButton  
- Stops Listen / Walk → Secondary + Primary  
- Journal loading → GoldSeam (matches My Tour / Stops)  
- Settings Done + sheet radius/shadow tokens  
- My Tour expand chevron tap target  

## Deferred

Walking companion `--wc-*` parallel system, FloatingAudioPlayer density, prototype D1 sheet springs, exhaustive inline reduced-motion, brand brief radius doc reconciliation.
