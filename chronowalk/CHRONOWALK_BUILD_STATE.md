# ChronoWalk — Build State & Agentic Replication Guide

Last updated: June 2026  
Branch: `cursor/chronowalk-setup-a224`  
PR: [#4](https://github.com/isienrione/pirisibits/pull/4)  
Repo: `isienrione/pirisibits` (app lives in `chronowalk/`)

---

## What ChronoWalk Is

ChronoWalk is a location-aware, mobile-first PWA for an immersive walking tour of Rome. The MVP targets a **single waypoint — the Colosseum** — with:

- GPS geofencing and Mapbox navigation
- Multi-mode audio narration with mobile interruption handling
- A before/after “time portal” slider (modern vs ancient reconstruction)
- Optional device-tilt parallax during animation
- Supabase-ready data layer with local seed fallback

The experience guides a visitor from **approach (TRANSIT)** to **arrival (ARRIVAL)**, then offers orientation, synced immersive audio, and a visual reveal.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS 3 |
| Map | Mapbox GL JS (`mapbox://styles/mapbox/dark-v11`) |
| Compare slider | `react-compare-slider` |
| Backend data | Supabase (`waypoints` table), with local seed fallback |
| Deploy | Netlify (`netlify.toml` at repo root) |
| Tests | Vitest 4 + jsdom + Testing Library (23 tests passing) |

---

## Successfully Built Features

### 1. User interaction gate

- Full-screen **“Start Immersive Tour”** button before anything loads.
- Tap unlocks geolocation, audio (mobile autoplay policy), and requests device-tilt permission (iOS).
- Implemented in `src/App.jsx`.

### 2. Geolocation & journey states

- `useGeoLocation` tracks GPS via `watchPosition` (high accuracy).
- Haversine distance in meters (`src/utils/distance.js`).
- **TRANSIT**: user is farther than 30 m from target.
- **ARRIVAL**: user is within 30 m (`GEOFENCE_ARRIVAL_THRESHOLD_M`).
- **Debug mode**: teleports user to Colosseum coords when `VITE_DEBUG_GEO=true` or `?debugGeo=true`.
- Map visual zone: 150 m gold circle (`COLOSSEUM_ARRIVAL_RADIUS_M`).

### 3. Map (`TourMap.jsx`)

- Dark Mapbox map centered on Colosseum.
- Yellow landmark marker + blue “You” marker.
- Gold GeoJSON arrival zone overlay.
- HUD: debug GPS status, journey state, distance, geofence radius.
- In debug mode, user marker is nudged slightly for visibility.
- Missing `VITE_MAPBOX_TOKEN` shows a full-screen error.

### 4. Waypoint data layer

- `fetchWaypointById('colosseum')` tries Supabase first, merges with local seed.
- `mergeWaypointWithLocalDefaults` fills missing remote media/copy from `COLOSSEUM_WAYPOINT`.
- `resolveAssetUrl` prefixes relative paths with `VITE_CDN_BASE_URL` when set.
- Local seed: `src/data/colosseum.js`.

### 5. Arrival reveal flow

On first geofence entry (TRANSIT → ARRIVAL):

1. Short arrival alert chime (`playArrivalAlert`).
2. **1400 ms delay** (`CARD_REVEAL_DELAY_MS`).
3. Waypoint card slides up from bottom.
4. Card can be minimized; **“Reopen {title}”** FAB reappears (safe-area aware, `z-[200]`).

### 6. Waypoint card (`WaypointCard.jsx`)

**Pre-immersive state:**

- Arrival headline and subtitle.
- “Before you begin” orientation hint (facade-facing guidance).
- **Begin Immersive View** (primary, gold).
- **Play audio guide only** (secondary).
- **Play audio / Pause audio** toggle below both buttons.

**Post-sync state (immersive):**

- Before/after slider revealed only after `AUDIO_SYNC_TRIGGER` event.
- “Hide visual slider” option.
- Play/Pause toggle remains visible.

### 7. Before/after slider (`BeforeAfterSlider.jsx`)

**Media pipeline:**

1. Both videos play once (synced within 0.2 s).
2. **~10 s normal-speed loop** of the animation (`slider_post_animation_loop_ms`).
3. Poster stills at hero frame (`slider_poster_at_sec`, default 3 s).
4. Drag-to-compare mode with Replay button.

**Visual details:**

- Video-first (mp4/webm/mov), image fallback.
- 16:9 frame from card width, capped at 78% viewport height.
- `object-fit: cover` during playback and poster compare.
- Ancient layer: loading probe, optimistic render, error placeholder.
- Device-tilt parallax during animation only (not in compare mode).
- Depth map boosts parallax 1.1× when present.

**URL tuning params:**

| Param | Effect |
|-------|--------|
| `?posterAt=N` / `?freezeAt=N` | Poster hero frame (seconds) |
| `?loopMs=N` / `?holdMs=N` | Post-animation loop duration (ms) |

### 8. Audio system (`AudioOrchestrator.js`)

Four `HTMLAudioElement` players: ambient, transit, arrival, alert.

**Modes:** `AMBIENT`, `TRANSIT`, `ARRIVAL`.

**Arrival playback:**

- Crossfade from transit (500 ms).
- `waitForCanPlayThrough` with 12 s timeout before visual sync.
- Visual sync fires 250 ms after play starts (`VISUAL_SYNC_DELAY_MS`).
- Custom event: `AUDIO_SYNC_TRIGGER`.

**Mobile hardening:**

- Prefetch arrival audio within 200 m during approach (`useArrivalAudioPrefetch`).
- Page visibility / focus detection for audio interruption (e.g. TikTok).
- **No auto-resume** on return — user taps Play audio.
- `pauseArrival()` / `resumeArrival()` / `toggleArrivalPlayback()`.
- Playback state via `AUDIO_PLAYBACK_STATE` custom event + `useAudioPlaybackState` hook.

**Currently wired in App:**

- Arrival alert on geofence entry.
- User-initiated arrival audio from WaypointCard.
- Prefetch during approach.

**Implemented but not auto-wired:**

- Transit narrative auto-play on approach.
- Ambient background audio.

### 9. Device tilt (`useDeviceTilt.js`)

- DeviceOrientation API with iOS permission request.
- Calibrated baseline, clamped parallax shift.
- Recalibrate option in slider footer.

### 10. PWA shell

- `public/manifest.json`: “ChronoWalk: Immersive Rome”, standalone display.
- Linked from `index.html`.

### 11. Tests (23 passing)

| Suite | Coverage |
|-------|----------|
| `AudioOrchestrator.test.js` | Visual sync timing, prefetch, visibility/interruption, pause/resume/toggle, stale sync cancel |
| `audioMedia.test.js` | `waitForCanPlayThrough`, `shouldPrefetchArrival` |
| `waypointMerge.test.js` | Remote/local merge for media + copy |
| `WaypointCard.test.jsx` | Orientation gate, sync reveal, immersive CTA, play/pause button placement |

---

## Architecture Overview

```
Start Immersive Tour
        │
        ▼
  fetchWaypointById('colosseum')
  useGeoLocation (TRANSIT / ARRIVAL)
  useArrivalAudioPrefetch (≤200 m)
        │
        ▼
  ARRIVAL geofence (≤30 m)
        │
        ├── playArrivalAlert
        ├── 1400 ms delay
        └── WaypointCard slides up
                │
                ├── Begin Immersive View
                │       ├── transitionTo(ARRIVAL, syncVisual: true)
                │       ├── AUDIO_SYNC_TRIGGER (250 ms after audio play)
                │       └── BeforeAfterSlider appears
                │
                ├── Play audio guide only
                │       └── transitionTo(ARRIVAL, force: true)
                │
                └── Play / Pause audio toggle
```

### Key source files

| Path | Role |
|------|------|
| `src/App.jsx` | Root orchestration: gate, geo, waypoint fetch, arrival reveal, card reopen |
| `src/components/TourMap.jsx` | Mapbox map, markers, arrival zone, debug HUD |
| `src/components/WaypointCard.jsx` | Arrival UI, immersive gate, audio controls, slider reveal |
| `src/components/BeforeAfterSlider.jsx` | Compare slider, video pipeline, tilt parallax |
| `src/hooks/useGeoLocation.js` | GPS tracking, TRANSIT/ARRIVAL, debug teleport |
| `src/hooks/useDeviceTilt.js` | Device orientation parallax + iOS permission |
| `src/hooks/useArrivalAudioPrefetch.js` | Prefetch arrival audio during approach |
| `src/hooks/useAudioPageVisibility.js` | Re-attach visibility listener after gate |
| `src/hooks/useAudioPlaybackState.js` | React state from playback events |
| `src/audio/AudioOrchestrator.js` | Multi-mode audio, sync, prefetch, pause/resume |
| `src/audio/audioMedia.js` | Buffer wait, prefetch helper, volume/timing constants |
| `src/services/waypointService.js` | Supabase fetch, CDN URL resolution |
| `src/services/waypointMerge.js` | Merge remote + local waypoint fields |
| `src/data/colosseum.js` | Colosseum coords, constants, `COLOSSEUM_WAYPOINT` seed |
| `src/config/env.js` | Env parsing, `isDebugGeo()`, `isMapboxConfigured()` |
| `src/utils/sliderMedia.js` | Slider URL helpers + URL param overrides |

### Custom DOM events

| Event | Purpose |
|-------|---------|
| `AUDIO_SYNC_TRIGGER` | Fires when arrival audio is ready; reveals slider |
| `AUDIO_PLAYBACK_STATE` | Broadcasts play/pause/interrupted state to React |

---

## Waypoint Data Schema

### Local seed (`COLOSSEUM_WAYPOINT`)

```javascript
{
  id: 'colosseum',
  title: 'The Colosseum',
  arrival_headline,
  arrival_subtitle,
  immersive_orientation_hint,
  lat, lng,
  viewpoint: { lat, lng, heading, pitch },  // documented camera POV for matched assets
  modern_image_url,
  modern_video_url,
  modern_poster_url,
  ancient_image_url,
  ancient_video_url,
  ancient_poster_url,
  slider_poster_at_sec,              // default 3
  slider_post_animation_loop_ms,     // default 10000
  slider_freeze_at_sec,              // alias for poster frame
  ambient_url,
  transit_narrative_url,
  arrival_immersive_url,
  arrival_alert_url,
  depth_map_url,
}
```

### Geo & timing constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `COLOSSEUM` | 41.8902, 12.4922 | Waypoint center |
| `COLOSSEUM_VIEWPOINT` | 41.891275, 12.491202, heading 153.2°, pitch 18.1° | Matched camera POV |
| `GEOFENCE_ARRIVAL_THRESHOLD_M` | 30 | ARRIVAL trigger |
| `COLOSSEUM_ARRIVAL_RADIUS_M` | 150 | Map visual zone |
| `ARRIVAL_AUDIO_PREFETCH_RADIUS_M` | 200 | Audio prefetch while in TRANSIT |
| `CARD_REVEAL_DELAY_MS` | 1400 | Delay after alert before card |

### Supabase table (inferred)

- Table: `waypoints`
- Query: `.select('*').eq('id', id).maybeSingle()`
- Columns align with seed schema above.
- Remote rows win on overlap; empty media/copy fields fall back to local seed.

---

## Environment & Deployment

### Required env vars

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_MAPBOX_TOKEN` | Yes (for map) | Mapbox public token |

### Optional env vars

| Variable | Purpose |
|----------|---------|
| `VITE_DEBUG_GEO` | `true` → teleport GPS to Rome |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_CDN_BASE_URL` | CDN prefix for relative asset paths |
| `VITE_API_BASE_URL` | Reserved for future API |

### Netlify

```toml
# netlify.toml (repo root)
[build]
  base = "chronowalk"
  command = "npm run build"
  publish = "dist"
```

Set `VITE_MAPBOX_TOKEN` in Netlify environment variables.  
Test on phone without redeploy: `https://your-site.netlify.app/?debugGeo=true`

### Local dev

```bash
cd chronowalk
cp .env.example .env   # add VITE_MAPBOX_TOKEN
npm install
npm run dev            # http://0.0.0.0:5173
npm test
npm run build
```

---

## Media Assets

### Committed in repo (`public/`)

| File | Notes |
|------|-------|
| `favicon.svg` | App icon |
| `manifest.json` | PWA manifest (references `logo192.png` / `logo512.png` — not yet added) |

### Required but not committed (referenced by `colosseum.js`)

All under `public/waypoints/colosseum/`:

| Asset | Path | Role |
|-------|------|------|
| Modern video | `moderncolosseum.mp4` | Slider modern layer (~5.2 s) |
| Modern still | `modern-exterior.jpg` | Fallback still |
| Modern poster | `modern-poster.jpg` | Post-animation compare frame |
| Ancient video | `ancient-reconstruction.mp4` | Slider ancient layer (~5.2 s) |
| Ancient still | `ancient-reconstruction.jpg` | Fallback still |
| Ancient poster | `ancient-poster.jpg` | Post-animation compare (padded to 16:9) |
| Depth map | `depth-map.png` | Optional parallax boost |
| Sample audio | `Audio_sample.mp3` | Placeholder for all audio tracks |
| Arrival alert | `geocache-arrival-alert.wav` | Geofence entry chime |

**Asset pipeline rules (from `colosseum.js`):**

- Modern and ancient layers must share the **same camera viewpoint**.
- Do not hotlink Street View or panorama sites — export JPGs/MP4s into `public/`.
- Ancient poster: pad square frame to 16:9 so full height is preserved.
- Poster stills: export from video at `slider_poster_at_sec` (~3 s for full facade, no lampposts).

---

## UX Flows (End-to-End)

### A. Cold start

1. User sees “Start Immersive Tour”.
2. Tap → tilt permission + `hasInteracted = true`.
3. Waypoint data loads; map renders with real or debug GPS.

### B. Approach (TRANSIT)

- User marker moves toward Colosseum on map.
- Arrival audio prefetched within 200 m.
- No auto-play transit narrative (orchestrator ready, not wired).

### C. Arrival (geofence)

1. Distance ≤ 30 m → `ARRIVAL`.
2. Alert chime plays.
3. After 1.4 s, card slides up with orientation + CTAs.

### D. Immersive mode

1. Tap “Begin Immersive View”.
2. Tilt permission; parallax if granted.
3. Audio buffers → plays → 250 ms later slider appears.
4. Videos play → loop ~10 s → poster stills → drag compare.
5. Play/Pause available throughout.

### E. Audio-only

- “Play audio guide only” starts arrival audio without visual sync.
- Slider stays hidden unless immersive path was used.

### F. Interruption recovery

1. User leaves app (TikTok, Instagram, phone call).
2. Audio pauses; state marked interrupted.
3. On return: no auto-resume.
4. User taps **Play audio** to continue.

---

## Known Gaps & Not Yet Built

| Gap | Notes |
|-----|-------|
| Waypoint media files | Not in git; must be supplied via CDN or `public/waypoints/colosseum/` |
| Supabase production content | Table exists in design; populate for live CMS workflow |
| PWA icons | `logo192.png` / `logo512.png` referenced but missing |
| Transit/ambient auto-play | Orchestrator supports it; `App.jsx` does not wire journey-state transitions |
| Multi-waypoint tours | Architecture is single-waypoint MVP |
| Project README | Still default Vite template; this file is the living build doc |

---

## Agentic Replication Guide

What an autonomous agent (or new developer session) needs to **reproduce, extend, or redeploy** ChronoWalk from scratch.

### 1. Repository & branch context

- Clone `isienrione/pirisibits`.
- App directory: `chronowalk/`.
- Active feature branch: `cursor/chronowalk-setup-a224`.
- Base branch for PRs: `main`.
- Branch naming convention for agents: `cursor/<descriptive-name>-a224`.

### 2. Secrets & external services

| Service | What to obtain | Where to set |
|---------|----------------|--------------|
| Mapbox | Public access token | `VITE_MAPBOX_TOKEN` in `.env` + Netlify |
| Supabase (optional) | Project URL + anon key | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| CDN (optional) | Base URL for large media | `VITE_CDN_BASE_URL` |
| Netlify | Site linked to repo | Build uses `netlify.toml` |

Without Mapbox token, map shows error screen. Without Supabase, local seed in `colosseum.js` is used.

### 3. Media asset creation (critical path)

An agent cannot fully replicate the immersive experience without these assets:

1. **Matched-viewpoint modern + ancient videos** (~5 s each, same camera angle).
2. **Poster JPGs** exported at ~3 s (full Colosseum facade, no lampposts).
3. **Arrival immersive audio** (narration MP3).
4. **Arrival alert** (short WAV chime).
5. Optional: depth map PNG from ancient reconstruction.

Place in `public/waypoints/colosseum/` or host on CDN and set `VITE_CDN_BASE_URL`.

### 4. Core implementation order (if rebuilding)

Recommended build sequence an agent should follow:

1. **Scaffold** — Vite + React + Tailwind in `chronowalk/`.
2. **Env layer** — `config/env.js`, `.env.example`, debug geo param.
3. **Data seed** — `colosseum.js` with coords, constants, waypoint schema.
4. **Geo hook** — `useGeoLocation` with TRANSIT/ARRIVAL + debug mode.
5. **Map** — `TourMap` with Mapbox, markers, arrival zone circle.
6. **App gate** — “Start Immersive Tour” + interaction unlock.
7. **Waypoint service** — Supabase fetch + local merge fallback.
8. **Audio orchestrator** — multi-player, modes, buffer wait, visual sync event.
9. **Arrival flow** — alert → delay → card reveal in `App.jsx`.
10. **Waypoint card** — orientation, CTAs, play/pause toggle.
11. **Before/after slider** — video pipeline, loop phase, poster compare, tilt.
12. **Mobile hardening** — prefetch, visibility interruption, no auto-resume.
13. **Tests** — orchestrator, merge, card flows.
14. **Deploy** — Netlify with env vars; verify `?debugGeo=true` on phone.

### 5. Conventions an agent must follow

- **ES modules** throughout; `.js` / `.jsx` (no TypeScript in current MVP).
- **Singleton audio orchestrator** — do not instantiate multiple orchestrators.
- **Custom DOM events** for audio ↔ UI coupling (not React context for sync).
- **User gesture gate** before geolocation/audio (mobile autoplay policy).
- **Local-first data** — Supabase optional; never drop local media URLs on partial remote rows (use `waypointMerge.js`).
- **Minimal diff scope** — match existing naming, patterns, and comment style.
- **Mobile-first** — safe-area insets, `playsInline`, muted video autoplay, no auto-resume after OS audio steal.

### 6. Verification checklist

```bash
cd chronowalk
npm install
npm test          # expect 23 passing
npm run build     # expect clean Vite build
npm run dev       # local smoke test
```

**On phone (Netlify or LAN):**

- [ ] `?debugGeo=true` triggers ARRIVAL without walking to Rome
- [ ] Map loads with user + Colosseum markers
- [ ] Card slides up after geofence + alert
- [ ] Begin Immersive View → audio plays → slider appears ~250 ms after audio
- [ ] Videos play, loop ~10 s at normal speed, then poster compare
- [ ] Drag slider compares modern vs ancient
- [ ] Play/Pause works; survives TikTok/Instagram switch
- [ ] Minimize card → Reopen FAB appears above Safari bar
- [ ] Ancient video loads on mobile (not black layer)

### 7. URL debug toolkit for field testing

| URL | Use |
|-----|-----|
| `?debugGeo=true` | Fake GPS at Colosseum |
| `?posterAt=3` | Tune poster hero frame |
| `?loopMs=10000` | Tune post-play loop duration |

### 8. Safe extension points

| Extension | Where to start |
|-----------|----------------|
| Second waypoint | Add seed in `data/`, extend `getLocalWaypoint`, tour routing in `App.jsx` |
| Transit narration | Wire `transitionTo(TRANSIT)` in `App.jsx` on journey state |
| Ambient audio | Wire `transitionTo(AMBIENT)` on tour start |
| CMS content | Populate Supabase `waypoints`; merge layer handles partial rows |
| New slider behavior | `BeforeAfterSlider.jsx` + `sliderMedia.js` URL params |
| Audio UX | `AudioOrchestrator.js` + `useAudioPlaybackState.js` |

### 9. What NOT to regress

These were hard-won fixes; an agent should read related commits before changing:

- **Ancient video on mobile** — probe + optimistic render + merge fallback for `ancient_video_url`
- **Audio after TikTok** — manual Play/Pause; no auto-resume on `visibilitychange`
- **Slider loop** — normal-speed loop after first play, not frozen last-frame hold
- **Poster framing** — `object-fit: cover`, 16:9 frame, hero frame at ~3 s
- **Card reopen FAB** — `z-[200]` + safe-area `bottom` offset
- **Audio-visual sync** — buffer before play, 250 ms delay before `AUDIO_SYNC_TRIGGER`
- **Stale sync cancel** — `syncGeneration` incremented on `stop()`

### 10. Commit / PR workflow for agents

```bash
git checkout main
git pull origin main
git checkout -b cursor/<descriptive-name>-a224
# ... implement ...
npm test && npm run build
git add <files>
git commit -m "Clear descriptive message"
git push -u origin cursor/<descriptive-name>-a224
# Open/update PR against main
```

---

## Build History (Milestone Commits)

| Commit theme | What shipped |
|--------------|--------------|
| Project setup | Vite/React/Tailwind scaffold, Mapbox map |
| Geolocation | TRANSIT/ARRIVAL states, debug geo |
| Waypoint card | Arrival UI, orientation hint |
| Slider v1 | Before/after compare, local assets |
| Video slider | Matched modern/ancient MP4 layers |
| Poster compare | Freeze → poster stills → drag mode |
| Audio orchestrator | Multi-mode, visual sync, prefetch |
| Supabase | Fetch + merge with local seed |
| Mobile hardening | Ancient video probe, card reopen, audio resume |
| Loop + play/pause | Normal-speed loop, unified audio toggle below CTAs |

---

## Quick Reference

```bash
# Dev
cd chronowalk && npm run dev

# Test
npm test

# Build
npm run build

# Phone test URL
https://<your-netlify-site>/?debugGeo=true
```

**Primary test waypoint:** `colosseum`  
**Primary audio event:** `AUDIO_SYNC_TRIGGER`  
**Primary geo threshold:** 30 m arrival, 200 m audio prefetch
