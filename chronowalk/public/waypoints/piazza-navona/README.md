# Piazza Navona waypoint assets

**Ancient site:** Stadium of Domitian (Circus Agonalis) under today's baroque piazza.  
**Viewpoint:** South edge of the oval, facing north (`41.89878, 12.47302`, pitch 18°).

**Tour test:** `?debugGeo=true` (full tour) or `?debugGeo=true&debugStop=piazza-navona`  
**Single-stop debug:** `?singleWaypoint=piazza-navona&debugGeo=true`  
**Asset Studio (prompts):** http://localhost:5173/?assetStudio=true&waypoint=piazza-navona  

## Deliverables

| File | Role |
|------|------|
| `modern-exterior.jpg` | Modern still fallback |
| `modern.mp4` | Modern slider video |
| `modern-poster.jpg` | Compare-mode hero frame (@ 3 s) |
| `ancient-reconstruction.mp4` | Ancient slider video |
| `ancient-reconstruction.jpg` | Ancient still fallback |
| `ancient-poster.jpg` | Compare + ghost alignment |

Verify locally: `npm run verify-waypoint -- piazza-navona`

Seed file: `src/data/piazza-navona.js`

See [WAYPOINT_PLAYBOOK.md](../../WAYPOINT_PLAYBOOK.md) and [TOUR_TEST_LINKS.md](../../TOUR_TEST_LINKS.md).
