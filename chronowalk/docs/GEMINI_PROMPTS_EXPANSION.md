# ChronoWalk — Gemini prompts for Rome tour expansion

**15 new waypoints** (Forum cluster, Capitoline, Campo de' Fiori, **Largo Argentina**, Trajan's Market, Castel Sant'Angelo, Circus Maximus, Appian Way).  
**Excludes** stops already in production: `colosseum`, `pantheon`, `piazza-navona`.

> **Campo vs Pompey:** Theatre of Pompey / Caesar’s Curia = **`largo-argentina`**, not Campo de' Fiori. See [CAMPO_LARGO_CORRECTION.md](./CAMPO_LARGO_CORRECTION.md).

**Branch:** `cursor/chronowalk-setup-a224` · [WAYPOINT_PLAYBOOK.md](../WAYPOINT_PLAYBOOK.md) · [WAYPOINT_ASSET_PIPELINE.md](../WAYPOINT_ASSET_PIPELINE.md)

---

## Gemini workflow — read before any prompt

Gemini often **skips the ancient still** and jumps straight to video on “Prompt 3”. Prevent that with **mode labels**, **forbidden words**, and **fresh chats** — without losing the **attach-based credit-saving** technique.

### Credit-saving rule (unchanged)

You still aim for **~4 generations per waypoint**, but only **one expensive text-to-image from scratch**:

| Gen # | What | Input | Why it's cheap |
|-------|------|-------|----------------|
| 1 | Modern still | **Text only** | Only full text-to-image |
| 2 | Modern video | **Attach P1 still** | img2vid — same angle locked |
| 3 | Ancient still | **Attach P1 still** | img2img — era swap, **not** new camera |
| 4 | Ancient video | **Attach P3 still** (+ optional P2 for motion) | img2vid — same angle locked |

**Never** generate ancient from GPS/coords text alone. **Always attach the modern still** for P3. That attachment is both the **quota trick** and the **angle lock**.

Separate chats do **not** mean starting over from text — you still **upload the same JPG** into each new chat.

### Hybrid chat strategy (quota + still/video fix)

Use **2 chats per waypoint**, not 4. Same 4 generations, same attachments:

```
┌─────────────────────────────────────────────────────────────┐
│  CHAT A — "modern" (keep both modern steps here)            │
│    P1: text → modern still        → save modern-exterior.jpg │
│    P2: attach P1 → modern video   → incoming/modern-source.mp4 │
└─────────────────────────────────────────────────────────────┘
                              │
                    upload same P1 JPG
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  CHAT B — "ancient" (NEW chat — clears video bias)          │
│    P3: attach P1 → ancient STILL  → ancient-reconstruction.jpg │
│         ⚠ IMAGE MODE ONLY — if video appears, stop & retry   │
│    P4: attach P3 → ancient video  → incoming/ancient-source.mp4 │
│         (optional: also attach P2 to copy motion timing)       │
└─────────────────────────────────────────────────────────────┘
```

**Why not one chat for all 4?** After P2, Gemini biases toward video on P3.  
**Why not four chats?** Wastes context; attachments already carry the visual lock.

### Angle / format lock checklist

Before P3, confirm P1 is final — everything else hangs off it.

1. **Export P1 as 16:9** (crop in Preview/Photos if Gemini returned square).
2. **Save a master copy:** `public/waypoints/<id>/modern-exterior.jpg` — reuse for every attach.
3. **P3 message must include the attachment** — paste prompt *and* click attach/upload the P1 file. Type: `Use the attached photo as the exact camera lock. Same crop, horizon, and POV. Only change era.`
4. **Verify before P4** — open both images side by side:
   - Horizon line matches?
   - Left/right edges of monument align?
   - Same 16:9 crop?
   - If no → re-run P3 only (still 1 credit), tighten prompt: `Do not reframe. Do not zoom. Pixel-align to attachment.`
5. **P4 attaches P3** (ancient still), not P1. Optional: attach P2 MP4 so Gemini matches motion amount.

### If P3 still returns video

1. Do **not** use that file as the still.
2. Same Chat B, **new message** (or fresh Chat B): attach P1 again.
3. First line only: `STILL IMAGE ONLY. JPEG. No video. No motion.`
4. Paste P3 prompt body.
5. Select **Create image** / **Generate image** before sending (not video).

### 3-generation fallback (quota emergency)

If you must save **1 credit** per stop, skip a separate P3 file:

1. P1 still → P2 modern video (Chat A).
2. Chat B: img2vid ancient **directly from P1** with ancient prompt (P4 only, no P3).
3. Export frame at ~3 s from ancient MP4 → `ancient-reconstruction.jpg`.

Angle lock is weaker; use only if ancient video first frame looks aligned. Prefer full 4-step when possible.

### Session rules (summary)

| Step | Chat | Attach | Gemini mode | Save as |
|------|------|--------|-------------|---------|
| **1** | A | — | Create **image** | `modern-exterior.jpg` |
| **2** | A | P1 | Animate / **video** | `incoming/modern-source.mp4` |
| **3** | **B (NEW)** | **P1** | Create **image** only | `ancient-reconstruction.jpg` |
| **4** | B (same) | **P3** (+ opt. P2) | Animate / **video** | `incoming/ancient-source.mp4` |

P4 can stay in Chat B **after** a successful P3 still — ancient video bias is OK once you have the still.

### After generation

```bash
npm run process-waypoint -- <id>    # literal mapping (NOT Pantheon swap)
npm run verify-waypoint -- <id>
```

Ancient must use **modern still as reference** — never GPS text alone.

---

## Reusable blocks (auto-included in prompts below)

**CAMERA LOCK** (all steps):

```
Tripod-locked ground-level camera. 16:9 landscape. Monument fills ~60–75% of frame height.
Center-weighted; full facade or ruin mass visible. Photorealistic Mediterranean daylight.
No text, watermarks, UI, or borders.
```

**P1 — STILL header** (modern):

```
TASK: MODERN STILL — IMAGE ONLY
OUTPUT: One 16:9 photograph (JPEG/PNG). Not a video. Not a GIF. No motion blur. No animation.
```

**P2 — VIDEO header** (modern):

```
TASK: MODERN VIDEO — VIDEO ONLY
ATTACH: [upload modern still from Prompt 1]
OUTPUT: One 5-second 16:9 MP4. Use attached image as exact first frame; locked camera.
FORBIDDEN: pan, tilt, zoom, dolly, architecture warp, morphing.
Motion: only subtle clouds, pedestrians, light shimmer.
```

**P3 — STILL header** (ancient) — **paste in Chat B (NEW)** — **must attach P1 file**:

```
TASK: ANCIENT STILL — IMAGE ONLY
ATTACH: [upload modern-exterior.jpg from Prompt 1 — required for angle lock]
OUTPUT: One 16:9 photograph (JPEG/PNG). Frozen frame. Not a video. Not a GIF.
Match attached photo exactly: same POV, horizon, crop, aspect ratio — ONLY the historical era changes.
Do not reframe, zoom, or widen. Pixel-align facades to the attachment.
FORBIDDEN: any movement, video, animation, moving crowds, fluttering fabric, camera move.
```

**P4 — VIDEO header** (ancient) — **same Chat B, after P3 succeeds**:

```
TASK: ANCIENT VIDEO — VIDEO ONLY
ATTACH: [upload ancient-reconstruction.jpg from Prompt 3] required. [upload modern-source.mp4 from Prompt 2] optional for motion timing.
OUTPUT: One 5-second 16:9 MP4. First frame = attached ancient still; architecture locked.
FORBIDDEN: pan, tilt, zoom, geometry drift between frames.
Motion: subtle era-appropriate ambient only — match modern clip duration (~5 s).
```

---

## Forum Romanum cluster (8 stops)

Suggested walk order (adjust `rome-core-tour.js` when scaffolded):

`forum-arch-titus` → `forum-basilica-maxentius` → `forum-via-sacra` → `forum-temple-vesta` → `forum-rostra` → `forum-temple-saturn` → `forum-curia-julia` → `forum-arch-severus`

---

### 1. `forum-temple-saturn` — Temple of Saturn

| Field | Value |
|-------|-------|
| **Landmark** | `41.89239, 12.48498` |
| **Viewpoint** | `41.89218, 12.48472` · h `78°` · pitch `16°` |
| **Ancient target** | Temple of Saturn ~100 AD — full podium, colonnade, gilded roof |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89218,12.48472&heading=78&pitch=16 |

**Prompt 1 — Modern still**  
TASK: MODERN STILL — IMAGE ONLY. OUTPUT: One 16:9 photograph. Not video.  
Photorealistic ground-level photo of Temple of Saturn ruins in the Roman Forum today. Stand 41.89218, 12.48472, 78° heading, 16° pitch. Ionic columns and entablature fill frame; Forum paving, sparse tourists. CAMERA LOCK.

**Prompt 2 — Modern video**  
TASK: MODERN VIDEO — VIDEO ONLY. ATTACH: Prompt 1 still. OUTPUT: 5 s MP4, locked camera.  
Cinematic locked-off video of Temple of Saturn today, exact framing from attached still. Subtle cloud drift and pedestrian movement only. Architecture fixed. Hero frame ~3 s. CAMERA LOCK.

**Prompt 3 — Ancient still** *(Chat B — NEW chat, attach P1 JPG)*  
TASK: ANCIENT STILL — IMAGE ONLY. ATTACH: Prompt 1 modern still (required). OUTPUT: Frozen 16:9 photograph. Not video. Match attachment exactly — same crop and POV, only era changes. Do not reframe or zoom.  
Ancient Rome reconstruction of Temple of Saturn, exact same camera as attached modern photo. Era ~100 AD: complete temple on podium, gilded roof, intact colonnade. No tourists or modern ruins. FORBIDDEN: video, animation, moving elements. CAMERA LOCK.

**Prompt 4 — Ancient video** *(Chat B — attach P3 still)*  
TASK: ANCIENT VIDEO — VIDEO ONLY. ATTACH: Prompt 3 ancient still (+ optional Prompt 2 modern video). OUTPUT: 5 s MP4.  
Ancient Temple of Saturn video, first frame = attached still, locked tripod. Subtle banners, static priest silhouettes, dust motes — structure fixed. ~5 s. CAMERA LOCK.

---

### 2. `forum-curia-julia` — Curia Julia

| Field | Value |
|-------|-------|
| **Landmark** | `41.89223, 12.48528` |
| **Viewpoint** | `41.89205, 12.48505` · h `55°` · pitch `18°` |
| **Ancient target** | Senate house ~200 AD — marble facade, bronze doors |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89205,12.48505&heading=55&pitch=18 |

**Prompt 1 — Modern still**  
TASK: MODERN STILL — IMAGE ONLY. OUTPUT: One 16:9 photograph. Not video.  
Curia Julia brick facade in Roman Forum today. Stand 41.89205, 12.48505, 55°, 18°. Rectangular senate building fills frame; bronze door replica, Forum paving. CAMERA LOCK.

**Prompt 2 — Modern video**  
TASK: MODERN VIDEO — VIDEO ONLY. ATTACH: Prompt 1 still. OUTPUT: 5 s MP4.  
Locked 5 s video of Curia Julia, attached still as first frame. Subtle sky and pedestrians only. CAMERA LOCK.

**Prompt 3 — Ancient still** *(Chat B — NEW chat, attach P1 JPG)*  
TASK: ANCIENT STILL — IMAGE ONLY. ATTACH: Prompt 1 still. OUTPUT: Frozen photograph only. Not video.  
Curia Julia ~200 AD: marble-faced facade, bronze doors, steps, intact roofline. Same POV as attachment. No modern brick or tourists. FORBIDDEN: motion, video. CAMERA LOCK.

**Prompt 4 — Ancient video** *(Chat B — attach P3 still)*  
TASK: ANCIENT VIDEO — VIDEO ONLY. ATTACH: Prompt 3 still. OUTPUT: 5 s MP4.  
Ancient Curia, locked camera, motion-matched to modern clip. Distant senator silhouettes, faint torch glow through doors. CAMERA LOCK.

---

### 3. `forum-arch-severus` — Arch of Septimius Severus

| Field | Value |
|-------|-------|
| **Landmark** | `41.89301, 12.48442` |
| **Viewpoint** | `41.89275, 12.48455` · h `340°` · pitch `17°` |
| **Ancient target** | Triumphal arch ~203 AD — reliefs, gilded attic statuary |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89275,12.48455&heading=340&pitch=17 |

**Prompt 1 — Modern still**  
TASK: MODERN STILL — IMAGE ONLY. OUTPUT: One photograph. Not video.  
Arch of Septimius Severus in Forum today. Stand 41.89275, 12.48455, 340°, 17°. Triple archways and weathered marble fill frame. CAMERA LOCK.

**Prompt 2 — Modern video**  
TASK: MODERN VIDEO — VIDEO ONLY. ATTACH: Prompt 1 still. OUTPUT: 5 s MP4.  
Locked video of arch, attached framing. Cloud drift, light pedestrian motion. CAMERA LOCK.

**Prompt 3 — Ancient still** *(Chat B — NEW chat, attach P1 JPG)*  
TASK: ANCIENT STILL — IMAGE ONLY. ATTACH: Prompt 1 still. OUTPUT: Frozen photograph. Not video.  
Arch ~203 AD: crisp marble reliefs, gilded bronze on attic, no erosion. Same POV as attachment. FORBIDDEN: video, motion. CAMERA LOCK.

**Prompt 4 — Ancient video** *(Chat B — attach P3 still)*  
TASK: ANCIENT VIDEO — VIDEO ONLY. ATTACH: Prompt 3 still. OUTPUT: 5 s MP4.  
Ancient arch video, locked tripod, subtle parade banners and dust, sun glint on gilding. CAMERA LOCK.

---

### 4. `forum-via-sacra` — Via Sacra

| Field | Value |
|-------|-------|
| **Landmark** | `41.89255, 12.48535` |
| **Viewpoint** | `41.89240, 12.48510` · h `45°` · pitch `12°` |
| **Ancient target** | Sacred Way ~120 AD — colonnades, temples along route |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89240,12.48510&heading=45&pitch=12 |

**Prompt 1 — Modern still**  
TASK: MODERN STILL — IMAGE ONLY. OUTPUT: One photograph. Not video.  
Via Sacra in Roman Forum today. Stand 41.89240, 12.48510, 45°, 12°. Cobblestone way receding with ruins and columns on both sides. CAMERA LOCK.

**Prompt 2 — Modern video**  
TASK: MODERN VIDEO — VIDEO ONLY. ATTACH: Prompt 1 still. OUTPUT: 5 s MP4.  
Locked video along Via Sacra, attached framing. Gentle pedestrian movement only. CAMERA LOCK.

**Prompt 3 — Ancient still** *(Chat B — NEW chat, attach P1 JPG)*  
TASK: ANCIENT STILL — IMAGE ONLY. ATTACH: Prompt 1 still. OUTPUT: Frozen photograph. Not video.  
Via Sacra ~120 AD: intact paving, colonnades, temples — same POV as attachment. FORBIDDEN: video, motion. CAMERA LOCK.

**Prompt 4 — Ancient video** *(Chat B — attach P3 still)*  
TASK: ANCIENT VIDEO — VIDEO ONLY. ATTACH: Prompt 3 still. OUTPUT: 5 s MP4.  
Ancient processional street, locked camera, distant static crowd silhouettes, light dust in sunbeams. CAMERA LOCK.

---

### 5. `forum-rostra` — Rostra

| Field | Value |
|-------|-------|
| **Landmark** | `41.89282, 12.48518` |
| **Viewpoint** | `41.89265, 12.48495` · h `30°` · pitch `15°` |
| **Ancient target** | Rostra with ship-prow decorations ~50 BC–100 AD |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89265,12.48495&heading=30&pitch=15 |

**Prompt 1 — Modern still**  
TASK: MODERN STILL — IMAGE ONLY. OUTPUT: One photograph. Not video.  
Rostra platform remains in Forum today. Stand 41.89265, 12.48495, 30°, 15°. Low marble platform and columns fill frame. CAMERA LOCK.

**Prompt 2 — Modern video**  
TASK: MODERN VIDEO — VIDEO ONLY. ATTACH: Prompt 1 still. OUTPUT: 5 s MP4.  
Locked video of Rostra ruins, attached framing. Subtle ambient motion only. CAMERA LOCK.

**Prompt 3 — Ancient still** *(Chat B — NEW chat, attach P1 JPG)*  
TASK: ANCIENT STILL — IMAGE ONLY. ATTACH: Prompt 1 still. OUTPUT: Frozen photograph. Not video.  
Ancient Rostra with bronze ship rams on platform, orators' steps intact, Forum open behind — same POV. FORBIDDEN: video, motion. CAMERA LOCK.

**Prompt 4 — Ancient video** *(Chat B — attach P3 still)*  
TASK: ANCIENT VIDEO — VIDEO ONLY. ATTACH: Prompt 3 still. OUTPUT: 5 s MP4.  
Ancient Rostra, locked camera, subtle flag flutter, static crowd silhouettes. CAMERA LOCK.

---

### 6. `forum-basilica-maxentius` — Basilica of Maxentius

| Field | Value |
|-------|-------|
| **Landmark** | `41.89195, 12.48825` |
| **Viewpoint** | `41.89175, 12.48800` · h `65°` · pitch `20°` |
| **Ancient target** | Complete basilica ~312 AD — coffered vaults |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89175,12.48800&heading=65&pitch=20 |

**Prompt 1 — Modern still**  
TASK: MODERN STILL — IMAGE ONLY. OUTPUT: One photograph. Not video.  
Basilica of Maxentius vault ruins today. Stand 41.89175, 12.48800, 65°, 20°. Brick arch and coffered ceiling dominate frame. CAMERA LOCK.

**Prompt 2 — Modern video**  
TASK: MODERN VIDEO — VIDEO ONLY. ATTACH: Prompt 1 still. OUTPUT: 5 s MP4.  
Locked video of basilica ruins, attached framing. Subtle sky through vault. CAMERA LOCK.

**Prompt 3 — Ancient still** *(Chat B — NEW chat, attach P1 JPG)*  
TASK: ANCIENT STILL — IMAGE ONLY. ATTACH: Prompt 1 still. OUTPUT: Frozen photograph. Not video.  
Basilica fully roofed ~312 AD: nave vaults, marble floor, clerestory light — same POV. FORBIDDEN: video, motion. CAMERA LOCK.

**Prompt 4 — Ancient video** *(Chat B — attach P3 still)*  
TASK: ANCIENT VIDEO — VIDEO ONLY. ATTACH: Prompt 3 still. OUTPUT: 5 s MP4.  
Ancient nave interior, locked camera, dust in light shafts, distant static figures. CAMERA LOCK.

---

### 7. `forum-arch-titus` — Arch of Titus

| Field | Value |
|-------|-------|
| **Landmark** | `41.89068, 12.48858` |
| **Viewpoint** | `41.89050, 12.48835` · h `25°` · pitch `18°` |
| **Ancient target** | Arch of Titus ~81 AD — reliefs, gilded quadriga on attic |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89050,12.48835&heading=25&pitch=18 |

**Prompt 1 — Modern still**  
TASK: MODERN STILL — IMAGE ONLY. OUTPUT: One photograph. Not video.  
Arch of Titus on Via Sacra today. Stand 41.89050, 12.48835, 25°, 18°. Single arch fills frame against sky. CAMERA LOCK.

**Prompt 2 — Modern video**  
TASK: MODERN VIDEO — VIDEO ONLY. ATTACH: Prompt 1 still. OUTPUT: 5 s MP4.  
Locked video, attached framing. Subtle pedestrian and cloud motion. CAMERA LOCK.

**Prompt 3 — Ancient still** *(Chat B — NEW chat, attach P1 JPG)*  
TASK: ANCIENT STILL — IMAGE ONLY. ATTACH: Prompt 1 still. OUTPUT: Frozen photograph. Not video.  
Arch ~81 AD: crisp triumph reliefs, gilded quadriga on attic — same POV. FORBIDDEN: video, motion. CAMERA LOCK.

**Prompt 4 — Ancient video** *(Chat B — attach P3 still)*  
TASK: ANCIENT VIDEO — VIDEO ONLY. ATTACH: Prompt 3 still. OUTPUT: 5 s MP4.  
Ancient arch, locked tripod, sun glint on gilding, light dust. CAMERA LOCK.

---

### 8. `forum-temple-vesta` — Temple of Vesta

| Field | Value |
|-------|-------|
| **Landmark** | `41.89178, 12.48725` |
| **Viewpoint** | `41.89160, 12.48705` · h `50°` · pitch `16°` |
| **Ancient target** | Circular temple with sacred fire ~100 AD |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89160,12.48705&heading=50&pitch=16 |

**Prompt 1 — Modern still**  
TASK: MODERN STILL — IMAGE ONLY. OUTPUT: One photograph. Not video.  
Temple of Vesta circular ruin in Forum today. Stand 41.89160, 12.48705, 50°, 16°. Curved podium and columns fill frame. CAMERA LOCK.

**Prompt 2 — Modern video**  
TASK: MODERN VIDEO — VIDEO ONLY. ATTACH: Prompt 1 still. OUTPUT: 5 s MP4.  
Locked video of Vesta ruins, attached framing. CAMERA LOCK.

**Prompt 3 — Ancient still** *(Chat B — NEW chat, attach P1 JPG)*  
TASK: ANCIENT STILL — IMAGE ONLY. ATTACH: Prompt 1 still. OUTPUT: Frozen photograph. Not video.  
Circular Temple of Vesta with conical roof and visible sacred flame — same POV, Vestal precinct intact. FORBIDDEN: video, motion, flickering flame animation. CAMERA LOCK.

**Prompt 4 — Ancient video** *(Chat B — attach P3 still)*  
TASK: ANCIENT VIDEO — VIDEO ONLY. ATTACH: Prompt 3 still. OUTPUT: 5 s MP4.  
Ancient Vesta temple, locked camera, subtle flame flicker only, veiled priestess silhouettes static. CAMERA LOCK.

---

## Standalone stops (7)

---

### 9. `capitoline-hill` — Capitoline Hill

| Field | Value |
|-------|-------|
| **Landmark** | `41.89324, 12.48275` |
| **Viewpoint** | `41.89305, 12.48250` · h `120°` · pitch `14°` |
| **Ancient target** | Capitoline temples + Forum vista ~100 AD |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89305,12.48250&heading=120&pitch=14 |

**Prompt 1 — Modern still**  
TASK: MODERN STILL — IMAGE ONLY. OUTPUT: One photograph. Not video.  
View from Capitoline Hill over Roman Forum today. Stand 41.89305, 12.48250, 120°, 14°. Forum ruins, distant Colosseum, Michelangelo parapet in foreground. CAMERA LOCK.

**Prompt 2 — Modern video**  
TASK: MODERN VIDEO — VIDEO ONLY. ATTACH: Prompt 1 still. OUTPUT: 5 s MP4.  
Locked vista video, attached framing. Cloud drift over Forum. CAMERA LOCK.

**Prompt 3 — Ancient still** *(Chat B — NEW chat, attach P1 JPG)*  
TASK: ANCIENT STILL — IMAGE ONLY. ATTACH: Prompt 1 still. OUTPUT: Frozen photograph. Not video.  
Capitoline vista ~100 AD: intact temples on hill, gleaming Forum below — same POV, no modern buildings. FORBIDDEN: video, motion. CAMERA LOCK.

**Prompt 4 — Ancient video** *(Chat B — attach P3 still)*  
TASK: ANCIENT VIDEO — VIDEO ONLY. ATTACH: Prompt 3 still. OUTPUT: 5 s MP4.  
Ancient overlook, locked camera, subtle smoke from sacrifices, static banners. CAMERA LOCK.

---

### 10. `campo-de-fiori` — Campo de' Fiori

| Field | Value |
|-------|-------|
| **Landmark** | `41.89559, 12.47223` |
| **Viewpoint** | `41.89535, 12.47215` · h `5°` · pitch `16°` |
| **Ancient target** | **Medieval open campo ~1400–1500 AD** — market field, no Bruno statue. **Not** Theatre of Pompey (see `largo-argentina`). |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89535,12.47215&heading=5&pitch=16 |

**Prompt 1 — Modern still**  
TASK: MODERN STILL — IMAGE ONLY. OUTPUT: One photograph. Not video.  
Campo de' Fiori today with market stalls and cobblestones. Stand 41.89535, 12.47215, 5°, 16°. Bruno statue and cafe awnings visible. CAMERA LOCK.

**Prompt 2 — Modern video**  
TASK: MODERN VIDEO — VIDEO ONLY. ATTACH: Prompt 1 still. OUTPUT: 5 s MP4.  
Locked video of Campo market, attached framing. Awning flutter, pedestrian motion. CAMERA LOCK.

**Prompt 3 — Ancient still** *(Chat B — NEW chat, attach P1 JPG)*  
TASK: ANCIENT STILL — IMAGE ONLY. ATTACH: Prompt 1 still. OUTPUT: Frozen photograph. Not video.  
Late medieval open campo ~1400s: dusty field, wooden market stalls, low brick edges — **no Roman theatre**, no Bruno statue, no baroque palaces. Same camera as attachment. FORBIDDEN: video, motion. CAMERA LOCK.

**Prompt 4 — Ancient video** *(Chat B — attach P3 still)*  
TASK: ANCIENT VIDEO — VIDEO ONLY. ATTACH: Prompt 3 still. OUTPUT: 5 s MP4.  
Medieval market scene, locked camera, subtle cart and awning motion, smoke from braziers — same square layout. CAMERA LOCK.

---

### 11. `largo-argentina` — Largo di Torre Argentina (Theatre of Pompey)

| Field | Value |
|-------|-------|
| **Landmark** | `41.89528, 12.47694` |
| **Viewpoint** | `41.89555, 12.47665` · h `250°` · pitch `14°` |
| **Ancient target** | **Theatre of Pompey ~55 BC** — cavea, portico, Curia (Caesar assassinated 44 BC) |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89555,12.47665&heading=250&pitch=14 |

**Prompt 1 — Modern still**  
TASK: MODERN STILL — IMAGE ONLY. OUTPUT: One photograph. Not video.  
Largo di Torre Argentina today — sunken Area Sacra temples, cats on ruins, street at grade. Stand 41.89555, 12.47665, 250°, 14°. Excavation fills frame below sidewalk. CAMERA LOCK.

**Prompt 2 — Modern video**  
TASK: MODERN VIDEO — VIDEO ONLY. ATTACH: Prompt 1 still. OUTPUT: 5 s MP4.  
Locked video of Argentina ruins, attached framing. Subtle cat movement, cloud drift. CAMERA LOCK.

**Prompt 3 — Ancient still** *(Chat B — NEW chat, attach P1 JPG)*  
TASK: ANCIENT STILL — IMAGE ONLY. ATTACH: Prompt 1 still. OUTPUT: Frozen photograph. Not video.  
Theatre of Pompey ~55 BC: marble cavea tiers, portico columns, Curia — same POV as attachment, Republican Rome. No modern street level. FORBIDDEN: video, motion, animated crowds. CAMERA LOCK.

**Prompt 4 — Ancient video** *(Chat B — attach P3 still)*  
TASK: ANCIENT VIDEO — VIDEO ONLY. ATTACH: Prompt 3 still. OUTPUT: 5 s MP4.  
Ancient Pompey theatre complex, locked camera, subtle toga crowd silhouettes, theatre banners — structure fixed. CAMERA LOCK.

---

### 12. `trajan-market` — Trajan's Market

| Field | Value |
|-------|-------|
| **Landmark** | `41.89562, 12.48578` |
| **Viewpoint** | `41.89545, 12.48555` · h `200°` · pitch `18°` |
| **Ancient target** | Market complex ~110 AD — brick arcades, open shops |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89545,12.48555&heading=200&pitch=18 |

**Prompt 1 — Modern still**  
TASK: MODERN STILL — IMAGE ONLY. OUTPUT: One photograph. Not video.  
Trajan's Market brick arcades today. Stand 41.89545, 12.48555, 200°, 18°. Multi-level curved facade fills frame. CAMERA LOCK.

**Prompt 2 — Modern video**  
TASK: MODERN VIDEO — VIDEO ONLY. ATTACH: Prompt 1 still. OUTPUT: 5 s MP4.  
Locked video of market ruins, attached framing. Subtle ambient motion. CAMERA LOCK.

**Prompt 3 — Ancient still** *(Chat B — NEW chat, attach P1 JPG)*  
TASK: ANCIENT STILL — IMAGE ONLY. ATTACH: Prompt 1 still. OUTPUT: Frozen photograph. Not video.  
Trajan's Market ~110 AD: intact arcades, shop fronts, awnings — same POV. FORBIDDEN: video, motion. CAMERA LOCK.

**Prompt 4 — Ancient video** *(Chat B — attach P3 still)*  
TASK: ANCIENT VIDEO — VIDEO ONLY. ATTACH: Prompt 3 still. OUTPUT: 5 s MP4.  
Ancient market, locked camera, subtle awnings and merchant movement. CAMERA LOCK.

---

### 13. `castel-sant-angelo` — Castel Sant'Angelo

| Field | Value |
|-------|-------|
| **Landmark** | `41.90306, 12.46627` |
| **Viewpoint** | `41.90255, 12.46610` · h `15°` · pitch `18°` |
| **Ancient target** | Hadrian's Mausoleum ~138 AD — marble drum, bronze quadriga |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.90255,12.46610&heading=15&pitch=18 |

**Prompt 1 — Modern still**  
TASK: MODERN STILL — IMAGE ONLY. OUTPUT: One photograph. Not video.  
Castel Sant'Angelo from Ponte Sant'Angelo today. Stand 41.90255, 12.46610, 15°, 18°. Round castle and bridge statues fill frame. CAMERA LOCK.

**Prompt 2 — Modern video**  
TASK: MODERN VIDEO — VIDEO ONLY. ATTACH: Prompt 1 still. OUTPUT: 5 s MP4.  
Locked video from bridge, attached framing. River shimmer, cloud drift. CAMERA LOCK.

**Prompt 3 — Ancient still** *(Chat B — NEW chat, attach P1 JPG)*  
TASK: ANCIENT STILL — IMAGE ONLY. ATTACH: Prompt 1 still. OUTPUT: Frozen photograph. Not video.  
Hadrian's Mausoleum ~138 AD: smooth marble drum, bronze quadriga on summit — no medieval battlements. Same POV. FORBIDDEN: video, motion. CAMERA LOCK.

**Prompt 4 — Ancient video** *(Chat B — attach P3 still)*  
TASK: ANCIENT VIDEO — VIDEO ONLY. ATTACH: Prompt 3 still. OUTPUT: 5 s MP4.  
Ancient mausoleum, locked camera, bronze glint, Tiber reflections. CAMERA LOCK.

---

### 14. `circus-maximus` — Circus Maximus

| Field | Value |
|-------|-------|
| **Landmark** | `41.88594, 12.48570` |
| **Viewpoint** | `41.88570, 12.48545` · h `85°` · pitch `12°` |
| **Ancient target** | Chariot circus ~100 AD — spina, seating tiers full |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.88570,12.48545&heading=85&pitch=12 |

**Prompt 1 — Modern still**  
TASK: MODERN STILL — IMAGE ONLY. OUTPUT: One photograph. Not video.  
Circus Maximus grassy bowl today. Stand 41.88570, 12.48545, 85°, 12°. Long oval and Palatine backdrop fill frame. CAMERA LOCK.

**Prompt 2 — Modern video**  
TASK: MODERN VIDEO — VIDEO ONLY. ATTACH: Prompt 1 still. OUTPUT: 5 s MP4.  
Locked video of circus bowl, attached framing. Grass ripple, haze. CAMERA LOCK.

**Prompt 3 — Ancient still** *(Chat B — NEW chat, attach P1 JPG)*  
TASK: ANCIENT STILL — IMAGE ONLY. ATTACH: Prompt 1 still. OUTPUT: Frozen photograph. Not video.  
Circus Maximus ~100 AD: packed seating tiers, spina with obelisk, starting gates — no modern grass field. Same POV. FORBIDDEN: video, motion, chariots. CAMERA LOCK.

**Prompt 4 — Ancient video** *(Chat B — attach P3 still)*  
TASK: ANCIENT VIDEO — VIDEO ONLY. ATTACH: Prompt 3 still. OUTPUT: 5 s MP4.  
Ancient circus, locked camera, distant chariot blur, banner flutter. CAMERA LOCK.

---

### 15. `appian-way` — Appian Way

| Field | Value |
|-------|-------|
| **Landmark** | `41.85670, 12.51205` |
| **Viewpoint** | `41.85655, 12.51185` · h `250°` · pitch `10°` |
| **Ancient target** | Via Appia Antica ~100 AD — basalt paving, tombs, cypress |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.85655,12.51185&heading=250&pitch=10 |

**Prompt 1 — Modern still**  
TASK: MODERN STILL — IMAGE ONLY. OUTPUT: One photograph. Not video.  
Appian Way basalt road today with cypress and tombs. Stand 41.85655, 12.51185, 250°, 10°. Road receding into countryside. CAMERA LOCK.

**Prompt 2 — Modern video**  
TASK: MODERN VIDEO — VIDEO ONLY. ATTACH: Prompt 1 still. OUTPUT: 5 s MP4.  
Locked video along Appian Way, attached framing. Leaf flutter, daylight. CAMERA LOCK.

**Prompt 3 — Ancient still** *(Chat B — NEW chat, attach P1 JPG)*  
TASK: ANCIENT STILL — IMAGE ONLY. ATTACH: Prompt 1 still. OUTPUT: Frozen photograph. Not video.  
Via Appia ~100 AD: perfect basalt blocks, lined tombs and milestones — same POV, no modern asphalt. FORBIDDEN: video, motion, wagons. CAMERA LOCK.

**Prompt 4 — Ancient video** *(Chat B — attach P3 still)*  
TASK: ANCIENT VIDEO — VIDEO ONLY. ATTACH: Prompt 3 still. OUTPUT: 5 s MP4.  
Ancient Appian Way, locked camera, distant wagon dust, cypress sway. CAMERA LOCK.

---

## Per-waypoint checklist (print)

```
CHAT A (modern):
[ ] P1 modern still     → modern-exterior.jpg          (text only, image mode)
[ ] P2 modern video     → incoming/modern-source.mp4   (attach P1, video mode)

CHAT B (ancient — NEW chat, upload same P1 JPG):
[ ] P3 ancient still    → ancient-reconstruction.jpg   (attach P1, IMAGE mode only)
[ ] Side-by-side check: P1 vs P3 horizon + crop align?
[ ] P4 ancient video    → incoming/ancient-source.mp4  (attach P3, optional P2)

[ ] npm run process-waypoint -- <id>
[ ] npm run verify-waypoint -- <id>
```

---

## Engineering checklist

1. Scaffold `src/data/<id>.js`
2. Register in `waypointMerge.js`, `waypointGeo.js`, `rome-core-tour.js`
3. `public/waypoints/<id>/incoming/` → process + verify
4. Test: `?singleWaypoint=<id>&debugGeo=true`

---

## Quick index

| `id` | Title |
|------|-------|
| `forum-temple-saturn` | Temple of Saturn |
| `forum-curia-julia` | Curia Julia |
| `forum-arch-severus` | Arch of Septimius Severus |
| `forum-via-sacra` | Via Sacra |
| `forum-rostra` | The Rostra |
| `forum-basilica-maxentius` | Basilica of Maxentius |
| `forum-arch-titus` | Arch of Titus |
| `forum-temple-vesta` | Temple of Vesta |
| `capitoline-hill` | Capitoline Hill |
| `campo-de-fiori` | Campo de' Fiori |
| `largo-argentina` | Largo di Torre Argentina (Theatre of Pompey) |
| `trajan-market` | Trajan's Market |
| `castel-sant-angelo` | Castel Sant'Angelo |
| `circus-maximus` | Circus Maximus |
| `appian-way` | Appian Way |
