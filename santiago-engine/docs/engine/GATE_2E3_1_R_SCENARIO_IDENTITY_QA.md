# Gate 2E.3.1-R

Status:
**RECONSTRUCTED EQUIVALENT — NOT ORIGINAL COMMIT**

Original historical SHA:
`3da1d8bd`
**UNRECOVERABLE**

Reconstruction parent:
2E.3-R
`d7c62f490e0ee9337ba73e50107fdbcd09a56579`

Branch:
`cursor/gate-2e3x-canonical-reconstruction`

Executable oracle:
**F1–F18**

Lost historical oracle:
**R1–R8**

R1–R8 are **NOT** reconstructed.

B01–B12 are **NOT** substitutes.

116.1 is retained only as an **UNVERIFIED_HISTORICAL_NOTE**. It is not an executable oracle or test expectation.

No 2E.4+ semantics are included (no ExperienceTimeProfile, VisitMode, access overhead, marginal insertion, VNext, Feature-Complete Alpha).

Quarantined Feature-Complete Alpha (`origin/cursor/gate-2e6-feature-complete-alpha-d85a` @ `6918f1d0`) is untouched.

---

## Purpose

Deterministic answers to:

1. What exact scenario/request was executed?
2. What exact traveler state generated it?
3. What engine configuration generated it?
4. What exact route resulted?
5. Can we reproduce the same result?
6. Can we detect accidental scenario drift?
7. Can we detect accidental route-output drift?
8. Can Founder Inspection identify the exact scenario/run being reviewed?

This gate establishes **scenario identity**. It does not calibrate or improve routes.

---

## Scenario identity schema

Adapter: `src/dev/route-lab/scenarioIdentity.ts`  
Schema: `santiago-scenario-identity.v0.1`

Fingerprint payload (canonical JSON):

- `scenarioId`
- `travelerFixtureId` (`TRAVELER_FIXTURES.*` | `F8_D1_FLANEUR_TRAVELER` | `INLINE`)
- `request` (normalized `RouteRequestV01`, all route-affecting fields that exist)
- `notModeled`: `["familiarity"]`

Presentation-only fields (`label`, `description`, `watchNote`) are **not** hashed.

`scenarioFingerprint` is SHA-256 hex truncated to 24 characters (same convention as `hashRouteRequest`).

`requestHash` remains the existing engine request hash and is **not** the scenario fingerprint.

F2 and F18 share `requestHash` (F18 is a deterministic F2 request repeat) but have distinct `scenarioFingerprint` values because `scenarioId` is part of identity.

Familiarity is **NOT_MODELED**. It is not fabricated.

---

## Canonical serialization

- object keys sorted
- `preferredThemes` / `avoidThemes` sorted (unordered sets)
- `interests` order preserved (ordered preference)
- no timestamps, UUIDs, filesystem paths, or machine names
- numbers via `JSON.stringify` (same as existing request hashing)

---

## Route result identity

Do not conflate:

| Field | Meaning |
|---|---|
| `scenarioFingerprint` | what exact scenario/request we asked |
| `requestHash` | existing engine hash of the normalized request |
| `routeFingerprintV01` | existing 16-hex Founder Inspection hash of the V0.1 reranked winner |
| `routeFingerprintV02` | 16-hex hash of V0.2 recommended lane / route id / confidence |

V0.1 and V0.2 fingerprints are labeled separately. They are not interchangeable.

---

## Frozen oracle

`src/data/santiago/routes/gate-2e31r-scenario-identity-oracle.v0.1.json`

Tests **read** this file. They do not regenerate it.

---

## Lost R1–R8 tombstone

`src/dev/route-lab/lostHistoricalScenarios.ts`

Status: `LOST_HISTORICAL_ORACLES`  
Original SHA `3da1d8bd` **UNRECOVERABLE**

Known historical 2E.3.2 statement (R1 ≈ 116.1 modeled minutes) is stored only as `UNVERIFIED_HISTORICAL_NOTE`.

---

## Founder Inspection

The 2E.3-R view now also shows:

- SCENARIO IDENTITY (id, fingerprint, traveler/request fields, NOT_MODELED)
- RESULT IDENTITY (V0.1 / V0.2 fingerprints, ordered route)
- REPRODUCIBILITY (frozen oracle match, scenario drift)

Diagnostic UI only. No engine semantics depend on it.
