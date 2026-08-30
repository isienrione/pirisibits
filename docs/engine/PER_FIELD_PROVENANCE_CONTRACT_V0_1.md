# Per-Field Provenance Contract V0.1

**Gate:** 2E.5-QA · **Status:** NON-CANONICAL · **Schema only**

Node-level provenance remains for compatibility. Field-level provenance is additive where node-level semantics are insufficient.

## Supported independent fields

| Field | Status enum |
|---|---|
| coordinates | FieldProvenanceStatus |
| opening hours | FieldProvenanceStatus |
| ticket facts | FieldProvenanceStatus |
| accessibility | FieldProvenanceStatus |
| visit mode | FieldProvenanceStatus |
| dwell/time fields | FieldProvenanceStatus |
| physical friction | FieldProvenanceStatus |
| narrative relation | FieldProvenanceStatus |
| semantic vectors | FieldProvenanceStatus |

`FieldProvenanceStatus ∈ { AI_PROPOSED_UNVERIFIED, PROVIDER_DERIVED, CURATOR_APPROVED, FIELD_VERIFIED, FOUNDER_APPROVED, UNKNOWN }`

## Routing / feasibility rules

1. **AI_PROPOSED_UNVERIFIED coordinates → NOT ROUTABLE**
2. **AI_PROPOSED_UNVERIFIED transit topology/times → NOT ROUTABLE**
3. **UNKNOWN coordinates → NOT ROUTABLE**
4. **M2 step-free:** absence of sufficiently trusted accessibility evidence = **fail closed**  
   Trusted = `CURATOR_APPROVED | FIELD_VERIFIED | FOUNDER_APPROVED` and `stepFreeKnown === true`

Do not fabricate hard-feasibility facts.

Implementation: `src/engine/routes/experience-time/vnext/per-field-provenance.ts`
