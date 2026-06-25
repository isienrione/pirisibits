# Incoming — raw AI exports for capitoline-hill

```bash
npm run process-waypoint -- capitoline-hill
# Or batch all expansion stops:
npm run process-expansion-waypoints
```

## Folder layout

```
public/waypoints/capitoline-hill/
  modern-exterior.jpg              ← waypoint ROOT (Gemini Prompt 1 still)
  ancient-reconstruction.jpg       ← optional at ROOT (Prompt 3; else extracted from video)
  incoming/
    modern-source.mp4              ← Prompt 2 export
    ancient-source.mp4             ← Prompt 4 export
```

After `process-waypoint`, the script writes to the **waypoint root**:

- `modern.mp4`, `ancient-reconstruction.mp4`
- `modern-poster.jpg`, `ancient-poster.jpg`
- `ancient-reconstruction.jpg` (from video if not provided)

## Default mapping (not Pantheon)

| Incoming | Output |
|----------|--------|
| `modern-source.mp4` | `modern.mp4` |
| `ancient-source.mp4` | `ancient-reconstruction.mp4` |

**Pantheon only:** `npm run process-pantheon` (SWAP_RUNWAY=1).

Do **not** copy media from `colosseum/` or `pantheon/` — verify warns on identical files.
