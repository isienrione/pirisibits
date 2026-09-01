# Gate 2E.2E.1-R

Status:
**RECONSTRUCTED EQUIVALENT — NOT ORIGINAL COMMIT**

Original historical SHA:
`29270b67`
**UNRECOVERABLE**

Reconstruction base:
`c56b2bcc` (`feat(engine): add v0.2 route lane arbitration`)

Branch:
`cursor/gate-2e3x-canonical-reconstruction`

This checkpoint is a reconstructed equivalent of Gate 2E.2E.1 arbitration-correctness behavior. It does **not** reproduce the original SHA or claim to be the lost implementation.

Quarantined Feature-Complete Alpha (`origin/cursor/gate-2e6-feature-complete-alpha-d85a` @ `6918f1d0`) is untouched.

---

## Evidence-supported reconstructed behavior

- lane-neutral arbitration (already present at `c56b2bcc`; preserved)
- ComposerScore excluded as direct cross-lane winner criterion (`usedComposerScore: false`; `ROUTE_CHOICE_WEIGHTS` has no `composerScore` key)
- F8 corrected to **D1** (label and executable fixture now match)
- F15 constraint-dominated diagnostic preserved
- lane win distribution is diagnostic, not a target
- no weight tuning to force lane diversity

---

## F8 D1 correction

At `c56b2bcc`:

- F8 Route Lab label: D1 Flâneur
- `TRAVELER_FIXTURES.F_discovery_forward.discoveryPosture` = **D2**
- Canonical posture enum: `DiscoveryPostureCode` = `'D1' | 'D2' | 'D3'` (`src/engine/taxonomy.ts`)
- D1 = Essentials-balanced / Flâneur

Reconstruction change (smallest): F8 uses `F8_D1_FLANEUR_TRAVELER` = `{ ...F_discovery_forward, discoveryPosture: 'D1' }`.

Unchanged: interests, rhythm, time budget, start, mobility, scoring weights, candidate generation, physical graph, narrative graph.

`F_discovery_forward` remains D2 for Gate 2A. Taxonomy labels D2 as “Discovery-forward / Detective”; renaming that fixture is out of scope.

---

## UNKNOWN reconstruction note

The original phrase **“UNKNOWN fallbacks removed”** cannot be recovered precisely from surviving Git evidence.

The reconstructed gate therefore preserves `c56b2bcc` UNKNOWN **renormalization** semantics (`blendKnown`: UNKNOWN terms are dropped and remaining weights renormalized; UNKNOWN is not scored as 0) rather than inventing a replacement behavior.

This is a documented reconstruction uncertainty.

---

## Explicitly not reconstructed here

- R1–R8 are **NOT** reconstructed here.
- 116.1 is **NOT** reconstructed here.
- No later Gate 2E.4+ concepts are included (no ExperienceTimeProfile, VisitMode, access overhead, marginal insertion, VNext, Feature-Complete Alpha).
- No founder route inspection lab (Gate 2E.3).
- No scenario-identity QA (Gate 2E.3.1).
- No identity repair (STGO_18 / STGO_105).
- No scoring retuning and no lane quotas.

---

## Route output impact (F8 D2 → D1)

F1–F18 matrix compared live before/after the F8 posture override.

**Only F8 changed.** Winner lanes for F1–F18 are unchanged (F8 remains DISCOVERY / CLOSE_CALL). Aggregate lane distribution remains SIGNATURE 8 / DISCOVERY 9 / FLOW 1 (diagnostic, not a target).

| | F8 before (D2 executable) | F8 after (D1 executable) |
|---|---|---|
| V0.2 winner lane | DISCOVERY | DISCOVERY |
| V0.2 confidence | CLOSE_CALL | CLOSE_CALL |
| V0.2 stops | `01-02-92-19-03-18-06` | **same stops** |
| V0.2 routeId | `v02_DISCOVERY_8d7b3185_…` | `v02_DISCOVERY_efaca3e1_…` (request hash only) |
| V0.1 fingerprint (sha256 16) | `47c4583e8bdfc456` | `ecf606a7fdcc8993` |
| V0.1 topReranked | `STGO_01-92-18-03-19-22-02` | `STGO_01-92-18-03-19-02-26` |

Frozen F8 oracles were regenerated so tests match the D1 fixture. Other fixture rows were not rewritten except QA aggregate stats that include F8. No scoring weights were tuned.

---

## Temporal contamination

This gate must not introduce:

- `src/engine/routes/experience-time/`
- `src/engine/vnext/`
- ExperienceTimeProfile / executable VisitMode / PASS_THROUGH / EXTERIOR_CORE / INTERIOR_CORE / OPTIONAL_INTERIOR / EXTENDED_VISIT
- access-overhead or marginal-insertion **implementation**
- ArcStateVNext / IncrementalArcValue / ArcQualityVNext / FEATURE_COMPLETE_ALPHA / VNext composer

Existing historical strings elsewhere in the `c56b2bcc` tree were not deleted. This gate did not introduce those concepts.

Vitest harness (`vitest.config.ts`): `testTimeout` 30s, `maxWorkers: 1`, and `disableConsoleIntercept` so F1–F18 fingerprint files finish under this machine’s 60s worker RPC limit. No engine scoring change.

