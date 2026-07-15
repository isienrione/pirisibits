# V3 — Premium clarity landing (baseline snapshot)

Saved **2026-07-14** before the editorial restructure. Snapshot of the live `src/landing/` implementation (premium ChronoWalkLanding v3: clarity-first hero, user flow, monuments, tiers, FAQ, final CTA).

**Purpose:** compare after redesign, or revert without digging through git history.

The live landing under `src/landing/` was **not** deleted — this folder is a frozen copy only.

## Restore this version

```bash
# From chronowalk/
cp src/landing/archive/v3-premium-baseline-2026-07-14/* src/landing/
```

Then rebuild: `npm run build`

## Preview

`npm run dev` → http://localhost:5173/landing

## Baseline artifacts

Screenshots, Lighthouse scores, and conversion analytics notes recorded in:

`docs/landing-baseline/`
