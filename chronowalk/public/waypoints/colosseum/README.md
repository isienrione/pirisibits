# Colosseum waypoint assets

**Viewpoint (exterior):** Facade approach (`41.891275, 12.491202`, pitch 18.1°).  
**Asset Studio (prompts):** http://localhost:5173/?assetStudio=true&waypoint=colosseum  
**Tour test:** `?debugGeo=true` or `?debugStop=colosseum&debugGeo=true`

## Layout

| Subfolder | Role |
|-----------|------|
| `exterior/` | Tour stop — standard slider deliverables (modern + ancient) |
| `exterior/incoming/` | Drop `ancient-source.mp4` / `modern-source.mp4`, then `npm run process-waypoint -- colosseum` |
| `interior/` | Future interior experience (not wired to tour yet) |
| Root | Shared `Audio_sample.mp3` + `geocache-arrival-alert.wav` |

## Exterior deliverables

| File | Role |
|------|------|
| `exterior/modern-exterior.jpg` | Modern still fallback |
| `exterior/modern.mp4` | Modern slider video |
| `exterior/modern-poster.jpg` | Compare-mode hero frame (@ 3 s) |
| `exterior/ancient-reconstruction.mp4` | Ancient slider video |
| `exterior/ancient-reconstruction.jpg` | Ancient still fallback |
| `exterior/ancient-poster.jpg` | Compare alignment still |

Seed file: `src/data/colosseum.js`

See [ASSET_STUDIO_LINKS.md](../../ASSET_STUDIO_LINKS.md) for all waypoint prompt links.
