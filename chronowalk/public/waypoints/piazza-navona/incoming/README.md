# Incoming — raw AI exports for Piazza Navona

Drop Runway / Pika source files here, then run:

```bash
npm run process-piazza-navona
```

## Filename mapping (literal — name matches content)

| Drop in `incoming/` | Output | Era |
|---------------------|--------|-----|
| `ancient-source.mp4` | `ancient-reconstruction.mp4` + posters | Stadium of Domitian |
| `modern-source.mp4` | `modern.mp4` + `modern-poster.jpg` | Today (baroque piazza) |

If layers still look swapped after processing, your Runway downloads may use Pantheon-style misleading names — re-run with:

```bash
SWAP_RUNWAY=1 npm run process-piazza-navona
```

`*.mp4` and `*.mov` in this folder are gitignored.

Export `modern-exterior.jpg` from Street View (Asset Studio → **Open Street View at viewpoint**).
