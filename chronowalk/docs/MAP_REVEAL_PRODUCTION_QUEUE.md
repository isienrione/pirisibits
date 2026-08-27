# MAP Reveal Production Queue

**Status:** Living queue — aspiration vs readiness  
**Strategy SoT:** `docs/MAP_REVEAL_STRATEGY.md`  
**Briefs:** `docs/reveal-production/`  
**Baseline:** Day 3B `2cab7d00`

Runtime `revealTier` must stay `null` until a place **passes** final QA. This queue tracks **targets** and **production status** separately.

---

## Status vocabulary

| Status | Meaning |
|--------|---------|
| **TARGET FLAGSHIP** | Approved flagship ambition |
| **TARGET WORTHWHILE** | Approved worthwhile ambition |
| **READY** | Assets + wiring + QA passed; eligible for runtime tier |
| **QA NEEDED** | Candidate assets exist; needs human visual/historical/perf review |
| **ASSET WORK** | Needs new or remade still/loop/now before QA |
| **BLOCKED** | Historical, viewpoint, or media-poison issue unresolved |

Do **not** call a target READY merely because we intend it to be excellent.

---

## Flagship targets

| Priority | placeId | Theme | Status | Blocking issue | Next action |
|----------|---------|-------|--------|----------------|-------------|
| 1 | `w01` | Spectacle | ASSET WORK | Living Postcard beyond intact façade; still/loop alignment; hotspot id | Brief → produce matched Living Postcard still + optional motion |
| 2 | `w17` | Sacred + urban | ASSET WORK | Poisoned `ancient-reconstruction.jpg`; need loop-based / new matched then | Extract/rework from loop; never use modern-photo jpg |
| 3 | `w03` | The city | ASSET WORK | Current loop under-transforms Via Sacra / urban fabric | Fresh concept: road + city around recognizable arch |
| 4 | `enc_circus` | Scale | ASSET WORK | Aerial then vs ground/terrace now **not** accepted | Viewpoint-matched then from traveler geofence |

Path coverage: Path A needs `w01`+`w03`+`w17`. Path B adds `enc_circus`. Do not change Path A/B.

---

## Worthwhile targets

| Priority | placeId | Status | Blocking issue | Next action |
|----------|---------|--------|----------------|-------------|
| 1 | `w02` | QA NEEDED / light ASSET WORK | Interior still may wire; living bar = arena function not only seating | QA still; optional loop OD; avoid Hollywood death-match framing |
| 2 | `w20` | QA NEEDED | Strong recon exists; 9.8MB PNG-as-jpg; was demoted from flagship | Recompress; viewpoint QA; wire only after pass |
| 3 | `w10` | ASSET WORK | Pseudo-Latin “HENRTVS…” blocks acceptance | Correct inscription; then QA |
| 4 | `w21` | ASSET WORK | Fortress-hybrid jpg invalid; loop ≈ Hadrian mausoleum | Poster from mausoleum loop; discard hybrid as then |
| 5 | `w11_12` | ASSET WORK | Close-up then vs wide now mismatch | Matched now or reframed then |
| 6 | `w14` | ASSET WORK | Loop promising; now match uncertain | Elevated matched now |
| 7 | `w08` | ASSET WORK | Loop strong tholos; now match needed | Matched now of ruins |

---

## Explicitly not in Day-1 Living Postcard target set

| placeId | Reason | Possible later use |
|---------|--------|--------------------|
| `w04` | Circus owned by `enc_circus`; needs Palatine-specific concept | Palatine palace / terrace overlook (separate brief later) |
| `w18` | Navona loop identity unverified; ancient jpg poisoned | Worthwhile only after Domitian verification |
| `w19` | Bruno execution = early modern, not antiquity postcard | Discovery / other temporal reveal |
| `w06`, `w07`, `w13`, `w15`, `w16`, `w22`, `w23` | Do not inflate metrics | Historical media / ordinary Threshold OK |

---

## Recommended production ORDER

Optimized for **impact → learning → dependency → effort**:

1. **`w01` Colosseum exterior** — sets Living Postcard bar; marketing; teaches pipeline  
2. **`w17` Pantheon** — free-sample / conversion; reuses loop-as-reference workflow  
3. **`w02` Colosseum interior** — fast worthwhile learning (possible wire + QA)  
4. **`w20` Largo** — strong existing recon; compression + QA  
5. **`w03` Titus / Via Sacra** — hardest conceptual flagship; apply lessons from w01/w17  
6. **`enc_circus`** — viewpoint-matched scale flagship (Path B)  
7. **`w10` Rostra** — inscription fix then QA  
8. **`w21` Castel / Hadrian** — loop poster extraction  
9. **`w11_12` Severus** — registration fix  
10. **`w14` Trajan** — matched now  
11. **`w08` Vesta** — matched now  

---

## Runtime metadata gate

| Action | Allowed now? |
|--------|--------------|
| Document TARGET tiers | Yes |
| Assign runtime `revealTier` | **No** until QA pass |
| Wire provisional then paths | **No** in this strategy seal |
| Change Path A/B, commerce, journey, offline collectors | **No** |

When a place passes final QA, a later implementation PR may set `MAP_PLACE_OVERRIDES[placeId].revealTier` and wire media.

---

## Acceptance tests (portfolio)

**Portfolio pass (MAP Day-1 reveals):**

- ≥3 of {`w01`,`w17`,`w03`,`enc_circus`} ship as Level-3 Living Postcard  
- Path A travelers can encounter ≥3 flagships without Circus  
- Total shipped worthwhile+flagship reveals in **8–10** (or more if genuinely excellent)  
- No poisoned/wrong-place stills in shipped then paths  
- No mass MP4 hydrate in offline packs  
