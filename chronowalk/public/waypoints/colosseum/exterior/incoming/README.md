# Colosseum exterior — incoming media

Drop source clips here, then run:

```bash
npm run process-waypoint -- colosseum
```

Deliverables are written to `public/waypoints/colosseum/exterior/`:

| Incoming | Output |
|----------|--------|
| `ancient-source.mp4` | `ancient-reconstruction.mp4` + posters |
| `modern-source.mp4` | `modern.mp4` + posters |

`modern-exterior.jpg` stays at the waypoint root or can be added to `exterior/` manually (Street View still at viewpoint).

After processing, bump `media_cache_version` in `src/data/colosseum.js` if browsers still show an old clip.
