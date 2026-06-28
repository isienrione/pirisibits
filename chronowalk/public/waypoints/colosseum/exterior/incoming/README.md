# Colosseum exterior — incoming media

Drop source clips here (or in legacy `colosseum/incoming/` — auto-migrated on run).

```bash
cd chronowalk
git pull   # ensure latest process script
npm run process-waypoint -- colosseum
```

**Updating only the ancient reconstruction?**  
Put just `ancient-source.mp4` here. The script reuses the existing `modern.mp4` in this folder.

| Incoming | Output |
|----------|--------|
| `ancient-source.mp4` | `ancient-reconstruction.mp4` + posters |
| `modern-source.mp4` | `modern.mp4` + posters |

After processing, bump `media_cache_version` in `src/data/colosseum.js` so phones refetch the clip.
