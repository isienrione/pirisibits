# Santiago Identity Decisions V0.1

**Gate:** 2E.4  
**Status:** FOUNDER APPROVED (not UNKNOWN / not unresolved)  
**Decision date:** 2026-08-30  
**Classification:** `FOUNDER_APPROVED_IDENTITY_CORRECTION`

---

## STGO_18 — Edificio Ariztía

| Field | Value |
|---|---|
| Canonical ID | `STGO_18` |
| Canonical name | **Edificio Ariztía** |
| Display name | **Edificio Ariztía** |
| Descriptive alias | Edificio Ariztía (Flat-Iron) |
| Decision | FOUNDER APPROVED |
| decisionSource | `FOUNDER_APPROVED` |
| decisionDate | 2026-08-30 |

### Previous identity

- Active engine label was: `Edificio Palacio Ariztía (Flat-Iron)`
- That compound label incorrectly introduced **Palacio** into the canonical/display identity.

### Decision

The intended POI is **Edificio Ariztía (flat-iron building)** — **not** “Palacio Ariztía”.

- Remove “Palacio” from active canonical/display identity.
- Preserve the old compound label only in provenance / migration history.
- Do **not** create a separate Palacio Ariztía node.
- Coordinates remain the existing STGO_18 coordinates.
- Physical graph identity remains STGO_18.
- Semantic calibration remains attached to STGO_18.
- Route geography / engine behavior unchanged except identity/display text.

---

## Teatro Municipal de Santiago — downtown

| Field | Value |
|---|---|
| Canonical ID | **`STGO_105`** (founder extension) |
| Canonical name | **Teatro Municipal de Santiago** |
| Display name | **Teatro Municipal de Santiago** |
| Decision | FOUNDER APPROVED |
| decisionSource | `FOUNDER_APPROVED` |
| decisionDate | 2026-08-30 |
| Coordinates | **UNVERIFIED / null** (do not fabricate) |
| Physical eligibility | **`IDENTITY_RESOLVED_PHYSICAL_PENDING`** |
| Launch corpus | **false** (not route-eligible yet) |

### What it is / is not

It **is** the historic **downtown** Teatro Municipal de Santiago previously identified by the founder.

It is **not**:

- Plaza Ñuñoa
- Teatro Municipal de Ñuñoa
- Club de la Unión

### Resolution path used

**Option B** — no correct downtown Teatro Municipal node with verified coordinates existed under another STGO ID.

- Created extension **`STGO_105`** (next safe ID after STGO_104).
- Did **not** mutate frozen original 103 IDs destructively.
- Linked to physical-identity slug `teatro-municipal` (historically UNGEOCODED; prior Mapbox hits included wrong communes).
- Coordinates left null pending verified provider / founder evidence.

### Production routing

`PHYSICAL_ROUTE_GENERATION_ENABLED=false`. STGO_105 must **not** contaminate R1–R8 / Launch30 route outputs until physical + semantic enrichment is complete.

---

## STGO_59 — Club de la Unión (collision disposition)

| Field | Value |
|---|---|
| Canonical ID | `STGO_59` |
| Final canonical identity | **Club de la Unión** |
| Decision | FOUNDER APPROVED |
| decisionSource | `FOUNDER_APPROVED` |
| decisionDate | 2026-08-30 |

### Erroneous association (DEPRECATED)

Derived/editorial data previously labeled STGO_59 as:

> **Plaza Ñuñoa & Teatro Municipal**

That mapping is **ERRONEOUS** and **DEPRECATED**.

Disposition:

- Keep STGO_59 as **Club de la Unión** (matches frozen engine / physical-identity lineage `club-de-la-union`).
- Remove erroneous Plaza Ñuñoa / Teatro Municipal **active display identity** from derived semantic calibration.
- Downtown Teatro Municipal lives at **STGO_105**, not STGO_59.
- Historical seed editorial text in frozen `SANTIAGO_ENGINE_DATASET_V0.1.json` is preserved as historical input (seed bytes unchanged); derived identity text is corrected.

### Semantic contamination note

STGO_59 thematic/structural values may historically reflect Plaza Ñuñoa framing. Founder re-verification of those vectors is recommended; display identity is corrected now.

---

## Provenance contract (both corrections)

Each correction records:

- `decisionSource: FOUNDER_APPROVED`
- `decisionDate`
- `previousIdentity`
- `canonicalIdentity`
- `reason`

Historical source values are not silently erased.
