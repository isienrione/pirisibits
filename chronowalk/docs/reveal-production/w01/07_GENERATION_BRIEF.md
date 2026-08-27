# w01 — 07 Generation Brief (viewpoint-preserving)

**Tool-agnostic.** For image-to-image / edit workflows.  
**NOT** a generic text-to-image prompt.

---

## CAMERA / GEOMETRY TRUTH (non-negotiable) — FOUNDER SEALED

1. The supplied modern photograph (`modern-poster.jpg`) is the **permanent camera lock for this iteration**.  
2. Do **not** invent a new angle, lens, height, crop-as-reframe, or orbit. **No camera recomposition.**  
3. Lock the Colosseum façade piers, cornices, attic left section, and **jagged outer-wall break**.  
4. Reconstruct antiquity **into this frame** — complete the missing outer ring on the right; do not replace the building with a different postcard.  
5. Output canvas must match the input Still dimensions (941×1672 or agreed 1080×1920 master).  
6. Portrait mobile composition; keep primary façade in the vertical center safe zone.  
7. **Preserve the real photograph’s lighting direction/logic** (sun from left; dark arch interiors).

**Input file:** `public/waypoints/colosseum/exterior/modern-poster.jpg`  
**Label any draft:** `PROTOTYPE — NOT FINAL HISTORICAL RECONSTRUCTION` until QA.  
**Binding decisions:** `00_FOUNDER_DECISIONS.md`

---

## Forbidden prompt patterns

Do **not** use standalone prompts like:

- “ancient Colosseum in Rome, cinematic, 8k”  
- “gladiators fighting in front of the Colosseum”  
- “epic orange sunset Roman empire trailer”

Those destroy registration and Living Postcard trust.

---

## Transform intent (what to change)

**From:** Ruined Flavian amphitheatre, missing outer wall on the right, empty modern plaza.  
**To:** Same viewpoint — complete outer ring, working arrival venue, restrained life on the plaza.

Theme: **SPECTACLE as arrival architecture** (not combat).

---

## Visual requirements (summary)

See full detail in `02_HISTORICAL_SPEC.md` + `03_LIVING_SCENE.md`.

**Must:**
- Restore four-tier travertine outer façade across the break  
- Keep sun from the left / dark arch interiors consistent with Now (**preserve photo lighting**)  
- Add sparse pedestrians approaching entrances (restrained life approved)  
- Optional: masts + **partial** velarium (enough to explain function — **not** a giant fully closed roof)  
- Optional: soft attic shields + generic bay statues  
- Optional: at most 1–2 modest peripheral stalls if historically defensible and visually subordinate  

**Must not:**
- Exterior gladiators, horses charging, blood, fireballs  
- Pseudo-Latin or uncertain reconstructed text  
- All-white toga crowd cliché  
- Orange fantasy grade  
- Moving / recomposing the camera  
- Fully sealed dominant velarium roof  
- Producing motion/video in this still-first pass  

---

## Suggested image-to-image instruction block

Use as edit instruction alongside the Now image:

```text
Image-to-image edit of the PROVIDED modern photograph only.
Preserve camera position, lens, façade curve, pier spacing, cornice lines,
left intact attic, and the exact silhouette hinge of the ruined outer wall.
Do not recompose the camera. Preserve the source lighting direction (sun from left).
Rebuild the missing outer ring so the Colosseum is complete in this same view:
four tiers of travertine arches, probable statues in upper bays, attic with
velarium masts and a PARTIAL soft canvas awning that explains shade/function
without becoming a giant fully closed roof (awning colour non-specific).
Replace modern plaza emptiness with a quiet ancient arrival scene: 8–15 small
figures in mixed tunics walking toward entrances; optional at most 1–2 modest
subordinate stalls only if they read as background. No gladiators, no battle,
no horses, no banners or plaques with text, no pseudo-Latin, no cinematic
color grade. Photoreal, restrained, historically sober. Portrait framing unchanged.
```

---

## Reference-only assets (style, not camera)

- `ancient-reconstruction.jpg` (landscape) — materials / statues / vendors vocabulary  
- `ancient-reconstruction.mp4` — motion / velarium ideas (**do not produce new motion yet**)  
Do **not** paste these as the output camera.

---

## Deliverable from this brief

1. Master Then still aligned to Now  
2. Compressed shipping JPEG ≤400KB  
3. **Motion loop: deferred** until Then still passes registration / historical / visual QA  

Then proceed to registration QA (`06_QA_SCORECARD.md`) before any runtime wiring.
