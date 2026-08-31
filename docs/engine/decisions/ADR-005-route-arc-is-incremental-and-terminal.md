# ADR-005 — Route arc is incremental and terminal

**Status:** Accepted (Feature-Complete Alpha / NON-CANONICAL)  
**Gate:** 2E.6

## Decision

Narrative quality has two complementary evaluations:

1. **IncrementalArcValue** — guides next-Experience selection under ArcStateVNext (budget-fraction phases).
2. **ArcQualityVNext** — terminal route quality after a candidate is complete (timeUtilization removed; time stays in time evaluation).

## Consequences

- Progression uses `fractionOfBudgetConsumed`, not stop index.
- Phase thresholds are provisional (`CALIBRATION_REQUIRED`).
- Frozen H2 / Arc V0.1–V0.2 remain unchanged.
