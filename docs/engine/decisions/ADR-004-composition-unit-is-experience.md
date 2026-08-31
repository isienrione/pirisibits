# ADR-004 — Composition unit is Experience

**Status:** Accepted (Feature-Complete Alpha / NON-CANONICAL)  
**Gate:** 2E.6

## Decision

The unit of route composition is an **Experience** (at a Place or corridor), not a raw POI dwell scalar.

Place owns geometry/access. Experience owns visit mode, time profile, constraints, narrative identity. ContentModule owns authored narration variants.

## Consequences

- Legacy POIs are adapted to `STGO_XX::LEGACY_CORE` Experiences without fabricating visit semantics.
- Mutual exclusion defaults to one core Experience per Place.
- Optional extensions may attach via `parentExperienceId`.
