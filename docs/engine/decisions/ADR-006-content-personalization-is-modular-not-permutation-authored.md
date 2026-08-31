# ADR-006 — Content personalization is modular, not permutation-authored

**Status:** Accepted (Feature-Complete Alpha / NON-CANONICAL)  
**Gate:** 2E.6

## Decision

Personalization of narration is achieved by selecting **ContentModules** (CORE, THEMATIC_DEPTH, NARRATIVE_LENS, MICRO_REVEAL, OPTIONAL_DEPTH, TRANSITION) against traveler + ArcState + time context.

We do **not** author 1,800 whole-tour narrative permutations.

## Consequences

- Missing modules → skip (no LLM fabrication).
- Transition modules are infrastructure-only until curated.
- Walking narration capacity remains UNKNOWN / CONFIG_REQUIRED.
