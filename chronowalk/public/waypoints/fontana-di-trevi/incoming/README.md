# Fontana di Trevi — incoming media

This stop uses **modern video only** (no ancient reconstruction slider).

## Root deliverables

| File | Role |
|------|------|
| `modern-exterior.jpg` | Card hero + video poster |
| `modern.mp4` | Immersive modern animated video |
| `modern-poster.jpg` | Optional hero frame after playback |
| `geocache-arrival-alert.wav` | Arrival chime |
| `Audio_sample.mp3` | Placeholder narration until final mix |

Drop **one** modern source file here (no ancient clip for this stop):

| File | Maps to |
|------|---------|
| `modern-source.mp4` | `../modern.mp4` |

Also accepted: `now_from_that*.mp4`, `*modern*.mp4`

Then run:

```bash
npm run process-waypoint -- fontana-di-trevi
```

**Quick path** (already-encoded video, skip ffmpeg):

```bash
cp public/waypoints/fontana-di-trevi/local-backup/modern.mp4 public/waypoints/fontana-di-trevi/
cp public/waypoints/fontana-di-trevi/local-backup/modern-exterior.jpg public/waypoints/fontana-di-trevi/
```

Seed: `src/data/fontana-di-trevi.js`
