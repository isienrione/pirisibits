# Pantheon waypoint assets

**Viewpoint:** Mid-piazza facing the portico (`41.89862, 12.47687`, pitch 18°).  
**Tour test:** `?waypoint=pantheon&debugGeo=true`  
**Asset Studio:** `?assetStudio=true&waypoint=pantheon`

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
# Drop sources in incoming/, then:
brew install ffmpeg   # one-time
npm run process-pantheon
```

Seed file: `src/data/pantheon.js` — URLs already point at the paths above.
