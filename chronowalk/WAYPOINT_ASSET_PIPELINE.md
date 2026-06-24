# ChronoWalk — Waypoint Asset Pipeline (Agent Playbook)

Agent-oriented checklist for adding a new waypoint with a matched **modern ↔ ancient** “Magic Portal” slider.  
Reference implementation: **Colosseum** (`src/data/colosseum.js`).

Related docs: [CHRONOWALK_BUILD_STATE.md](./CHRONOWALK_BUILD_STATE.md)

---

## Core idea

ChronoWalk does **not** fetch Street View or panoramas at runtime. An agent (or human) must:

1. Choose where the visitor stands and which direction they face.
2. Export **modern** media from that exact camera POV.
3. Produce **ancient** media locked to the **same** camera POV.
4. Register everything in a local seed file (+ optional Supabase row).

The app geofences on **landmark center** coords. The slider uses **pre-baked assets** shot from **viewpoint** coords.

---

## Two coordinate systems (do not confuse them)

| Field | Purpose | Colosseum example |
|-------|---------|-------------------|
| `lat`, `lng` on waypoint | Landmark center — map marker, geofence trigger | `41.8902, 12.4922` |
| `viewpoint.lat`, `viewpoint.lng` | Where the visitor/camera stands for the slider | `41.891275, 12.491202` |
| `viewpoint.heading` | Compass bearing toward the facade (degrees) | `153.2` |
| `viewpoint.pitch` | Camera tilt up/down (degrees, slight up for full height) | `18.1` |

**Colosseum lesson:** viewpoint is ~100 m from landmark center — a ground-level **facade approach** on the path tourists actually use, not the arena centroid.

---

## Colosseum framing standard (replicate for every waypoint)

The Colosseum `modern-exterior.jpg` works because it feels **close and immersive**, not like a wide postcard. Codify this for all new sites:

| What worked (Colosseum) | Pantheon mistake (first pass) |
|-------------------------|-------------------------------|
| Viewpoint **~127 m** from landmark center, on approach path | Viewpoint **same as** landmark pin (piazza center) → building looks small |
| **Pitch 18.1°** — facade fills the frame | **Pitch 10.5°** — more horizon, less monument |
| Mid-approach stand (tourist walk-up) | Fountain / square center (iconic but too far) |
| Hero frame at **3 s** tuned for full facade | Same rule applies once POV is fixed |

### Framing checklist (before exporting `modern-exterior.jpg`)

1. **Do not** use the Google Maps place pin or square center as the camera — walk Street View **toward** the facade until the building dominates the frame.
2. **Separate coords:** `viewpoint.lat/lng` ≠ `waypoint.lat/lng` (aim for **25–120 m** from center along the approach axis; Colosseum ≈ **127 m**).
3. **Pitch 14–22°** so pediment/roofline sits in the upper third (Colosseum: **18.1°**).
4. **Facade fill:** monument should occupy roughly **60–75% of frame height** in the reference still.
5. **16:9 export** centered on the facade; avoid ultra-wide plaza shots.
6. **Clutter pass:** no lampposts, buses, or scaffolding bisecting the hero facade.
7. **Validate in Asset Studio** — framing warnings appear for waypoints that fail offset/pitch heuristics.

### Pantheon fix (re-scout)

1. Open Street View at the fountain, then **walk north toward the portico steps** (~20–40 m).
2. Raise pitch to **~16–18°** (match Colosseum band).
3. Re-export `modern-exterior.jpg`, update `PANTHEON_VIEWPOINT` coords + pitch in `pantheon.js`.
4. Regenerate all AI assets from the new reference.

Asset Studio shows automated framing assessment via `assessModernFraming()` (`src/utils/modernFramingGuide.js`).

---

## Agent workflow (per waypoint)

### Phase 0 — Scaffold

- [ ] Pick `id` (kebab-case, e.g. `pantheon`, `forum-romanum`).
- [ ] Create `public/waypoints/<id>/` directory.
- [ ] Create `src/data/<id>.js` seed file (copy structure from `colosseum.js`).
- [ ] Register in `getLocalWaypoint()` inside `src/services/waypointMerge.js`.
- [ ] Wire fetch in `App.jsx` when multi-waypoint tours exist (Colosseum MVP uses `fetchWaypointById('colosseum')` only).

### Phase 1 — Find the stand-here spot (modern POV)

**Goal:** A realistic modern view a visitor can replicate on site.

1. Open **Google Street View** (or Google Arts & Culture outdoor imagery) at the approach path.
2. Walk virtually along the real tourist approach until the **full facade** is visible without obstructions (lampposts, trees, buses).
3. Record stand-here GPS as `viewpoint.lat` / `viewpoint.lng`.
4. Record `heading` (direction camera faces) and `pitch` (usually 10–25° up for tall facades).
5. Write `immersive_orientation_hint` telling the user how to stand (e.g. “Face the west facade from Via …”).

**Reference sources (export only — never hotlink in app):**

- Google Street View at `viewpoint` coords
- Google Arts & Culture outdoor panoramas
- Licensed ground-level photo / your own on-site capture

**Hard rule:** Export files into `public/waypoints/<id>/`. No runtime URLs to third-party panorama sites.

### Phase 2 — Export modern layer

| Asset | Filename | Notes |
|-------|----------|-------|
| Video (preferred) | `modern.mp4` or `<site>-modern.mp4` | ~5 s, 16:9, stable camera, no zoom |
| Still fallback | `modern-exterior.jpg` | Same POV as video |
| Poster still | `modern-poster.jpg` | Hero frame for compare mode; export at `slider_poster_at_sec` |

**Quality bar:**

- Same viewpoint as `viewpoint` heading/pitch.
- Full facade height visible (tune `slider_poster_at_sec` — Colosseum uses **3 s** to avoid lampposts).
- 16:9 aspect for video; posters use `object-fit: cover` in app.

### Phase 3 — Produce ancient layer (matched POV)

Ancient media must look like the **same camera** as modern — only the era changes.

| Asset | Filename | Notes |
|-------|----------|-------|
| Video | `ancient-reconstruction.mp4` | Same duration & framing as modern |
| Still fallback | `ancient-reconstruction.jpg` | Same angle |
| Poster still | `ancient-poster.jpg` | Same frame as modern poster; **pad to 16:9** if source is square |

**Production methods:**

- 3D reconstruction render (Rome Reborn–style) from matched camera
- AI image/video with **modern still as reference** (controlnet / img2img)
- Manual compositing in Blender/etc. using `viewpoint` as camera rig

**Sync rule:** When both videos play, ancient `currentTime` tracks modern within 0.2 s (handled in `BeforeAfterSlider.jsx`).

### Phase 4 — Optional depth map

- [ ] `depth-map.png` derived from ancient reconstruction.
- [ ] Set `depth_map_url` on waypoint — boosts device-tilt parallax 1.1×.

### Phase 5 — Audio assets

| Asset | Field | Notes |
|-------|-------|-------|
| Arrival immersive narration | `arrival_immersive_url` | Main on-site guide MP3 |
| Transit approach narration | `transit_narrative_url` | Optional; orchestrator ready, not auto-wired in App yet |
| Ambient loop | `ambient_url` | Optional background |
| Geofence chime | `arrival_alert_url` | Short WAV on geofence entry (~30 m) |

### Phase 6 — Seed file template

```javascript
// src/data/pantheon.js
export const PANTHEON = { lat: 41.8986, lng: 12.4768 }

export const PANTHEON_VIEWPOINT = {
  lat: 41.8989,   // stand-here (from Street View)
  lng: 12.4765,
  heading: 180.0, // facing facade
  pitch: 12.0,
}

export const PANTHEON_WAYPOINT = {
  id: 'pantheon',
  title: 'The Pantheon',
  arrival_headline: "You've reached the Pantheon!",
  arrival_subtitle: '...',
  immersive_orientation_hint:
    'Stand in the piazza facing the portico, then begin the immersive view.',
  lat: PANTHEON.lat,
  lng: PANTHEON.lng,
  viewpoint: PANTHEON_VIEWPOINT,
  modern_image_url: '/waypoints/pantheon/modern-exterior.jpg',
  modern_video_url: '/waypoints/pantheon/modern.mp4',
  modern_poster_url: '/waypoints/pantheon/modern-poster.jpg',
  ancient_image_url: '/waypoints/pantheon/ancient-reconstruction.jpg',
  ancient_video_url: '/waypoints/pantheon/ancient-reconstruction.mp4',
  ancient_poster_url: '/waypoints/pantheon/ancient-poster.jpg',
  slider_poster_at_sec: 3,
  slider_post_animation_loop_ms: 10000,
  slider_freeze_at_sec: 3,
  depth_map_url: '/waypoints/pantheon/depth-map.png',
  ambient_url: '/waypoints/pantheon/ambient.mp3',
  transit_narrative_url: '/waypoints/pantheon/transit.mp3',
  arrival_immersive_url: '/waypoints/pantheon/arrival.mp3',
  arrival_alert_url: '/waypoints/pantheon/arrival-alert.wav',
}
```

Register in `waypointMerge.js`:

```javascript
import { PANTHEON_WAYPOINT } from '../data/pantheon'

export const getLocalWaypoint = (id) => {
  if (id === 'colosseum') return COLOSSEUM_WAYPOINT
  if (id === 'pantheon') return PANTHEON_WAYPOINT
  return null
}
```

### Phase 7 — Supabase (optional CMS)

Table: `waypoints` — columns align with seed schema.

- Remote row wins on overlap; empty media/copy fields fall back to local seed (`waypointMerge.js`).
- Use `VITE_CDN_BASE_URL` for large assets hosted off-repo.
- Never publish a Supabase row that **clears** `ancient_video_url` without providing a replacement.

---

## File layout checklist

```
public/waypoints/<id>/
  modern-exterior.jpg          # still fallback
  modern.mp4                   # slider animation (modern)
  modern-poster.jpg            # compare / alignment reference
  ancient-reconstruction.jpg   # still fallback
  ancient-reconstruction.mp4   # slider animation (ancient)
  ancient-poster.jpg           # compare + ghost alignment (pad to 16:9)
  depth-map.png                # optional
  arrival.mp3                  # immersive narration
  transit.mp3                  # optional approach narration
  ambient.mp3                  # optional
  arrival-alert.wav            # geofence chime
```

---

## Field tuning (on-device, no redeploy)

| URL param | Effect |
|-----------|--------|
| `?debugGeo=true` | Teleport GPS to waypoint (test geofence without travel) |
| `?posterAt=3` | Hero frame for poster stills (seconds into video) |
| `?freezeAt=3` | Alias for `posterAt` |
| `?loopMs=10000` | Post-play loop duration before compare mode |
| `?holdMs=10000` | Alias for `loopMs` |

**Colosseum tuning notes:**

- `slider_poster_at_sec: 3` — full facade, fewer lampposts than end-of-clip frame.
- `slider_post_animation_loop_ms: 10000` — normal-speed loop after first playthrough.

---

## Ghost calibration (per-user fine-tune)

After assets ship, users can micro-align ancient over modern on site.

- Toggle: **Align ghost overlay** in `WaypointCard`.
- Storage key: `chronowalk:calibration:<waypointId>` in `localStorage`.
- Fields: `{ offsetX, offsetY, rotate }` (pixels + degrees).
- Lock saves; Reset clears.

Agents do **not** need per-user calibration in the seed — it's a runtime UX layer. Do need **well-matched base assets** so calibration range stays small.

---

## Verification checklist (agent)

```bash
cd chronowalk
npm test
npm run build
```

**On phone (Netlify + `?debugGeo=true`):**

- [ ] Geofence fires at ≤ 30 m from `lat`/`lng` center.
- [ ] Arrival card shows correct headline + orientation hint.
- [ ] Begin Immersive View → audio plays → slider appears after sync.
- [ ] Modern + ancient videos play in sync.
- [ ] ~10 s loop at normal speed → poster compare unlocks.
- [ ] Drag slider: same facade geometry both sides (no huge offset).
- [ ] Align ghost overlay: modern photo under 50% ancient; sliders move ghost.
- [ ] Lock alignment → reload → offsets persist.
- [ ] Ancient layer loads on mobile (not black).

---

## Colosseum reference values (copy baseline)

| Item | Value |
|------|-------|
| Landmark center | `41.8902, 12.4922` |
| Slider viewpoint | `41.891275, 12.491202` |
| Heading / pitch | `153.2°` / `18.1°` |
| Geofence arrival | 30 m |
| Map visual zone | 150 m radius |
| Audio prefetch | 200 m |
| Poster frame | 3 s |
| Post-play loop | 10 000 ms |

**How modern was sourced:** Street View / ground-level facade approach at `COLOSSEUM_VIEWPOINT`, exported to `modern-exterior.jpg` and `moderncolosseum.mp4`. Ancient matched in post (3D/AI) to same camera. Videos committed in repo history; large files may also live on CDN via `VITE_CDN_BASE_URL`.

---

## Common failures (avoid)

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Ancient black on mobile | Missing URL or failed probe | Verify `ancient_video_url`; check merge fallback |
| Layers misaligned | Different camera POV for modern vs ancient | Re-render ancient from modern reference |
| Lampposts / clutter in compare | Wrong poster frame | Lower `slider_poster_at_sec`; re-export posters |
| Bottom of facade cropped | Wrong `object-fit` or bad poster aspect | Use 16:9 posters; tune `?posterAt=` on device |
| Ghost overlay “does nothing” | Only ancient showing | Ensure `modern_poster_url` exists; use alignment mode stack |
| Supabase row breaks slider | Remote row dropped media fields | Merge layer keeps local URLs — don’t clear fields in CMS |

---

### Pantheon (scaffolded)

| Item | Value |
|------|-------|
| Landmark center | `41.8986108, 12.4768729` |
| Viewpoint (fountain) | `41.8986108, 12.4768729` |
| Heading / pitch | `3.07°` / `10.52°` (from Street View `3.07h, 100.52t`) |
| Modern still | `public/waypoints/pantheon/modern-exterior.jpg` (exported) |
| Asset Studio | `?assetStudio=true&waypoint=pantheon` |
| Seed | `src/data/pantheon.js` |

---

## Agent prompt snippet (paste into new session)

```
Add waypoint "<id>" to ChronoWalk following WAYPOINT_ASSET_PIPELINE.md:
1. Find viewpoint via Street View (lat, lng, heading, pitch).
2. Export modern video + posters to public/waypoints/<id>/.
3. Produce ancient layer at identical POV.
4. Create src/data/<id>.js seed + register in waypointMerge.js.
5. Verify with ?debugGeo=true on mobile.
Do not hotlink external imagery. Match colosseum.js schema.
```

---

## Asset Studio (in-app prompt generator)

Open the creator UI to pull the modern reference image and generate copy-paste prompts:

```
https://your-site.netlify.app/?assetStudio=true&waypoint=colosseum
```

Local dev:

```
http://localhost:5173/?assetStudio=true&waypoint=colosseum
```

The studio reads `modern_image_url` (or poster/video fallback) plus `viewpoint` metadata and outputs:

- **Runway / Pika** — modern animated video prompt
- **Midjourney** — ancient still prompt (use modern photo as image reference)
- **Runway / motion-sync** — ancient animated video prompt
- **DaVinci Resolve** — sync brief + deliverable paths

Implementation: `src/components/WaypointAssetStudio.jsx`, `src/utils/waypointAssetPrompts.js`

---

## Next engineering steps (multi-waypoint)

Not required for asset production, but needed for a full tour:

- [ ] Tour routing in `App.jsx` (sequence of waypoint IDs).
- [ ] `fetchWaypointById` for each stop on approach.
- [ ] Map markers per waypoint.
- [ ] Transit narration auto-play between stops (orchestrator already supports `TRANSIT` mode).

Asset pipeline above is **independent** of tour routing — ship assets per waypoint first, wire navigation second.
