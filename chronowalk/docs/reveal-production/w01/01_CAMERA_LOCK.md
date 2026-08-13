# w01 — 01 Camera Lock

**Place:** `w01` Colosseum exterior  
**Status:** PRE-PRODUCTION · **FOUNDER-SEALED camera lock**  
**Hierarchy:** NOW IS THE CAMERA TRUTH (Living Postcard strategy §3)  
**See:** `00_FOUNDER_DECISIONS.md`

---

## 1. Canonical Now asset (selected)

| Field | Value |
|-------|--------|
| **Canonical path** | `/waypoints/colosseum/exterior/modern-poster.jpg` |
| **On-disk twin** | `modern-exterior.jpg` (byte-identical MD5) |
| **Dimensions** | **941 × 1672** (portrait ≈ 9:16) |
| **Format** | JPEG |
| **Size** | ~339 KB |
| **Provenance** | Manifest `now_image.source: "commissioned"` · credit “ChronoWalk production photography” · installer source key `PHOTOGRAPHY/NOW-files/colosseum-exterior-NOW.png` (`scripts/now-files-manifest.json`) |
| **Manifest wiring** | `reconstruction.now` **and** `reconstruction.then` (today then=now) · `photo` |

### Verdict: **ACCEPT as permanent camera lock (this iteration) — FOUNDER SEALED**

Founder decision: `modern-poster.jpg` is the permanent w01 camera lock for this iteration.  
**Then must preserve this exact camera and composition. No camera recomposition.**

Reasons (pre-seal, still valid):
- Already portrait / mobile-native (matches immersive Threshold canvas).
- Iconic traveler plaza viewpoint with clear façade geometry.
- Empty plaza = clean plate for restrained life compositing.
- High-contrast pier/cornice edges for registration.
- **The jagged outer-wall break** (intact left attic → missing outer ring right) is an excellent perceptual transform lock.

### New photograph required?

**No for this iteration.** Then must be produced **image-to-image from this exact frame**.

A future iteration may re-lock only with an explicit new founder decision; Then would then be remade to that new Now — never reverse.

---

## 2. Approximate camera / place

| Attribute | Spec |
|-----------|------|
| **Geofence** | 41.8902, 12.4922 · r ≈ 45 m |
| **Standing context** | Public plaza west/southwest of the Colosseum (iconic outer-ring curve) |
| **Height** | Eye-level (~1.5–1.8 m), slight upward tilt |
| **Viewing direction** | Toward the curved exterior; shows surviving high outer wall (viewer’s left) and broken outer ring exposing inner galleries (viewer’s right) |
| **Horizon** | Low — plaza occupies ~lower third; façade dominates mid/upper frame |
| **Distance** | Far enough to read full height (4 tiers on intact side) + significant arc of circumference |

Exact surveying coordinates of the photographer are **not** in-repo; geofence + this frame define product camera truth.

---

## 3. Framing vs Threshold runtime

| Mode | Behavior | Implication for assets |
|------|----------|------------------------|
| Immersive journey (`C6`/`C7`) | `object-fit: cover` · `object-position: center 28%` | Design **safe zone**: keep critical façade mid-frame; top/bottom may crop |
| Non-immersive / contain | 9:16 box · `object-fit: contain` | Full frame visible |
| Hold interaction | Clip-path / seam reveal over **same box** | Now and Then must share identical pixel geometry |

**Deliver Then at the same 941×1672 (or 1080×1920 scaled) canvas with pixel-aligned façade.**

---

## 4. Registration anchors (must stay locked)

Numbered for production QA overlays:

| ID | Anchor | Notes |
|----|--------|--------|
| A1 | **Ground-floor pier rhythm** | Vertical travertine piers / arch openings along base |
| A2 | **Cornice / entablature lines** | Horizontal bands between tiers 1–2, 2–3, 3–attic |
| A3 | **Intact outer-wall left attic** | Solid attic + small windows + corbels (velarium mast sockets) on surviving high section |
| A4 | **Jagged break silhouette** | Diagonal descending ruin edge where outer wall fails — **primary transform hinge** |
| A5 | **Exposed inner-gallery arches (right)** | Darker brick/stone skeletal arches currently visible through missing outer ring |
| A6 | **Façade base / plaza junction** | Where building meets cobblestones |
| A7 | **Plaza ground plane** | Perspective recession; metal railing bottom-right (may be removed or ignored in Then) |
| A8 | **Sky dome** | Clear blue field above attic — Then must not shift building silhouette into sky incorrectly |

### Transform expectation (same camera)

- **A3–A5:** Intact four-tier outer ring continues across the break; statues/shields appear in bays; attic continuous.  
- **A1–A2:** Same pier/cornice registration — stone “completes” rather than sliding.  
- **A6–A7:** Ancient paving / people composite on same ground plane.  
- **Do not** rotate, re-lens, or drone-elevate away from this camera.

---

## 5. What existing “ancient” assets are relative to this lock

| Asset | Dims | Relation to camera lock |
|-------|------|-------------------------|
| `ancient-reconstruction.jpg` | 1280×720 landscape | **Different framing** — generic intact façade; **not** aligned to jagged-break Now. Reference for materials/statues/life only. |
| `ancient-reconstruction.mp4` (first frame) | 720×1280 portrait | Closer aspect; still **not** registered to this Now’s break silhouette. Reference / motion study only. |
| `ancient-poster.jpg` | 832×468 | Thumbnail-class reference only. |

**Conclusion:** Existing reconstructions **cannot** be wired as final Then without viewpoint-preserving rework against `modern-poster.jpg`.

---

## 6. Prototype policy

Any technical composite produced before final historical QA must be labeled:

`PROTOTYPE — NOT FINAL HISTORICAL RECONSTRUCTION`

Store under `docs/reveal-production/w01/prototypes/` (gitignored or clearly named) — do not ship as `reconstruction.then`.

---

## 7. Camera-lock sign-off checklist

- [x] Founder accepts `modern-poster.jpg` as SoT Now (**sealed this iteration**)  
- [x] Then must preserve exact camera/composition — no recomposition (**sealed**)  
- [ ] Production artists receive this frame + anchor overlay  
- [ ] Then deliverable matches pixel canvas / façade lock  
- [ ] Immersive `cover` + `center 28%` crop reviewed on real phone  
