# PhysicalEfficiency Correctness Audit V0.1

## Current formula

See `computePhysicalEfficiency` in `route-common-features.v0.2.ts`:
component terms use `clamp01(...)*100` then `blendKnown`. Metro burden also clamp01-based.

## Observed (F1–F18 candidates)

| stat | current | vnext parallel |
|---|---:|---:|
| n | 54 | 54 |
| min | 75.5 | 75.5 |
| max | 91.4 | 91.4 |
| mean | 82.8 | 82.8 |
| std | 3.2 | 3.2 |
| negative | 0 | 0 |
| >100 | 0 | 0 |

**Unbounded below?** Not observed; clamps appear to keep outputs ≥ 0.

**Vnext:** `src/engine/scoring/v0.2/physical-efficiency-vnext/` — bounded [0,100], PARALLEL ONLY, not in arbitration.
