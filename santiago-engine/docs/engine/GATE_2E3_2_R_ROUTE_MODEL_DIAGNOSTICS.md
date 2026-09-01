# Gate 2E.3.2-R

Status:
**RECONSTRUCTED EQUIVALENT — NOT ORIGINAL COMMIT**

Original historical SHA:
`d8f7d6c2`
**UNRECOVERABLE**

Reconstruction parent:
2E.3.1-R
`c8dd8ce6cdf164fbf8db32d5bdc72d90a0015d00`

Branch:
`cursor/gate-2e3x-canonical-reconstruction`

This checkpoint reconstructs the **diagnostic capability and evidence-supported conclusions** of historical Gate 2E.3.2. It does not recreate the original commit, original R1–R8 implementation, original diagnostics files, or original UX.

Quarantined Feature-Complete Alpha (`origin/cursor/gate-2e6-feature-complete-alpha-d85a` @ `6918f1d0`) is untouched.

---

## Historical conclusions reconstructed with evidence

1. Current time model is based on existing dwell + transition semantics.
2. VisitMode is not modeled.
3. Access overhead is not modeled.
4. Marginal insertion burden is not modeled by runtime route search.
5. On-pathness is not modeled by runtime route search.
6. Content time vs stationary time is not modeled.
7. STGO_18 identity conflict is diagnosed (not mutated).
8. STGO_59 = Club de la Unión.
9. Downtown Teatro Municipal identity collision is diagnosed (coordinates UNKNOWN; STGO_105 not created).
10. Bandera / La Moneda diagnostic concern survives but the exact historical R-scenario is lost.
11. R1 ≈ 116.1 is an **UNVERIFIED_HISTORICAL_NOTE** only.
12. Founder disagreement exposed a modeling deficiency that should not be addressed by weight tuning alone.

Explicitly:

- No Experience-Time implementation exists in this checkpoint.
- No VisitMode implementation exists in this checkpoint.
- No identity dataset correction from Gate 2E.4 is applied here.
- No R1–R8 executable oracle exists.

---

## Pre-2E.4 time model (code)

`src/engine/routes/route-search.ts` beam search:

- start: `elapsed = dwellMinutes(start)` (transition 0)
- expansion: `add = t.durationMin + dwell.min`; `elapsed = round1(elapsed + add)`
- `dwellMinutes` = `visitDurationMinutes ?? visitTimeTypical`, else `DEFAULT_DWELL_FALLBACK_MIN` (12)

Modeled time is **SUM stop dwell + SUM transition duration**.

V0.2 lane search uses the same add formula; F1–F18 inspection routes remain the V0.1 reranked winners.

---

## Diagnostics (dev/QA only)

- `src/dev/route-lab/routeTimeDiagnostics.ts`
- `src/dev/route-lab/identityDiagnosticFindings.ts`
- `src/dev/route-lab/modelingDeficiencyFinding.ts`

`PRE_2E4_DIAGNOSTIC_INSERTION_ESTIMATE` = `movement(A,X)+movement(X,B)-movement(A,B)+currentEngineDwell(X)` when all physical transitions exist. It is **not** Experience-Time EMT. Missing edges are **UNKNOWN**, not inferred.

NOT_MODELED ≠ 0.

---

## Bandera / La Moneda

`HISTORICAL_CONCLUSION_SURVIVES` · `EXACT_SCENARIO_LOST`

La Moneda (`STGO_03`) is omitted from several F1–F18 winners with engine reason `NOT_EXPANDED_IN_BEAM`.

Paseo Bandera (`STGO_92`) is absent from several F winners but is **not** recorded in `omittedHighUtilityNodes` (utility gate for that list). Status: `NO_RECONSTRUCTABLE_CASE` for an engine omission explanation.

This does not reproduce the original Bandera/Moneda diagnostic.

---

## Modeling deficiency

Founder disagreement involving realistic stop burden cannot be safely treated as merely a scoring-weight problem. The subsequent modeling gate is **not** implemented here.
