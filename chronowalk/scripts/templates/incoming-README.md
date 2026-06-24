# Incoming — raw AI exports for <WAYPOINT_ID>

```bash
npm run process-waypoint -- <WAYPOINT_ID>
```

## Default mapping (all waypoints except Pantheon)

| Incoming file | Output | Content |
|---------------|--------|---------|
| `modern-source.mp4` | `modern.mp4` | Today's site |
| `ancient-source.mp4` | `ancient-reconstruction.mp4` | Ancient reconstruction |

**Pantheon only:** use `npm run process-pantheon` (enables `SWAP_RUNWAY=1` for misleading Runway names).

Also export `modern-exterior.jpg` from Street View — see Asset Studio link in `README.md`.

Do **not** copy `.jpg` / `.mp4` files from `colosseum/` or `pantheon/` — verify will warn if files are identical.
