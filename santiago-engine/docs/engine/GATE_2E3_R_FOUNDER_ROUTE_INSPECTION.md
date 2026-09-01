# Gate 2E.3-R

Status:
**RECONSTRUCTED EQUIVALENT — NOT ORIGINAL COMMIT**

Original historical SHA:
`d4d7f6c1`
**UNRECOVERABLE**

Reconstruction parent:
Gate 2E.2E.1-R
`e4a1425f4ee12c702e0bd37bdae278fc94c01b02`

Branch:
`cursor/gate-2e3x-canonical-reconstruction`

This checkpoint reconstructs the intended **founder route inspection capability**, not the original UI or Git object.

Quarantined Feature-Complete Alpha (`origin/cursor/gate-2e6-feature-complete-alpha-d85a` @ `6918f1d0`) is untouched. The 2E.6F founder-benchmark review was read as historical evidence only and was **not** back-ported.

---

## Evidence basis

- surviving F1–F18 Route Lab
- route explainers (`route-explain.ts` inclusion / omission strings)
- fingerprints (`gate-2e1-engine-fingerprint.v0.1.json`, arc-reranker fixtures)
- human review structures (Gate 2E.1 local review remains; 2E.3-R adds a separate judgment schema)
- arbitration QA / Choice Policy V0.2

---

## Evidence-supported reconstructed behavior

A founder can select F1–F18 in Route Lab Founder Inspection mode and see:

- traveler / request summary
- V0.1 reranked winning route (F1–F18 inspection target)
- V0.2 winning lane and arbitration confidence (parallel; may differ from V0.1 route)
- exact ordered stop IDs and names
- modeled minutes
- route fingerprint
- existing score components
- inclusion explanations already produced by the composer
- omission reason codes already produced by the composer
- ordered coordinates where the frozen node layer already has them
- human-review fields that cannot feed the engine

Engine scoring, weights, arbitration, search, graphs, and F1–F18 definitions are unchanged.

---

## Historical limitation

The original Gate 2E.3 founder-lab UX cannot be recovered exactly.

This reconstruction preserves the intended **CAPABILITY**, not the original UI implementation.

R1–R8 are **not** reconstructed here.

No Gate 2E.4+ semantics are included (no ExperienceTimeProfile, VisitMode, access overhead, marginal insertion, VNext, Feature-Complete Alpha).

---

## Inspection model

Adapter (read-only): `src/dev/route-lab/founderInspection.ts`

Human judgment (not an engine input): `src/dev/route-lab/founderInspectionReview.ts`

Unavailable engine fields are marked `UNKNOWN` or `NOT_MODELED` (example: traveler familiarity is **NOT_MODELED** at this checkpoint). Omission reasons are the surviving `reasonCode` values; no new semantic taxonomy is inferred.

V0.1 Route Lab winner and V0.2 arbitration winner are both exposed. They are not forced to be the same route.

---

## Founder Lab

Static: `docs/engine/gate-2e-route-lab.html`

Dev serve: `npm run gate:2e:serve` → `http://localhost:8791/dev/route-lab`

Button: **FOUNDER INSPECTION**

Review persistence: localStorage + export/import JSON. `humanReviewAffectsEngine: false`.
