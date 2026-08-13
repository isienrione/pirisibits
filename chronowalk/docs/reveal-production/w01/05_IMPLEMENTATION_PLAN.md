# w01 — 05 Implementation Plan

**Scope:** How final assets plug into **existing** Threshold — no redesign unless blocked  
**Pre-prod rule:** Do not wire or award `revealTier` until QA scorecard passes

---

## 1. Runtime path (unchanged architecture)

```
JourneyShell → buildImmersivePlayerProps → C6ImmersivePlayer → C7Threshold → Threshold.jsx
```

Resolution: `resolveWaypointReconstruction` / `thenPhotoForWaypoint` / `thenLoopForWaypoint`  
(`src/redesign/lib/waypointPresentation.js`)

Today w01: `then === now` + loop `ancient-reconstruction.mp4`.

---

## 2. Still-first interaction (recommended)

**Keep existing Threshold hold/release.**

| Gesture | Behavior |
|---------|----------|
| Finger down / hold | Animate reveal toward Then (existing clip-path timing: hold ~2400ms, commit ~2000ms) |
| Release | Return to Now (~900ms) |

**Magic = registration + content**, not new VFX.

### Transition choice

| Option | Recommendation |
|--------|----------------|
| Hard cut | Too abrupt; skip |
| Existing clip-path wipe | **Keep** — already product language |
| Extra crossfade / parallax / mask mesh | **Do not add** for v1 |

Immediacy: ensure Then still is decoded before hold (preload then image).  
**Motion hydrate:** not applicable until founder-authorized after Then still QA.

### Conceptual test

- Finger down → ancient living venue appears **in the same place**  
- Finger up → present plaza returns and **re-proves** alignment  

---

## 3. Wiring steps (future implementation PR)

1. Drop `ancient-living-postcard.jpg` into `public/waypoints/colosseum/exterior/`.  
2. Set manifest `reconstruction.then` → new still (keep `now` = `modern-poster.jpg`).  
3. Update `caption` if honesty text expands; add ES mapping in `applyLocaleOverlay` / `ES_RECONSTRUCTION_CAPTIONS`.  
4. **Do not** add a new `loop` until Then still QA PASS + motion authorization.  
5. Bump any media cache version if Colosseum waypoint module uses one.  
6. Offline: collectors already pick `now`/`then`/`loop` from manifest — verify then still is included.  
7. **Do not** set `MAP_PLACE_OVERRIDES.w01.revealTier` until scorecard PASS.  
8. Hotspots: remap `reconstructionHotspots` scene key `colosseum` → also accept `w01` (alias), rewrite exterior-relevant copy (see hotspot section below).

No Path A/B, commerce, journey shape, or Near Me changes.

---

## 4. Optional motion architecture (deferred)

**Founder seal:** Do **not** produce optional motion until the final Then still passes registration / historical / visual QA.

**When later authorized — recommended:** **B — Then still primary → optional loop after hold settles / on latch**

| Phase | Media |
|-------|-------|
| Idle Now | `modern-poster.jpg` |
| Hold reveal | **Then still** visible immediately |
| After commit / while held | Optionally play muted loop if hydrated |
| Release | Now still |

Avoid autoplay large video on stop entry. Existing `Threshold.jsx` loop+poster path remains compatible.

---

## 5. Hotspots vs Threshold

Threshold **does not** render hotspots today. Hotspots live on `ReconstructionPage` / explorer keyed by stop id `colosseum`.

For Living Postcard:

| Action | Detail |
|--------|--------|
| **Remap** | `SCENES_BY_STOP['w01'] = COLOSSEUM_SCENE` (keep `colosseum` alias) |
| **Rewrite** | Exterior-visible notices only |
| **Remove / defer** | `cavea`, `arena`, `pulvinar`, `hypogeum` — interior; belong with `w02` |
| **Keep / rework** | `velarium`; add exterior: outer ring / statues / attic shields / entrance |

Do **not** invent a second registry.

---

## 6. EN / ES

- Media paths shared.  
- Caption string EN + ES overlay.  
- Hotspot message keys if rewritten.  
- No Spanish architecture changes.

---

## 7. Performance checklist at integrate time

- [ ] Then still ≤400KB  
- [ ] Loop ≤2.5MB if present  
- [ ] Video not mass-hydrated offline  
- [ ] Hold works with video disabled (still-only)  
- [ ] Real iPhone outdoor glare check  

---

## 8. Out of scope

Threshold redesign, AR/VPS, discoveries, Q&A, recommendations, other reveals’ mass edits.
