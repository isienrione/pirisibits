# MAP Reveal Strategy — Living Postcard

**Status:** Sealed product/technical source of truth for Rome Then/Now reveals  
**Sealed:** Day 3C final (founder decisions)  
**Baseline:** Day 3B inventory-truth `2cab7d00` + Day 3A MAP content model  
**Companion docs:** `MAP_PRODUCT_CONTRACT.md`, `MAP_DAY2_PRODUCTION_AUDIT.md`, `MAP_REVEAL_PRODUCTION_QUEUE.md`, `docs/reveal-production/*`

This document **supersedes** provisional Day 3C audit conclusions that ranked targets by existing-repo asset convenience. Existing assets are **inputs**, not constraints.

---

## 1. Living Postcard (definition)

ChronoWalk’s reveal ambition is **the Living Postcard**.

Not merely: “show what this monument looked like before.”

Rather: **for a moment, make the traveler feel that the ancient city has returned around the exact place where they are standing.**

The reveal should help transform:

| From | To |
|------|----|
| Ruins | Place |
| Monument | Function |
| Archaeological site | City |
| Information | Presence |

Strongest reaction we seek:

> “I am standing in the same place, but now I can suddenly understand what this place was.”

The phone is a **window through time**, not a movie trailer.

---

## 2. Three reveal quality levels

### Level 1 — Historical Reveal

Traveler understands: “That is what this structure/place looked like.”  
May qualify as runtime `worthwhile` after QA.

### Level 2 — Living Reveal

Traveler understands: “That is what this place looked **and functioned** like when it was alive.”  
May include historically defensible people, circulation, ritual, commerce, fabric, water, smoke, light, crowds, urban context — only when they clarify function and presence.  
Must **not** become decorative AI spectacle.

### Level 3 — Flagship Living Postcard

Desired reaction: “I’m standing in exactly the same place — and ancient Rome just appeared around me.”

A flagship must have:

1. Strong viewpoint registration  
2. Recognizable fixed geometry  
3. Historically defensible reconstruction  
4. Major perceptual transformation  
5. Human/functioning context where appropriate  
6. Excellent mobile legibility  
7. Cinematic atmosphere without Hollywood invention  
8. Compelling hold/release transformation  
9. Marketing/demo quality  
10. Enough restraint to feel historically trustworthy  

Wrong camera + beautiful recon ≠ flagship.  
Aligned image with little transformation ≠ flagship.  
Unsupported spectacular activity ≠ flagship.

---

## 3. Quality hierarchy (never reverse)

1. **SAME PLACE**  
2. **SAME VIEWPOINT**  
3. **HISTORICAL CREDIBILITY**  
4. **CLEAR TRANSFORMATION**  
5. **FUNCTION / LIFE**  
6. **CINEMATIC POLISH**

Registration with the physical world outranks cinematic excess.

---

## 4. Target portfolio (aspiration ≠ shipped)

### Four FLAGSHIP TARGETS

| # | placeId | Theme | Notes |
|---|---------|-------|-------|
| 1 | `w01` | Spectacle | Colosseum exterior — primary marketing image |
| 2 | `w17` | Sacred + urban life | Pantheon exterior — free experience / acquisition |
| 3 | `w03` | The city | Arch of Titus + Via Sacra — Forum as city, not park |
| 4 | `enc_circus` | Scale | Circus Maximus View — Path B only; viewpoint-matched required |

### Seven WORTHWHILE TARGETS

| # | placeId | Notes |
|---|---------|-------|
| 1 | `w02` | Colosseum interior |
| 2 | `w08` | Temple of Vesta |
| 3 | `w10` | Rostra (pseudo-Latin must be fixed before acceptance) |
| 4 | `w11_12` | Arch of Septimius Severus |
| 5 | `w14` | Trajan’s Market |
| 6 | `w20` | Largo di Torre Argentina (**moved from provisional flagship**) |
| 7 | `w21` | Castel Sant’Angelo → Hadrian’s mausoleum state |

**11 high-value reveal targets** total. MAP Day-1 acceptance does **not** require all 11 to pass.

### Day-1 acceptance (unchanged MAP contract)

- **8–10** genuinely worthwhile reveals overall (including flagships)  
- **At least 3** flagship-grade reveals must pass final QA  
- The fourth flagship target creates Path A redundancy so Circus (Path B) is not required for the promise  
- Do not artificially demote a genuine pass only to keep a count of 10  

### Target vs production-ready

| Term | Meaning |
|------|---------|
| **TARGET FLAGSHIP / TARGET WORTHWHILE** | Product intention — documented here |
| **READY / QA NEEDED / ASSET WORK / BLOCKED** | Production status — see queue doc |
| Runtime `revealTier` | What the product **ships**, after QA — **not** aspiration |

Do **not** write `revealTier: flagship|worthwhile` into runtime metadata until that place passes final visual / historical / performance QA.

---

## 5. Path coverage (do not change Path A/B)

| Path | Flagship exposure targets |
|------|---------------------------|
| **A** | `w01` Colosseum · `w03` Titus/Via Sacra · `w17` Pantheon |
| **B** | `w01` · `enc_circus` · `w03` · `w17` |

`enc_circus` remains Path-B-specific. Do **not** force Circus onto Path A.

---

## 6. Special product decisions

| Topic | Decision |
|-------|----------|
| **Palatine / Circus** | Distinct heroes. `enc_circus` owns Circus flagship. Do not duplicate Circus on `w04`. Palatine may later get Palatine-specific visuals. |
| **Piazza Navona (`w18`)** | Not counting until Domitian-stadium loop is verified as Navona. Pantheon-duplicate ancient JPG is poisoned — never use. |
| **Campo (`w19`)** | Bruno scene may become Discovery / other temporal reveal later — **not** ancient Living Postcard target. |
| **Rostra (`w10`)** | Worthwhile target; fake/pseudo-Latin must be corrected before acceptance. |
| **Castel (`w21`)** | Target = Hadrian’s mausoleum. Fortress-hybrid still is not the ancient target. |
| **Pantheon (`w17`)** | Misleading modern-photo `ancient-reconstruction.jpg` must not define the solution; use/rework the reconstruction loop. |
| **Largo (`w20`)** | Strong worthwhile; existing recon valuable if it passes QA — not flagship target. |
| **Other heroes** | May keep historical media / ordinary Threshold; do not inflate MAP reveal metrics with weak Then=Now. |

---

## 7. Motion philosophy

Living Postcard ≠ “generate lots of AI video.”

Motion is subordinate to presence. Prefer subtle, defensible motion: cloth, walking, water, smoke, sunlight, shadows, dust, crowd murmur.

Avoid: exaggerated camera motion, fantasy lighting, impossible crowds, invented ceremonies, gladiators-anywhere, trailer cuts, unsupported spectacle.

**Still-first** remains the default shipping posture; loops hydrate on demand for flagships (iOS OOM risk from Day-2 audit).

---

## 8. Historical rigor rule

Historical credibility outranks visual convenience.

- Certain / probable / conjectural must be labeled in production briefs and captions.  
- Unsupported text (e.g. fake Latin), wrong-place assets, and poisoned duplicates block acceptance.  
- Captions already used on Colosseum/Pantheon/Titus (conjecture callouts) are the honesty pattern to extend.

---

## 9. Performance philosophy

- Prefer **still + optional loop** for worthwhile.  
- Flagships: **still-first poster** + **flagship loop hydrated on demand**.  
- Do not mass-hydrate reconstruction MP4s into offline packs.  
- Do not change offline collectors in strategy sealing; collectors follow when assets ship.

---

## 10. Superseded Day 3C provisional conclusions

The Day 3C visual audit remains useful **evidence**. The following **product rankings** from that audit are superseded:

| Provisional conclusion | New truth |
|------------------------|-----------|
| Largo (`w20`) as flagship #3 | **Worthwhile target** |
| Pantheon (`w17`) only worthwhile | **Flagship target #2** |
| Titus (`w03`) demoted/non-counting based solely on current asset | **Flagship target #3** (fresh visual-concept problem) |
| Exactly 3 flagship targets | **4 flagship targets**; ≥3 must pass QA |
| Asset availability as primary selector | **Living Postcard ambition** as primary selector |

---

## 11. Implementation gate

Strategy sealing does **not** authorize:

- imagery generation  
- provisional wiring of weak assets  
- Threshold redesign  
- premature runtime `revealTier`  
- Path A/B changes  
- Near Me / discoveries / Q&A  
- offline collector changes  
- commerce / entitlements / journey shape / Spanish localization changes  

Next work follows `MAP_REVEAL_PRODUCTION_QUEUE.md` and per-place briefs under `docs/reveal-production/`.
