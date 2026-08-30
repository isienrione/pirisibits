# Routing Snapshot / Geometry Integrity Audit V0.1

**Gate:** 2E.5-QA · **Status:** NON-CANONICAL · **CURRENT graph only — DO NOT rebuild**

## Scope

Audit of the frozen Santiago physical / Launch30 runtime graph. No OSM replacement. No graph rebuild.

## Checks (CI-style tests in `gate2e5.qaMeasurement.test.ts`)

| Check | Result expectation |
|---|---|
| Launch30 count | 30 nodes |
| Finite WGS84 bounds | lat/lng finite; Santiago bbox roughly [-34.5,-32.5] × [-71.5,-69.5] |
| STGO_105 coordinates | `null` (`IDENTITY_RESOLVED_PHYSICAL_PENDING`) — not fabricated |
| Duplicate experience-point coords | < 3 duplicate keys among Launch30 |
| Suspicious repeated-delta / grid artifact | consecutive identical nonzero lat deltas < 5 |
| Coordinate provenance gate | enforced in schema via per-field provenance (`AI_PROPOSED_UNVERIFIED` not routable) |

## Frozen snapshot assumptions

- Physical edges derive from provider evidence already frozen in-repo (Mapbox/physical snapshot + DTPM GTFS provenance as established in prior gates).
- This gate does **not** mutate edge tables or regenerate connectivity.

## Placeholder-pattern audit

No Launch30 runtime coordinate grid/increment placeholder pattern detected at the threshold used by the integrity test. STGO_105 remains intentionally non-routable pending physical resolution.

## Conclusion

Current frozen physical graph remains valid for continued NON-CANONICAL measurement work. No OSM cutover.
