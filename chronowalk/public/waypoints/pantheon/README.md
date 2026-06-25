# Pantheon waypoint assets

**Viewpoint:** Mid-piazza facing the portico (`41.89862, 12.47687`, pitch 18°).  
**Tour test:** `?debugGeo=true` (full tour) or `?debugGeo=true&debugStop=pantheon` (start at Pantheon, full route visible)  
**Single-stop debug:** `?singleWaypoint=pantheon&debugGeo=true`  
**Asset Studio (prompts):** http://localhost:5173/?assetStudio=true&waypoint=pantheon  

## Deliverables

| File | Role |
|------|------|
| `modern-exterior.jpg` | Modern still fallback |
| `modern.mp4` | Modern slider video |
| `modern-poster.jpg` | Compare-mode hero frame (@ 3 s) |
| `ancient-reconstruction.mp4` | Ancient slider video |
| `ancient-reconstruction.jpg` | Ancient still fallback (frame 0) |
| `ancient-poster.jpg` | Compare + ghost alignment (@ 3 s) |

Verify locally: `npm run verify-pantheon`

## Regenerate from Runway sources

```bash
# Drop sources in incoming/ (see incoming/README.md for swap note), then:
npm run process-pantheon
```

**Note:** Runway filenames are misleading — `*Ancient*Pantheon*` is the **modern** piazza clip; `now_from_that*` is the **ancient** animation. The script maps by content.


Seed file: `src/data/pantheon.js` — URLs already point at the paths above.
