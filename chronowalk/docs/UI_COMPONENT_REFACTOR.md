# UI component refactor — consistency without visual change

Date: 2026-07-14  
Branch: `cursor/calm-ui-density-5d36`  
Scope: `src/redesign/` (live product UI). Landing CSS and Tailwind `src/components/ui/` left as parallel stacks.

## Audit findings

| Pattern | Problem | Shared source (before) |
|---|---|---|
| Full-width primary CTA | ~14+ inline copies vs 4 `PrimaryButton` uses | `PrimaryButton` underused |
| Ghost / outline CTA | Multiple ink/muted border recipes | `GhostButton` used once |
| Screen headers | My Tour / Stops / Journal reimplemented header chrome | None |
| Settings gear | Identical icon button in My Tour + Journal | None |
| Cards | Warm/ivory + dark ink surfaces recreated per screen | None |
| Status text | Visited / Here / DONE / NOW duplicated | None |
| Map filter chips | D1Map inlined an exact copy of `Chip` | `Chip` unused |
| Section labels | KEY FACTS / CHAPTERS reimplemented beside `Eyebrow` | `Eyebrow` is a different scale |
| Tab bar | E1 prototyped its own copy of `TabBar` | `TabBar` existed |
| Back row | Chevron + label repeated outside `FlowEscapeButton` | None |

## New shared components (`src/redesign/ui/`)

| Component | Role | Appearance contract |
|---|---|---|
| `SecondaryButton` | Muted full-width outline CTA (journey complete, light surfaces) | Matches prior C8e secondary |
| `TextButton` | Low-emphasis text actions | Matches Route / Start from here / Skip |
| `IconButton` | Settings gear chrome | Matches prior My Tour / Journal gear |
| `BackLink` | In-flow back (not fixed escape) | Matches E2 / B5 back row |
| `ScreenHeader` | `brand` / `split` / `plain` header recipes | Matches My Tour / Journal / Stops |
| `SurfaceCard` | Light / dark card chrome | Matches E1 + Stops card shells |
| `StatusMark` | `visited` / `here` / `done` / `now` | Matches prior label styles |
| `SectionLabel` | 11px / 0.18em uppercase | Distinct from `Eyebrow` (10 / 0.25em) |
| `BrandMark` | ChronoWalk mark SVG | Extracted from My Tour |

## Enhanced existing components

| Component | Change | Why safe |
|---|---|---|
| `PrimaryButton` | Optional `glow` (default `true`), forwards `...rest` | Existing call sites keep default glow |
| `GhostButton` | Honors `disabled` + opacity | Fixes ignored prop used by B3; idle look unchanged |
| `Chip` | Explicit `type="button"` | Same styles; used by D1Map |
| `ui/index.js` | Re-exports new primitives | Single import surface |

## Call-site migrations

| File | Refactor |
|---|---|
| `RedesignMyTourScreen.jsx` | `ScreenHeader` + `BrandMark` + `PrimaryButton` + `TextButton` + `StatusMark` |
| `RedesignStopsScreen.jsx` | `ScreenHeader` + `SurfaceCard` + `StatusMark` + `PrimaryButton` |
| `screens/E1JournalHome.jsx` | `ScreenHeader` + `SurfaceCard` + `TabBar` + `PrimaryButton` |
| `screens/E2MemoryDetail.jsx` | `BackLink` + `PrimaryButton` + `SectionLabel` |
| `screens/B2MakeItYours.jsx` | `PrimaryButton` + `GhostButton` + `TextButton` |
| `screens/B4PaceSelector.jsx` | `PrimaryButton` |
| `screens/B5OwnPaceStopPicker.jsx` | `BackLink` + `PrimaryButton` |
| `screens/C6ImmersivePlayer.jsx` | Continuity CTA → `PrimaryButton` |
| `screens/C8dResume.jsx` | `PrimaryButton` + `TextButton` |
| `screens/C8eJourneyComplete.jsx` | `PrimaryButton` + `SecondaryButton` |
| `screens/D1Map.jsx` | Filter chips → `Chip` |

## Intentionally not migrated (this pass)

- Landing (`src/landing/*`) — own CSS system  
- Walking companion / floating audio complex chrome  
- Act spine / seam compositions  
- Tailwind `src/components/ui/*` — appearance would change if swapped in  
- Prototype-only screens beyond live begin/journey (`C1JourneyHome`, etc.) — deferred  

## Verification rule

Every migration preserved prior styles via props (`glow={false}`, `textColor`, `style` overrides) rather than inventing new visuals.
