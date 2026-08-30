# NON-CANONICAL Gate 2E.4 — Status Marker

**STATUS: NON-CANONICAL — DO NOT MERGE**

**Date recorded:** 2026-08-30  
**Branch:** `cursor/gate-2e4-experience-time-model-d85a`  
**Substantive commit:** `ef5304b4`  
**Actual base:** `c56b2bcc`

---

## Reason

Gate 2E.4 was built from `c56b2bcc` because the canonical local checkpoint `d8f7d6c2` was unavailable in this environment.

This tip is **valuable archival work** but is **not** the canonical engine lineage.

Do **not** describe `ef5304b4` as canonical.

Do **not** merge this branch into:

- `chronowalk3.0`
- `main`
- `figma`
- or any production / canonical branch

---

## Required recovery

Recover canonical history through `d8f7d6c2` from the original Cursor/worktree environment that still holds Gates 2E.2E.1–2E.3.2, then transplant Gate 2E.4 onto that checkpoint.

See also: `docs/engine/GATE_2E4R_CANONICAL_LINEAGE_RECOVERY.md`

---

## Known intended chain

```
29270b67   Gate 2E.2E.1 arbitration correctness
→ d4d7f6c1 Gate 2E.3 Founder Route Inspection Lab
→ 3da1d8bd Gate 2E.3.1 Scenario Identity & Request-Integrity QA
→ d722f434 Gate 2E.3.2 initial time diagnostics
→ d8f7d6c2 Gate 2E.3.2 final diagnostics (enriched candidate-generation)
→ Gate 2E.4 (transplant of ef5304b4 substantive changes)
```

## Current noncanonical chain

```
c56b2bcc   Gate 2E.2E lane arbitration V0.2
→ ef5304b4 Gate 2E.4 experience-time model (NON-CANONICAL base)
```

---

## Flags on this tip (unchanged; no production cutover)

```
EXPERIENCE_TIME_MODEL_V0_1_PARALLEL_READY=true
EXPERIENCE_TIME_MODEL_V0_1_PRODUCTION=false
PHYSICAL_ROUTE_GENERATION_ENABLED=false
```
