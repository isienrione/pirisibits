# Piazza Navona waypoint assets

**Status:** Replace placeholder media — verify warns if files match pantheon/colosseum bytes.

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

1. Export `modern-exterior.jpg` from Street View (Asset Studio → **Open Street View at viewpoint**)
2. Put `modern-source.mp4` + `ancient-source.mp4` in `incoming/` (today = modern, ancient = Domitian)
3. `npm run process-piazza-navona` — must print **literal mapping**
4. `npm run verify-piazza-navona` — fix any `⚠ identical to pantheon` warnings
5. Hard-refresh browser or restart `npm run dev` before testing slider

Seed file: `src/data/piazza-navona.js`

See [WAYPOINT_PLAYBOOK.md](../../WAYPOINT_PLAYBOOK.md) and [TOUR_TEST_LINKS.md](../../TOUR_TEST_LINKS.md).
