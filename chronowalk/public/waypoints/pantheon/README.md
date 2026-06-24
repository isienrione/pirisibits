# Pantheon waypoint assets

**Viewpoint:** Mid-piazza facing the portico (compact site — not the wide fountain fisheye).  
**Street View (target POV):** `?api=1&map_action=pano&viewpoint=41.89862,12.47687&heading=3&pitch=18`

## Ready

- [x] `modern-exterior.jpg` — closer frontal reference, cropped to **1280×720 (16:9)** to match Colosseum
  - Source: [Wikimedia — Rome Pantheon front](https://commons.wikimedia.org/wiki/File:Rome_Pantheon_front.jpg) (Robert Dragan, CC BY 2.5)
  - Replace with your own on-site or Street View export when available

## Generate via Asset Studio

```
?assetStudio=true&waypoint=pantheon
```

Framing profile: `compact_piazza` (ideal offset 18–45 m from landmark center, not Colosseum’s 145 m).

## Still needed

- [ ] `modern.mp4` — Runway/Pika (~5 s, locked camera)
- [ ] `modern-poster.jpg` — export at ~3 s
- [ ] `ancient-reconstruction.jpg` — Midjourney (modern photo as reference)
- [ ] `ancient-reconstruction.mp4` — Runway motion-sync
- [ ] `ancient-poster.jpg` — pad to 16:9 if needed
- [ ] `depth-map.png` — optional

## Why the first image looked too far

The original Street View pano was a **wide fisheye from the fountain** with **0 m** viewpoint offset and **10.5°** pitch. Colosseum uses a **mid-approach** shot at **~145 m** offset and **18.1°** pitch. Pantheon’s piazza is smaller, so the target is **~26 m** offset and **18°** pitch — monument fills the frame, not the whole square.
