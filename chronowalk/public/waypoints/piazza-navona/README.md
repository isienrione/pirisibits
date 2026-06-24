# Piazza Navona waypoint assets

**Status:** 🟡 Scaffold — placeholder media copied from Pantheon until Navona-specific AI assets are produced.

**Ancient site:** Stadium of Domitian (Circus Agonalis) under today's baroque piazza.  
**Viewpoint:** South edge of the oval, facing north (`41.89878, 12.47302`, pitch 18°).

**Tour test:** `?debugGeo=true` (full 3-stop tour) or `?debugGeo=true&debugStop=piazza-navona`  
**Single-stop debug:** `?singleWaypoint=piazza-navona&debugGeo=true`  
**Asset Studio (prompts):** http://localhost:5173/?assetStudio=true&waypoint=piazza-navona  

## Deliverables

| File | Role | Status |
|------|------|--------|
| `modern-exterior.jpg` | Modern still fallback | 🟡 placeholder |
| `modern.mp4` | Modern slider video | 🟡 placeholder |
| `modern-poster.jpg` | Compare-mode hero frame (@ 3 s) | 🟡 placeholder |
| `ancient-reconstruction.mp4` | Ancient slider video | 🟡 placeholder |
| `ancient-reconstruction.jpg` | Ancient still fallback | 🟡 placeholder |
| `ancient-poster.jpg` | Compare + ghost alignment | 🟡 placeholder |

Verify locally: `npm run verify-waypoint -- piazza-navona`

## Production steps

1. Export `modern-exterior.jpg` from Street View at viewpoint in `src/data/piazza-navona.js`
2. Open Asset Studio → copy Runway / Midjourney prompts
3. Drop Runway sources in `incoming/` (see `incoming/README.md`)
4. `npm run process-waypoint -- piazza-navona`
5. Replace `Audio_sample.mp3` with recorded narration when ready

Seed file: `src/data/piazza-navona.js`

See [WAYPOINT_PLAYBOOK.md](../../WAYPOINT_PLAYBOOK.md) for the full repeatable workflow.
