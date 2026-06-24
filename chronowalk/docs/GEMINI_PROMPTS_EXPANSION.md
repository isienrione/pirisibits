# ChronoWalk — Gemini prompts for Rome tour expansion

**15 new waypoints** (Forum cluster, Capitoline, Campo de' Fiori, **Largo Argentina**, Trajan's Market, Castel Sant'Angelo, Circus Maximus, Appian Way).  
**Excludes** stops already in production: `colosseum`, `pantheon`, `piazza-navona`.

> **Correction (June 2026):** An earlier draft wrongly put the **Theatre of Pompey** ancient layer on `campo-de-fiori`. The theatre cavea, Curia (Caesar’s assassination), and Area Sacra ruins are at **Largo di Torre Argentina** — use waypoint `largo-argentina`. Campo de' Fiori gets its own honest ancient layer (open campo / market field). See [CAMPO_LARGO_CORRECTION.md](./CAMPO_LARGO_CORRECTION.md) if you already spent Gemini credits on the old prompts.

**Branch:** `cursor/chronowalk-setup-a224` · See also [WAYPOINT_PLAYBOOK.md](../WAYPOINT_PLAYBOOK.md) · [WAYPOINT_ASSET_PIPELINE.md](../WAYPOINT_ASSET_PIPELINE.md)

---

## Gemini 4-slot workflow (quota-friendly)

Use **one Gemini session per waypoint** (~3–4 generations). Order matters:

| Slot | Output file | Input | Notes |
|------|-------------|-------|-------|
| **1** | `modern-exterior.jpg` | Text only (Street View POV style) | Scout coords below; refine until framing passes Asset Studio band |
| **2** | `incoming/modern-source.mp4` | **Image:** slot 1 still | img2vid, locked camera, ~5 s |
| **3** | `ancient-reconstruction.jpg` (optional) | **Image:** slot 1 still | Same FOV — only era changes |
| **4** | `incoming/ancient-source.mp4` | **Image:** slot 3 (or slot 1) + motion match slot 2 | Locked camera, same duration |

Then:

```bash
npm run process-waypoint -- <id>    # literal mapping (NOT Pantheon swap)
npm run verify-waypoint -- <id>
```

**Do not** generate ancient from GPS text alone — always use the **modern still as visual reference**.

---

## Shared camera lock (append to every prompt)

```
CAMERA LOCK: Tripod-locked ground-level camera — no pan, tilt, zoom, or dolly during clip.
16:9 landscape. Monument or vista fills ~60–75% of frame height (Colosseum close-approach standard — not a distant postcard).
Center-weighted composition; full facade or primary ruin mass visible.
Photorealistic, natural Mediterranean daylight. No text, watermarks, UI, or borders.
```

---

## Forum Romanum cluster (8 stops)

Suggested walk order within the Forum (adjust `rome-core-tour.js` when scaffolded):

`forum-arch-titus` → `forum-basilica-maxentius` → `forum-via-sacra` → `forum-temple-vesta` → `forum-rostra` → `forum-temple-saturn` → `forum-curia-julia` → `forum-arch-severus`

---

### 1. `forum-temple-saturn` — Temple of Saturn

| Field | Value |
|-------|-------|
| **Title** | Temple of Saturn |
| **Landmark** | `41.89239, 12.48498` |
| **Viewpoint** | `41.89218, 12.48472` · heading `78°` · pitch `16°` |
| **Stand** | West side of Forum, facing east toward the eight surviving columns |
| **Ancient target** | Temple of Saturn, ~100 AD — full podium, colonnade, gilded roof line |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89218,12.48472&heading=78&pitch=16 |
| **framingProfile** | `compact_piazza` |

**Prompt 1 — Modern still**  
Photorealistic ground-level photo of the Temple of Saturn ruins in the Roman Forum today. Stand at 41.89218, 12.48472, camera 78° heading, 16° pitch. Ionic columns and partial entablature fill the frame; tourists and Forum paving in foreground. Overcast-bright Roman daylight, documentary travel photography. CAMERA LOCK.

**Prompt 2 — Modern video**  
Cinematic locked-off 5-second video of the Temple of Saturn today, same camera as the provided modern reference photo. Subtle ambient motion only: light cloud drift, small pedestrian movement, soft daylight. Architecture perfectly fixed — no camera movement, no warp. Hero compare frame at ~3 s with full column row visible. 16:9, 24fps feel. CAMERA LOCK.

**Prompt 3 — Ancient still**  
Ancient Rome reconstruction of the Temple of Saturn, exact same camera position and field of view as the provided modern reference photo. Stand at 41.89218, 12.48472, 78° heading, 16° pitch. Era ~100 AD: complete temple on high podium, gilded roof, intact colonnade. Warm Mediterranean daylight, photorealistic archaeological visualization. No modern ruins, tourists, or anachronisms. CAMERA LOCK.

**Prompt 4 — Ancient video**  
Ancient Rome reconstruction video of the Temple of Saturn, locked tripod camera matching the modern reference video motion and duration (~5 s). Same framing as modern clip. Subtle era-appropriate motion: banners, priest silhouettes, dust motes, warm light flicker. Temple structure fixed — no geometry drift. Hero poster frame at ~3 s. CAMERA LOCK.

---

### 2. `forum-curia-julia` — Curia Julia (Senate House)

| Field | Value |
|-------|-------|
| **Title** | Curia Julia |
| **Landmark** | `41.89223, 12.48528` |
| **Viewpoint** | `41.89205, 12.48505` · heading `55°` · pitch `18°` |
| **Stand** | Forum floor southwest of the brick facade |
| **Ancient target** | Curia Julia senate house, ~200 AD — marble-clad facade, bronze doors |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89205,12.48505&heading=55&pitch=18 |
| **framingProfile** | `compact_piazza` |

**Prompt 1 — Modern still**  
Photorealistic ground-level photo of the Curia Julia brick facade in the Roman Forum today. Stand at 41.89205, 12.48505, camera 55° heading, 18° pitch. Large rectangular senate building fills frame; bronze door replica visible. Forum stone paving, sparse tourists. CAMERA LOCK.

**Prompt 2 — Modern video**  
Locked-off 5-second video of Curia Julia today using provided modern still as exact framing. Subtle sky and pedestrian motion only. Architecture fixed. Hero frame ~3 s. CAMERA LOCK.

**Prompt 3 — Ancient still**  
Ancient Rome reconstruction of Curia Julia senate house, same camera as modern reference. Era ~200 AD: marble-faced facade, bronze doors, steps, intact roofline. No modern brick weathering or tourists. CAMERA LOCK.

**Prompt 4 — Ancient video**  
Ancient Curia Julia video, motion-matched to modern reference clip, ~5 s, locked camera. Senators as distant silhouettes, torch smoke, warm interior glow through doors. CAMERA LOCK.

---

### 3. `forum-arch-severus` — Arch of Septimius Severus

| Field | Value |
|-------|-------|
| **Title** | Arch of Septimius Severus |
| **Landmark** | `41.89301, 12.48442` |
| **Viewpoint** | `41.89275, 12.48455` · heading `340°` · pitch `17°` |
| **Stand** | Forum side, facing northwest toward the triple arch |
| **Ancient target** | Triumphal arch, ~203 AD — gilded bronze reliefs, intact attic inscription |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89275,12.48455&heading=340&pitch=17 |
| **framingProfile** | `large_approach` |

**Prompt 1 — Modern still**  
Photorealistic photo of the Arch of Septimius Severus in the Roman Forum today. Stand at 41.89275, 12.48455, 340° heading, 17° pitch. Three archways and weathered marble fill the frame. CAMERA LOCK.

**Prompt 2 — Modern video**  
5-second locked camera video of the Arch of Septimius Severus, modern reference framing. Subtle cloud drift and pedestrian motion. CAMERA LOCK.

**Prompt 3 — Ancient still**  
Ancient Rome triumphal arch reconstruction, same POV as modern reference. ~203 AD: crisp marble reliefs, gilded bronze statuary on attic, no erosion. CAMERA LOCK.

**Prompt 4 — Ancient video**  
Ancient arch video, motion-synced to modern clip, locked tripod, ~5 s. Subtle parade banners, dust, warm sun glint on gilding. CAMERA LOCK.

---

### 4. `forum-via-sacra` — Via Sacra (Sacred Way)

| Field | Value |
|-------|-------|
| **Title** | Via Sacra |
| **Landmark** | `41.89255, 12.48535` |
| **Viewpoint** | `41.89240, 12.48510` · heading `45°` · pitch `12°` |
| **Stand** | On the Sacred Way paving, looking northeast along the processional route |
| **Ancient target** | Paved Via Sacra, ~120 AD — colonnades, temples lining the street |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89240,12.48510&heading=45&pitch=12 |
| **framingProfile** | `large_approach` |

**Prompt 1 — Modern still**  
Photorealistic ground-level photo along the Via Sacra in the Roman Forum today. Stand at 41.89240, 12.48510, 45° heading, 12° pitch. Cobblestone processional way receding into frame with ruins and columns on both sides. CAMERA LOCK.

**Prompt 2 — Modern video**  
Locked 5-second video along Via Sacra today, matching modern still. Gentle pedestrian movement, light shimmer — no camera move. CAMERA LOCK.

**Prompt 3 — Ancient still**  
Ancient Via Sacra reconstruction, same camera as modern reference. ~120 AD: intact paving, lined colonnades, temples and shops, no modern ruins. CAMERA LOCK.

**Prompt 4 — Ancient video**  
Ancient Via Sacra processional street video, motion-matched to modern, ~5 s. Distant toga-clad crowds, banners, dust in sunbeams. CAMERA LOCK.

---

### 5. `forum-rostra` — Rostra (Speakers' Platform)

| Field | Value |
|-------|-------|
| **Title** | The Rostra |
| **Landmark** | `41.89282, 12.48518` |
| **Viewpoint** | `41.89265, 12.48495` · heading `30°` · pitch `15°` |
| **Stand** | Forum floor facing the Rostra platform and nearby columns |
| **Ancient target** | Rostra with ship-prow decorations, ~50 BC–100 AD |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89265,12.48495&heading=30&pitch=15 |
| **framingProfile** | `compact_piazza` |

**Prompt 1 — Modern still**  
Photorealistic photo of the Rostra platform remains in the Roman Forum today. Stand at 41.89265, 12.48495, 30° heading, 15° pitch. Low marble platform and surrounding columns fill frame. CAMERA LOCK.

**Prompt 2 — Modern video**  
5-second locked video of Rostra ruins, modern reference framing. Subtle ambient motion only. CAMERA LOCK.

**Prompt 3 — Ancient still**  
Ancient Rostra reconstruction with bronze ship rams mounted on the platform, same POV as modern photo. Orators' platform intact, Forum open behind. CAMERA LOCK.

**Prompt 4 — Ancient video**  
Ancient Rostra video, motion-matched, locked camera. Crowd silhouettes, speaker gesturing, flags fluttering. CAMERA LOCK.

---

### 6. `forum-basilica-maxentius` — Basilica of Maxentius

| Field | Value |
|-------|-------|
| **Title** | Basilica of Maxentius |
| **Landmark** | `41.89195, 12.48825` |
| **Viewpoint** | `41.89175, 12.48800` · heading `65°` · pitch `20°` |
| **Stand** | Via Sacra approach, facing the massive surviving vault bay |
| **Ancient target** | Complete basilica, ~312 AD — coffered vaults, colossal scale |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89175,12.48800&heading=65&pitch=20 |
| **framingProfile** | `large_approach` |

**Prompt 1 — Modern still**  
Photorealistic photo of the Basilica of Maxentius vault ruins today. Stand at 41.89175, 12.48800, 65° heading, 20° pitch. Monolithic brick arch and coffered ceiling dominate frame. CAMERA LOCK.

**Prompt 2 — Modern video**  
Locked 5-second video of Basilica of Maxentius ruins, reference framing. Subtle sky motion through vault opening. CAMERA LOCK.

**Prompt 3 — Ancient still**  
Ancient Basilica of Maxentius fully roofed, same camera as modern reference. Massive nave vaults, marble floor, clerestory light. CAMERA LOCK.

**Prompt 4 — Ancient video**  
Ancient basilica interior/nave video, motion-matched, locked camera. Dust in light shafts, distant figures. CAMERA LOCK.

---

### 7. `forum-arch-titus` — Arch of Titus

| Field | Value |
|-------|-------|
| **Title** | Arch of Titus |
| **Landmark** | `41.89068, 12.48858` |
| **Viewpoint** | `41.89050, 12.48835` · heading `25°` · pitch `18°` |
| **Stand** | Via Sacra east approach, facing the single great arch |
| **Ancient target** | Arch of Titus, ~81 AD — relief panels, gilded chariot group on attic |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89050,12.48835&heading=25&pitch=18 |
| **framingProfile** | `compact_piazza` |

**Prompt 1 — Modern still**  
Photorealistic photo of the Arch of Titus on the Via Sacra today. Stand at 41.89050, 12.48835, 25° heading, 18° pitch. Single triumphal arch fills frame against sky. CAMERA LOCK.

**Prompt 2 — Modern video**  
5-second locked video, Arch of Titus, modern still framing. Subtle pedestrian and cloud motion. CAMERA LOCK.

**Prompt 3 — Ancient still**  
Ancient Arch of Titus reconstruction, same POV. Crisp relief panels depicting triumph, gilded quadriga on attic, no weathering. CAMERA LOCK.

**Prompt 4 — Ancient video**  
Ancient Arch of Titus video, motion-synced to modern, locked tripod. Sun glint on gilding, light parade dust. CAMERA LOCK.

---

### 8. `forum-temple-vesta` — Temple of Vesta

| Field | Value |
|-------|-------|
| **Title** | Temple of Vesta |
| **Landmark** | `41.89178, 12.48725` |
| **Viewpoint** | `41.89160, 12.48705` · heading `50°` · pitch `16°` |
| **Stand** | Forum edge near House of the Vestals, facing the round temple |
| **Ancient target** | Circular Temple of Vesta with sacred fire, ~100 AD |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89160,12.48705&heading=50&pitch=16 |
| **framingProfile** | `compact_piazza` |

**Prompt 1 — Modern still**  
Photorealistic photo of the Temple of Vesta circular ruin in the Roman Forum today. Stand at 41.89160, 12.48705, 50° heading, 16° pitch. Curved marble podium and partial columns fill frame. CAMERA LOCK.

**Prompt 2 — Modern video**  
Locked 5-second video of Temple of Vesta ruins, reference framing. CAMERA LOCK.

**Prompt 3 — Ancient still**  
Ancient circular Temple of Vesta with conical roof and sacred flame visible, same camera as modern reference. Vestal precinct intact. CAMERA LOCK.

**Prompt 4 — Ancient video**  
Ancient Temple of Vesta video, motion-matched, locked camera. Flame flicker, veiled priestess silhouettes. CAMERA LOCK.

---

## Standalone stops (6)

---

### 9. `capitoline-hill` — Capitoline Hill (Tabularium view)

| Field | Value |
|-------|-------|
| **Title** | Capitoline Hill |
| **Landmark** | `41.89324, 12.48275` |
| **Viewpoint** | `41.89305, 12.48250` · heading `120°` · pitch `14°` |
| **Stand** | Piazza del Campidoglio edge, overlooking Forum rooftops |
| **Ancient target** | Capitoline temples and Forum vista, ~100 AD |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89305,12.48250&heading=120&pitch=14 |
| **framingProfile** | `large_approach` |

**Prompt 1 — Modern still**  
Photorealistic photo from Capitoline Hill overlooking the Roman Forum today. Stand at 41.89305, 12.48250, 120° heading, 14° pitch. Forum ruins and Colosseum in distance, Michelangelo piazza parapet in foreground. CAMERA LOCK.

**Prompt 2 — Modern video**  
5-second locked vista video from Capitoline Hill, modern reference framing. Subtle cloud drift over Forum. CAMERA LOCK.

**Prompt 3 — Ancient still**  
Ancient Capitoline vista reconstruction, same POV as modern photo. Intact temples on hill, gleaming Forum below, no modern buildings. CAMERA LOCK.

**Prompt 4 — Ancient video**  
Ancient Capitoline overlook video, motion-matched, locked camera. Smoke from sacrifices, banners on temples. CAMERA LOCK.

---

### 10. `campo-de-fiori` — Campo de' Fiori

| Field | Value |
|-------|-------|
| **Title** | Campo de' Fiori |
| **Landmark** | `41.89559, 12.47223` |
| **Viewpoint** | `41.89535, 12.47215` · heading `5°` · pitch `16°` |
| **Stand** | South edge of the square, facing north toward Giordano Bruno statue and market stalls |
| **Ancient target** | **Open campo / public field, ~1400–1500 AD** — pre-baroque palaces, dusty market square, no Bruno statue yet (executions and markets on an open field). *Not* the Theatre of Pompey — that is 200 m east at `largo-argentina`. |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89535,12.47215&heading=5&pitch=16 |
| **framingProfile** | `compact_piazza` |

**Prompt 1 — Modern still**  
Photorealistic photo of Campo de' Fiori square in Rome today with market stalls and cobblestones. Stand at 41.89535, 12.47215, 5° heading, 16° pitch. Piazza fills frame; Giordano Bruno statue and cafe awnings visible. CAMERA LOCK.

**Prompt 2 — Modern video**  
Locked 5-second video of Campo de' Fiori today, market atmosphere, reference framing. Subtle stall awning flutter and pedestrian motion. CAMERA LOCK.

**Prompt 3 — Ancient still**  
Late medieval open campo reconstruction, same camera as modern reference. ~1400s: open dusty field with wooden market stalls and low brick buildings at the edges — no baroque palaces, no Bruno statue, no modern cafes. Honest to this square as a **field and market**, not a Roman theatre. CAMERA LOCK.

**Prompt 4 — Ancient video**  
Medieval campo market video, motion-matched, locked camera. Vendors, carts, cloth awnings, chickens, smoke from braziers — same square shape, earlier era. CAMERA LOCK.

---

### 11. `largo-argentina` — Largo di Torre Argentina (Theatre of Pompey)

| Field | Value |
|-------|-------|
| **Title** | Largo di Torre Argentina |
| **Landmark** | `41.89528, 12.47694` |
| **Viewpoint** | `41.89555, 12.47665` · heading `250°` · pitch `14°` |
| **Stand** | Street level at the railing, facing the sunken Area Sacra temples |
| **Ancient target** | **Theatre of Pompey complex, ~55 BC** — cavea tiers, portico columns, Curia of Pompey (Senate met here; Caesar assassinated 44 BC). This is the correct Pompey waypoint. |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89555,12.47665&heading=250&pitch=14 |
| **framingProfile** | `compact_piazza` |

**Prompt 1 — Modern still**  
Photorealistic photo of Largo di Torre Argentina today — sunken archaeological area with Republican temples, cats on ruins, Rome traffic at street level. Stand at 41.89555, 12.47665, 250° heading, 14° pitch. Excavation fills frame below street grade. CAMERA LOCK.

**Prompt 2 — Modern video**  
Locked 5-second video of Largo Argentina ruins today, reference framing. Subtle cat movement, light cloud drift. CAMERA LOCK.

**Prompt 3 — Ancient still**  
Ancient Theatre of Pompey reconstruction, same camera as modern reference. ~55 BC: marble theatre tiers, portico columns, garden statues, bustling Republican Rome — Curia and cavea visible in excavation depth. No sunken medieval street level. CAMERA LOCK.

**Prompt 4 — Ancient video**  
Ancient Theatre of Pompey video, motion-matched, locked camera. Toga crowds, theatre banners, senators near portico — same POV as modern ruins. CAMERA LOCK.

---

### 12. `trajan-market` — Trajan's Market

| Field | Value |
|-------|-------|
| **Title** | Trajan's Market |
| **Landmark** | `41.89562, 12.48578` |
| **Viewpoint** | `41.89545, 12.48555` · heading `200°` · pitch `18°` |
| **Stand** | Via Biberatica level, facing brick arcades |
| **Ancient target** | Trajan's Market complex, ~110 AD — multi-story brick arcades, shops open |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.89545,12.48555&heading=200&pitch=18 |
| **framingProfile** | `large_approach` |

**Prompt 1 — Modern still**  
Photorealistic photo of Trajan's Market brick arcades today. Stand at 41.89545, 12.48555, 200° heading, 18° pitch. Curving multi-level Roman brick facade fills frame. CAMERA LOCK.

**Prompt 2 — Modern video**  
5-second locked video of Trajan's Market, modern reference framing. Subtle ambient motion. CAMERA LOCK.

**Prompt 3 — Ancient still**  
Ancient Trajan's Market reconstruction, same POV. Intact arcades, shop fronts, awnings, busy commercial levels. CAMERA LOCK.

**Prompt 4 — Ancient video**  
Ancient market video, motion-matched, locked camera. Merchants, awnings flutter, warm interior glow. CAMERA LOCK.

---

### 13. `castel-sant-angelo` — Castel Sant'Angelo

| Field | Value |
|-------|-------|
| **Title** | Castel Sant'Angelo |
| **Landmark** | `41.90306, 12.46627` |
| **Viewpoint** | `41.90255, 12.46610` · heading `15°` · pitch `18°` |
| **Stand** | Ponte Sant'Angelo south end, facing the mausoleum-castle |
| **Ancient target** | Hadrian's Mausoleum, ~138 AD — cylindrical drum, bronze quadriga on summit |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.90255,12.46610&heading=15&pitch=18 |
| **framingProfile** | `large_approach` |

**Prompt 1 — Modern still**  
Photorealistic photo of Castel Sant'Angelo from Ponte Sant'Angelo today. Stand at 41.90255, 12.46610, 15° heading, 18° pitch. Round castle mass and bridge statues fill frame; Tiber below. CAMERA LOCK.

**Prompt 2 — Modern video**  
Locked 5-second video of Castel Sant'Angelo from bridge, reference framing. River shimmer, light cloud drift. CAMERA LOCK.

**Prompt 3 — Ancient still**  
Ancient Hadrian's Mausoleum reconstruction, same camera as modern reference. Smooth marble-clad drum, bronze quadriga on top, no medieval battlements. CAMERA LOCK.

**Prompt 4 — Ancient video**  
Ancient mausoleum video, motion-matched, locked camera. Bronze statue glint, Tiber reflections. CAMERA LOCK.

---

### 14. `circus-maximus` — Circus Maximus

| Field | Value |
|-------|-------|
| **Title** | Circus Maximus |
| **Landmark** | `41.88594, 12.48570` |
| **Viewpoint** | `41.88570, 12.48545` · heading `85°` · pitch `12°` |
| **Stand** | Northwest rim, looking southeast along the long circus bowl |
| **Ancient target** | Circus Maximus chariot stadium, ~100 AD — spina, metae, seating tiers full |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.88570,12.48545&heading=85&pitch=12 |
| **framingProfile** | `large_approach` |

**Prompt 1 — Modern still**  
Photorealistic photo of Circus Maximus grassy bowl today. Stand at 41.88570, 12.48545, 85° heading, 12° pitch. Long oval depression and Palatine Hill backdrop fill frame. CAMERA LOCK.

**Prompt 2 — Modern video**  
5-second locked video of Circus Maximus today, reference framing. Grass ripple, distant traffic haze. CAMERA LOCK.

**Prompt 3 — Ancient still**  
Ancient Circus Maximus reconstruction, same POV. Packed seating tiers, spina with obelisk, starting gates — no modern grass field. CAMERA LOCK.

**Prompt 4 — Ancient video**  
Ancient chariot circus video, motion-matched, locked camera. Distant chariots as motion blur, crowd roar implied by banner flutter. CAMERA LOCK.

---

### 15. `appian-way` — Appian Way (Via Appia Antica)

| Field | Value |
|-------|-------|
| **Title** | Appian Way |
| **Landmark** | `41.85670, 12.51205` |
| **Viewpoint** | `41.85655, 12.51185` · heading `250°` · pitch `10°` |
| **Stand** | On the ancient basalt road near Porta San Sebastiano, looking along the tree-lined via |
| **Ancient target** | Via Appia Antica, ~100 AD — original basalt paving, tombs and cypress |
| **Street View** | https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.85655,12.51185&heading=250&pitch=10 |
| **framingProfile** | `large_approach` |

**Prompt 1 — Modern still**  
Photorealistic photo of the Appian Way ancient basalt road today with cypress trees and tombs. Stand at 41.85655, 12.51185, 250° heading, 10° pitch. Road receding into frame, Roman countryside. CAMERA LOCK.

**Prompt 2 — Modern video**  
Locked 5-second video along Appian Way today, reference framing. Leaf flutter, soft daylight. CAMERA LOCK.

**Prompt 3 — Ancient still**  
Ancient Via Appia reconstruction, same camera as modern reference. Perfect basalt blocks, lined tombs and milestones, no asphalt or modern fences. CAMERA LOCK.

**Prompt 4 — Ancient video**  
Ancient Appian Way video, motion-matched, locked camera. Distant wagon dust, cypress sway. CAMERA LOCK.

---

## After generation — engineering checklist

For each new `id`:

1. Scaffold `src/data/<id>.js` (copy `piazza-navona.js` template)
2. Register in `waypointMerge.js`, `waypointGeo.js`, `rome-core-tour.js` `stopIds`
3. Drop files in `public/waypoints/<id>/incoming/`
4. `npm run process-waypoint -- <id>` → must print **Mapping: literal**
5. `npm run verify-waypoint -- <id>`
6. Add rows to [ASSET_STUDIO_LINKS.md](../ASSET_STUDIO_LINKS.md) and [TOUR_TEST_LINKS.md](../TOUR_TEST_LINKS.md)
7. Test: `http://localhost:5173/?singleWaypoint=<id>&debugGeo=true`

**Re-scout:** Coordinates above are starting points. Open each Street View link, adjust `viewpoint.{lat,lng,heading,pitch}` in the seed until Asset Studio framing check passes before locking prompts.

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
