# w01 — 06 QA Scorecard

**Rule:** Runtime `revealTier = "flagship"` only after **ALL** mandatory gates PASS.  
**Aspiration ≠ shipping.**

---

## Mandatory gates (PASS/FAIL)

| # | Gate | Pass criteria |
|---|------|---------------|
| 1 | Same-place recognition immediate | Blind viewer names Colosseum plaza within 1s |
| 2 | Camera/viewpoint registration convincing | Façade does not swim/slide vs Now on hold |
| 3 | Major façade geometry remains locked | Anchors A1–A6 from `01_CAMERA_LOCK.md` hold |
| 4 | Ancient state materially transforms understanding | Not merely “cleaner stone” — outer ring + venue life |
| 5 | Historical architecture defensible | Matches `02_HISTORICAL_SPEC.md` confidence classes |
| 6 | Human activity restrained and defensible | Matches `03_LIVING_SCENE.md` |
| 7 | No obvious AI artifacts | Hands/faces/stone edges acceptable at phone distance |
| 8 | No fake text / pseudo-Latin | Zero invented inscriptions |
| 9 | No Hollywood spectacle | No exterior combat, processions-as-default, fantasy grade, giant sealed velarium roof |
| 10 | Works in portrait | 9:16 / immersive cover readable |
| 11 | Works under outdoor brightness | Contrast holds in sun; lighting matches Now direction |
| 12 | Hold/release feels immediate | Then still ready; no multi-second blank; **still-first (no motion required)** |
| 13 | Release back to Now reinforces alignment | Alignment “clicks” on release |
| 14 | Performance acceptable on real iPhone | No jank / thermal spiral; loop optional |
| 15 | Offline fallback works | Still-only Then without video hydrate |
| 16 | English unaffected | Narration/UI regression clean |
| 17 | Spanish unaffected | Overlay captions/hotspots OK |
| 18 | Marketing confidence | Would use in ChronoWalk demo/ad |

**FAIL any row → not flagship.** Fix and re-run.

---

## Soft scores (advisory)

| Dimension | 1–5 | Notes |
|-----------|-----|-------|
| Living Postcard presence | | |
| Restraint / trust | | |
| Mobile composition | | |
| Motion value-add (if any) | | 3 = neutral; motion must not hurt registration |

---

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| Historical | | | PASS / FAIL |
| Product / founder | | | PASS / FAIL |
| Engineering (perf/device) | | | PASS / FAIL |

Only after all three PASS may a later PR set `revealTier: "flagship"` for `w01`.
