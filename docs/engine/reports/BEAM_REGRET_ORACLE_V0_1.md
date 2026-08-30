# Beam Regret Oracle V0.1

**Gate:** 2E.5-QA · **Status:** NON-CANONICAL · **Offline only**

## Comparability caveat (do not fake exactness)

H2 lane composers optimize **lane-specific** objectives; final arbitration uses **RouteChoiceScore** on common features.
A single exact solver cannot be mathematically identical to both simultaneously.

**OracleObjective (explicit):**

`mean(BaseNodeValue along stops) − 0.15 × mean(transition minutes)`

Oracle transitions use a haversine walking proxy (not frozen Mapbox edges) for offline tractability.
Beam side is scored on the **same OracleObjective** (haversine proxy on beam stop sequence) for fair regret.
Default runtime beamWidth=24, candidateExpansionLimit=12 — **not mutated**.

## Representative subset results

| Fixture | lane | beam stops | beam oracle-obj | BnB oracle-obj | regret | pool | runtime_ms | exactness |
|---|---|---|---:|---:|---:|---|---:|---|
| F1 | SIGNATURE | STGO_01→STGO_02→STGO_18→STGO_03 | 73.23 | 72.82 | -0.40 | 24 | 1 | BNB_EXHAUSTIVE_OVER_POOL |
| F1 | SIGNATURE | STGO_01→STGO_02→STGO_18→STGO_03 | 73.23 | 72.82 | -0.40 | 48 | 1 | BNB_EXHAUSTIVE_OVER_POOL |
| F1 | SIGNATURE | STGO_01→STGO_02→STGO_18→STGO_03 | 73.23 | 72.82 | -0.40 | 22 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F1 | DISCOVERY | STGO_01→STGO_19→STGO_03 | 67.16 | 72.82 | 5.66 | 24 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F1 | DISCOVERY | STGO_01→STGO_19→STGO_03 | 67.16 | 72.82 | 5.66 | 48 | 1 | BNB_EXHAUSTIVE_OVER_POOL |
| F1 | DISCOVERY | STGO_01→STGO_19→STGO_03 | 67.16 | 72.82 | 5.66 | 22 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F1 | FLOW | STGO_01→STGO_22→STGO_16→STGO_02 | 65.70 | 72.82 | 7.12 | 24 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F1 | FLOW | STGO_01→STGO_22→STGO_16→STGO_02 | 65.70 | 72.82 | 7.12 | 48 | 1 | BNB_EXHAUSTIVE_OVER_POOL |
| F1 | FLOW | STGO_01→STGO_22→STGO_16→STGO_02 | 65.70 | 72.82 | 7.12 | 22 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F2 | SIGNATURE | STGO_01→STGO_22→STGO_02→STGO_16→STGO_18→STGO_19→STGO_03 | 66.27 | 72.82 | 6.55 | 24 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F2 | SIGNATURE | STGO_01→STGO_22→STGO_02→STGO_16→STGO_18→STGO_19→STGO_03 | 66.27 | 72.82 | 6.55 | 48 | 1 | BNB_EXHAUSTIVE_OVER_POOL |
| F2 | SIGNATURE | STGO_01→STGO_22→STGO_02→STGO_16→STGO_18→STGO_19→STGO_03 | 66.27 | 72.82 | 6.55 | 22 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F2 | DISCOVERY | STGO_01→STGO_22→STGO_02→STGO_16→STGO_18→STGO_19→STGO_03 | 66.27 | 72.82 | 6.55 | 24 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F2 | DISCOVERY | STGO_01→STGO_22→STGO_02→STGO_16→STGO_18→STGO_19→STGO_03 | 66.27 | 72.82 | 6.55 | 48 | 1 | BNB_EXHAUSTIVE_OVER_POOL |
| F2 | DISCOVERY | STGO_01→STGO_22→STGO_02→STGO_16→STGO_18→STGO_19→STGO_03 | 66.27 | 72.82 | 6.55 | 22 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F2 | FLOW | STGO_01→STGO_22→STGO_02→STGO_16→STGO_18→STGO_19→STGO_03 | 66.27 | 72.82 | 6.55 | 24 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F2 | FLOW | STGO_01→STGO_22→STGO_02→STGO_16→STGO_18→STGO_19→STGO_03 | 66.27 | 72.82 | 6.55 | 48 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F2 | FLOW | STGO_01→STGO_22→STGO_02→STGO_16→STGO_18→STGO_19→STGO_03 | 66.27 | 72.82 | 6.55 | 22 | 1 | BNB_EXHAUSTIVE_OVER_POOL |
| F6 | SIGNATURE | STGO_01→STGO_22→STGO_20→STGO_35→STGO_34 | 56.23 | 60.87 | 4.65 | 24 | 4 | BNB_EXHAUSTIVE_OVER_POOL |
| F6 | SIGNATURE | STGO_01→STGO_22→STGO_20→STGO_35→STGO_34 | 56.23 | 60.87 | 4.65 | 48 | 4 | BNB_EXHAUSTIVE_OVER_POOL |
| F6 | SIGNATURE | STGO_01→STGO_22→STGO_20→STGO_35→STGO_34 | 56.23 | 60.87 | 4.65 | 22 | 5 | BNB_EXHAUSTIVE_OVER_POOL |
| F6 | DISCOVERY | STGO_01→STGO_20→STGO_35→STGO_34→STGO_91 | 59.08 | 60.87 | 1.79 | 24 | 4 | BNB_EXHAUSTIVE_OVER_POOL |
| F6 | DISCOVERY | STGO_01→STGO_20→STGO_35→STGO_34→STGO_91 | 59.08 | 60.87 | 1.79 | 48 | 4 | BNB_EXHAUSTIVE_OVER_POOL |
| F6 | DISCOVERY | STGO_01→STGO_20→STGO_35→STGO_34→STGO_91 | 59.08 | 60.87 | 1.79 | 22 | 3 | BNB_EXHAUSTIVE_OVER_POOL |
| F6 | FLOW | STGO_01→STGO_02→STGO_16→STGO_20→STGO_35→STGO_34 | 54.32 | 61.17 | 6.85 | 24 | 12 | BNB_EXHAUSTIVE_OVER_POOL |
| F6 | FLOW | STGO_01→STGO_02→STGO_16→STGO_20→STGO_35→STGO_34 | 54.32 | 61.17 | 6.85 | 48 | 11 | BNB_EXHAUSTIVE_OVER_POOL |
| F6 | FLOW | STGO_01→STGO_02→STGO_16→STGO_20→STGO_35→STGO_34 | 54.32 | 61.17 | 6.85 | 22 | 12 | BNB_EXHAUSTIVE_OVER_POOL |
| F8 | SIGNATURE | STGO_01→STGO_22→STGO_19→STGO_18→STGO_06→STGO_03 | 48.11 | 49.61 | 1.50 | 24 | 8 | BNB_EXHAUSTIVE_OVER_POOL |
| F8 | SIGNATURE | STGO_01→STGO_22→STGO_19→STGO_18→STGO_06→STGO_03 | 48.11 | 49.61 | 1.50 | 48 | 8 | BNB_EXHAUSTIVE_OVER_POOL |
| F8 | SIGNATURE | STGO_01→STGO_22→STGO_19→STGO_18→STGO_06→STGO_03 | 48.11 | 49.61 | 1.50 | 22 | 7 | BNB_EXHAUSTIVE_OVER_POOL |
| F8 | DISCOVERY | STGO_01→STGO_02→STGO_92→STGO_19→STGO_03→STGO_18→STGO_06 | 46.98 | 49.61 | 2.63 | 24 | 9 | BNB_EXHAUSTIVE_OVER_POOL |
| F8 | DISCOVERY | STGO_01→STGO_02→STGO_92→STGO_19→STGO_03→STGO_18→STGO_06 | 46.98 | 49.61 | 2.63 | 48 | 9 | BNB_EXHAUSTIVE_OVER_POOL |
| F8 | DISCOVERY | STGO_01→STGO_02→STGO_92→STGO_19→STGO_03→STGO_18→STGO_06 | 46.98 | 49.61 | 2.63 | 22 | 9 | BNB_EXHAUSTIVE_OVER_POOL |
| F8 | FLOW | STGO_01→STGO_02→STGO_22→STGO_19→STGO_92→STGO_18→STGO_03 | 45.94 | 49.61 | 3.67 | 24 | 9 | BNB_EXHAUSTIVE_OVER_POOL |
| F8 | FLOW | STGO_01→STGO_02→STGO_22→STGO_19→STGO_92→STGO_18→STGO_03 | 45.94 | 49.61 | 3.67 | 48 | 9 | BNB_EXHAUSTIVE_OVER_POOL |
| F8 | FLOW | STGO_01→STGO_02→STGO_22→STGO_19→STGO_92→STGO_18→STGO_03 | 45.94 | 49.61 | 3.67 | 22 | 9 | BNB_EXHAUSTIVE_OVER_POOL |
| F15 | SIGNATURE | STGO_01→STGO_22→STGO_02 | 73.23 | 76.38 | 3.15 | 24 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F15 | SIGNATURE | STGO_01→STGO_22→STGO_02 | 73.23 | 76.38 | 3.15 | 48 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F15 | SIGNATURE | STGO_01→STGO_22→STGO_02 | 73.23 | 76.38 | 3.15 | 22 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F15 | DISCOVERY | STGO_01→STGO_02→STGO_16 | 69.27 | 76.38 | 7.11 | 24 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F15 | DISCOVERY | STGO_01→STGO_02→STGO_16 | 69.27 | 76.38 | 7.11 | 48 | 1 | BNB_EXHAUSTIVE_OVER_POOL |
| F15 | DISCOVERY | STGO_01→STGO_02→STGO_16 | 69.27 | 76.38 | 7.11 | 22 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F15 | FLOW | STGO_01→STGO_02→STGO_16 | 69.27 | 76.38 | 7.11 | 24 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F15 | FLOW | STGO_01→STGO_02→STGO_16 | 69.27 | 76.38 | 7.11 | 48 | 0 | BNB_EXHAUSTIVE_OVER_POOL |
| F15 | FLOW | STGO_01→STGO_02→STGO_16 | 69.27 | 76.38 | 7.11 | 22 | 0 | BNB_EXHAUSTIVE_OVER_POOL |

## Beam / pool sensitivity

Frozen runtime beamWidth=24. This gate does **not** mutate composer config.
Candidate-pool sensitivity is reported above (top-24 / top-48 / all feasible by BaseNodeValue).
Beam-width sweep 8/16/64/256 is **not** executed against production composer (would require parallel harness mutating search config). Documented as CONFIG_REQUIRED for a future diagnostic harness.
Reported regret is vs OracleObjective only — not vs RouteChoiceScore.

## Exactness statement

For Launch30 corpus size, BnB over top-24 with maxStops≤8 is typically exhaustive within the time budget.
Larger pools may hit the soft time limit; those rows are labeled `BNB_TIME_LIMITED_BEST` — not claimed exact.

**Negative regret** can appear when the beam stop sequence scores higher on OracleObjective than the BnB best under the oracle's simplified fixed-dwell (12 min) time-feasibility pruning. That is an honest model mismatch — not claimed as beam optimality over Mapbox/RouteChoiceScore.

