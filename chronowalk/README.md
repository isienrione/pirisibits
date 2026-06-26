# ChronoWalk

A mobile-first walking tour of Rome that combines GPS guidance, place-aware audio, and cinematic then-and-now visual reveals at each landmark.

## App overview

ChronoWalk guides you on foot between historic sites. When you arrive at a stop, the app:

1. Detects your position with GPS geofencing
2. Plays an arrival moment (audio + gold map pulse)
3. Opens a landmark card with immersive audio, then-and-now slider, and walking guidance

**Main tabs** (after starting the tour):

| Tab | Purpose |
|-----|---------|
| **Tour** | Journey progress, current/next stop, link to map |
| **Map** | Light Mapbox map with terracotta route, geofences, and HUD |
| **Stops** | Premium stop list with visited / current / locked states |
| **Settings** | Location, audio, reduced motion, debug map |

**URL modes** (development):

| Query param | Effect |
|-------------|--------|
| `?debugGeo=true` | Simulates GPS at the current target landmark |
| `?debugMap=true` | Shows GPS / geofence debug overlays on the map |
| `?singleWaypoint=colosseum` | Single-stop test mode |
| `?assetStudio=true&waypoint=colosseum` | Creator asset prompt studio |
| `?resetTour=true` | Clears saved tour progress |

## Design direction

ChronoWalk uses a **luxury travel** visual language:

- **Warm white** surfaces, **deep slate** text, **gold** progress accents, **terracotta** primary actions
- **Fraunces** display type + **DM Sans** UI type
- Glass panels, floating bottom navigation (mobile), left icon rail (desktop)
- Cinematic arrival moments, dark audio player, bottom-sheet landmark cards
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

**Lint:**

```bash
npm run lint
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

The map uses the **light** Mapbox style (`light-v11`) with dashed terracotta tour routes and solid terracotta active walking legs. Walking paths are fetched via the Mapbox Directions API when you transit between stops.

If the token is missing or invalid, the app shows a clear setup or recovery message instead of a blank screen.

## Production architecture

Heavy modules are **lazy-loaded** so the initial bundle stays small (~75 KB gzip for core JS):

| Chunk | Loaded when |
|-------|-------------|
| `index` | App shell, hero, navigation, HUD |
| `mapbox` | After tour start (Map tab) |
| `WaypointCard` | Prefetched on Start Tour |
| `BeforeAfterSlider` | Landmark reveal opens |
| `WaypointAssetStudio` | `?assetStudio=true` only |
| `supabase` | Remote waypoint fetch (if configured) |

**Error boundaries** wrap the map, landmark card, compare slider, and asset studio with retry UI.

**Loading states** use accessible `LoadingPanel` spinners for map init, chunk fetch, and slider media.

Vite `manualChunks` splits Mapbox, compare-slider, and Supabase into separate files. Mapbox remains the largest chunk (~492 KB gzip) and only loads when the map is needed.

## Known limitations

- **GPS accuracy** — Arrival detection depends on device GPS; dense urban canyons and permission denials affect reliability. Use `?debugGeo=true` for desk testing.
- **Mobile Safari audio** — Browsers may pause audio when the tab is backgrounded; the app surfaces a resume hint when playback is interrupted.
- **Media weight** — Full-quality video/image pairs per landmark are large; some stops use placeholders until assets are published. Optional `VITE_CDN_BASE_URL` offloads media.
- **Supabase optional** — Local seed data works without Supabase; remote rows merge with local defaults for missing media fields.
- **Map memory** — The map stays mounted (hidden off-tab) so GPS and geofencing continue when switching tabs.
- **PWA icons** — Manifest uses `favicon.svg`; dedicated PNG app icons are not bundled.
- **Captions** — Transcript UI is a placeholder; timed captions will sync with narration in a future release.
- **Tour stats** — Completion distance is a straight-line estimate across visited legs, not logged pedometer data.

## Further reading

- `CHRONOWALK_BUILD_STATE.md` — detailed technical state and data model
- `WAYPOINT_PLAYBOOK.md` — content production for new stops
- `WAYPOINT_ASSET_PIPELINE.md` — media processing workflow
