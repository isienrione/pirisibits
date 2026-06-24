# Pantheon waypoint assets

**Viewpoint:** Piazza della Rotonda fountain, facing the portico  
**Street View:** see `PANTHEON_STREET_VIEW_URL` in `src/data/pantheon.js`

## Ready

- [x] `modern-exterior.jpg` — exported from Google Street View reference

## Generate via Asset Studio

```
?assetStudio=true&waypoint=pantheon
```

## Still needed

- [ ] `modern.mp4` — Runway/Pika (~5 s, locked camera)
- [ ] `modern-poster.jpg` — export at ~3 s
- [ ] `ancient-reconstruction.jpg` — Midjourney (modern photo as reference)
- [ ] `ancient-reconstruction.mp4` — Runway motion-sync
- [ ] `ancient-poster.jpg` — pad to 16:9 if needed
- [ ] `depth-map.png` — optional
- [ ] `Audio_sample.mp3`, `geocache-arrival-alert.wav`, narration MP3s

## Test

```
?assetStudio=true&waypoint=pantheon
?debugGeo=true   (after wiring pantheon in App or temporary GPS override)
```
