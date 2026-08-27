# ChronoWalk Traveler — demo today

Status: **done for this environment** (typecheck + unit tests). Visual QA blocked (no simulator).

## Repo reality

This Cloud Agent opened `isienrione/pirisibits` on `figma` (Rome PWA in `chronowalk/`). The sprint zip assumed `apps/traveler`, `docs/canonical/*`, and Santiago `docs/core_a`. Those were missing.

Decisions:

- Did **not** rewrite the Rome PWA.
- Added Expo workspace `apps/traveler` + `packages/domain`.
- Fixture from Rome manifest + Route Master facts. Nothing invented for missing coordinates/times.
- ScreenRegistry from sprint prompt ids. `07_SCREEN_INVENTORY.md` absent — not padded to a fake 41.

## Checklist

- [x] Overlay copied
- [x] Phase 01 — foundation, design, navigation, D0 primitives
- [x] Phase 02 — onboarding, proposal, demo service, fixture script
- [x] Phase 03 — walk, lazy location, map no-token
- [x] Phase 04 — Hero / Discovery / Mystery / Reveal
- [x] Phase 05 — adapt, resume, offline/GPS/settings
- [x] Phase 06 — gallery, DEMO_SCRIPT, HANDOFF, typecheck, tests

## Commands

```
pnpm install
pnpm generate:fixture
pnpm test        # 12 passed
pnpm typecheck   # passed
```

## Blockers (open)

| Blocker | Action taken |
| --- | --- |
| Canonical docs missing | Continued from sprint prompts |
| Santiago JSON missing | Rome sources only |
| No simulator | Documented; do not claim visual QA |
| No Mapbox token | Paper plot of sourced points |
| Figma MCP unauthenticated | Skipped |
