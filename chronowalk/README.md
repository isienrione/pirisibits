# ChronoWalk

A mobile-first walking tour of Rome that combines GPS guidance, place-aware audio, and cinematic then-and-now visual reveals at each landmark.

## App overview

ChronoWalk guides you on foot between historic sites. When you arrive at a stop, the app:

1. Detects your position with GPS geofencing
2. Plays an arrival moment (audio + optional visual pulse on the map)
3. Opens a landmark card with audio stories and an immersive compare slider

**Main tabs** (after starting the tour):

| Tab | Purpose |
|-----|---------|
| **Tour** | Journey progress, current/next stop, quick link to the map |
| **Map** | Mapbox walking map with route, geofences, and HUD |
| **Stops** | Premium list of all landmarks on the route |
| **Settings** | Location status, audio toggle, reduced motion, debug map |

**URL modes** (for development):

| Query param | Effect |
|-------------|--------|
| `?debugGeo=true` | Simulates GPS at the current target landmark |
| `?debugMap=true` | Shows GPS / geofence debug overlays on the map |
| `?singleWaypoint=colosseum` | Single-stop test mode |
| `?assetStudio=true&waypoint=colosseum` | Creator asset prompt studio |
| `?resetTour=true` | Clears saved tour progress |

## Design direction

ChronoWalk uses a **luxury travel** visual language:

- **Warm white** surfaces, **deep slate** text, **gold** accents, **terracotta** primary actions
- **Fraunces** display type + **DM Sans** UI type
- Glass panels, floating bottom navigation (mobile), left icon rail (desktop)
- Cinematic arrival moments and bottom-sheet landmark cards
- Respects `prefers-reduced-motion` for animations

## Local setup

**Requirements:** Node.js 20+, npm

```bash
cd chronowalk
cp .env.example .env
# Edit .env — at minimum set VITE_MAPBOX_TOKEN
npm install
npm run dev
```

Open `http://localhost:5173` on your machine, or use your LAN IP on a phone (the dev server binds to `0.0.0.0`).

**Production build:**

```bash
npm run build
npm run preview
```

**Tests:**

```bash
npm test
```

## Environment variables

Copy `.env.example` to `.env` in the `chronowalk/` directory.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_MAPBOX_TOKEN` | **Yes** (for map) | Mapbox public access token |
| `VITE_DEBUG_GEO` | No | `true` → teleport GPS to Rome in dev |
| `VITE_DEBUG_MAP` | No | `true` → show map debug overlays by default |
| `VITE_ASSET_STUDIO` | No | `true` → enable asset studio mode |
| `VITE_SUPABASE_URL` | No | Supabase project URL for remote waypoint data |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anon key |
| `VITE_CDN_BASE_URL` | No | Prefix for large media hosted on a CDN |
| `VITE_API_BASE_URL` | No | Reserved for future API integration |

On Netlify (or similar), set the same `VITE_*` variables in the site environment and redeploy. URL query params can override several debug flags without redeploying.

## Mapbox setup

1. Create a free account at [mapbox.com](https://www.mapbox.com/)
2. Copy your **public** access token (starts with `pk.`)
3. Add to `chronowalk/.env`:

   ```
   VITE_MAPBOX_TOKEN=pk.your_token_here
   ```

4. Restart `npm run dev`

The map uses the `mapbox://styles/mapbox/dark-v11` style. Walking routes are fetched via the Mapbox Directions API when you transit between stops.

If the token is missing, the app shows a clear setup message instead of a blank screen.

## Architecture notes

Heavy modules are **lazy-loaded** to keep the initial bundle small:

- **Mapbox map** (`TourMap`) — loaded after tour start
- **Waypoint asset studio** — only when `?assetStudio=true`
- **Compare slider** (`BeforeAfterSlider`) — loaded when a landmark reveal opens

`ErrorBoundary` components wrap map, slider, and landmark card surfaces with retry-friendly fallbacks.

## Known limitations

- **GPS accuracy** — Arrival detection depends on device GPS; dense urban canyons and permission denials affect reliability. Use `?debugGeo=true` for desk testing.
- **Mobile Safari audio** — Browsers may pause audio when the tab is backgrounded; the app surfaces a resume hint when playback is interrupted.
- **Media weight** — Full-quality video/image pairs per landmark are large; some stops use placeholders until assets are published. Optional `VITE_CDN_BASE_URL` offloads media.
- **Supabase optional** — Local seed data works without Supabase; remote rows merge with local defaults for missing media fields.
- **Single-threaded map** — The map stays mounted (but hidden) when switching tabs so GPS tracking continues; this trades memory for consistent geofencing.
- **PWA icons** — Manifest references `favicon.svg`; dedicated PNG app icons are not yet bundled.
- **Captions** — Transcript UI is a placeholder; timed captions will sync with narration in a future release.

## Further reading

- `CHRONOWALK_BUILD_STATE.md` — detailed technical state and data model
- `WAYPOINT_PLAYBOOK.md` — content production for new stops
- `WAYPOINT_ASSET_PIPELINE.md` — media processing workflow
