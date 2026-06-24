# Pantheon waypoint assets

**Viewpoint:** Mid-piazza facing the portico (compact site — not the wide fountain fisheye).  
**Street View (target POV):** `?api=1&map_action=pano&viewpoint=41.89862,12.47687&heading=3&pitch=18`

## Ready

- [x] `modern-exterior.jpg` — mid-piazza frontal reference (1280×720)
- [ ] Run `npm run process-pantheon` after dropping source MP4s in `incoming/` (see below)

## Source videos → processed deliverables

Copy your Runway exports into `incoming/`, then from `chronowalk/`:

```bash
npm run process-pantheon
```

| Incoming | Output |
|----------|--------|
| `ancient-source.mp4` | `ancient-reconstruction.mp4` + `.jpg` (frame 0) + `ancient-poster.jpg` (@ 3 s) |
| `modern-source.mp4` | `modern.mp4` + `modern-poster.jpg` (@ 3 s) |

## Generate via Asset Studio

```
?assetStudio=true&waypoint=pantheon
```

Framing profile: `compact_piazza` (ideal offset 18–45 m from landmark center, not Colosseum’s 145 m).

## Still needed (after `npm run process-pantheon`)

- [ ] `modern.mp4` + `modern-poster.jpg`
- [ ] `ancient-reconstruction.mp4` + `.jpg` + `ancient-poster.jpg`
- [ ] `depth-map.png` — optional

## Why the first image looked too far

The original Street View pano was a **wide fisheye from the fountain** with **0 m** viewpoint offset and **10.5°** pitch. Colosseum uses a **mid-approach** shot at **~145 m** offset and **18.1°** pitch. Pantheon’s piazza is smaller, so the target is **~26 m** offset and **18°** pitch — monument fills the frame, not the whole square.
