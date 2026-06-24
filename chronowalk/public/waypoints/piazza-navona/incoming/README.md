# Incoming — raw AI exports for Piazza Navona

Drop Runway / Pika source files here, then run:

```bash
npm run process-waypoint -- piazza-navona
```

## Filename mapping (Runway labels are often backwards)

| Drop in `incoming/` | Output | Era |
|---------------------|--------|-----|
| `ancient-source.mp4` / `*Ancient*.mp4` | `modern.mp4` + `modern-poster.jpg` | Today (baroque piazza) |
| `modern-source.mp4` / `now_from_that*.mp4` | `ancient-reconstruction.mp4` + posters | Stadium of Domitian |

`*.mp4` and `*.mov` in this folder are gitignored.

You must still export `modern-exterior.jpg` manually from Street View at the viewpoint in `src/data/piazza-navona.js`.
