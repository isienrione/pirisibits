# Asset Studio — prompt links per waypoint

**Asset Studio** is the in-app prompt generator. Open a link below while `npm run dev` is running (or on your deployed site). Each page shows copy-paste prompts for Runway, Midjourney, DaVinci, framing checks, and deliverable file paths.

**URL pattern:** `?assetStudio=true&waypoint=<id>`

Replace `localhost:5173` with your Netlify URL when testing on phone without a local server.

---

## All waypoints (bookmark these)

| Stop | `id` | Local dev (prompts ready) |
|------|------|---------------------------|
| Colosseum | `colosseum` | http://localhost:5173/?assetStudio=true&waypoint=colosseum |
| Pantheon | `pantheon` | http://localhost:5173/?assetStudio=true&waypoint=pantheon |
| Piazza Navona | `piazza-navona` | http://localhost:5173/?assetStudio=true&waypoint=piazza-navona |

### Test Piazza Navona only (fastest — not Colosseum)

| Goal | URL |
|------|-----|
| **Arrive at Navona immediately** | http://localhost:5173/?singleWaypoint=piazza-navona&debugGeo=true |
| Same + show media URLs | http://localhost:5173/?singleWaypoint=piazza-navona&debugGeo=true&debugMedia=true |
| Raw video file (no app) | http://localhost:5173/waypoints/piazza-navona/modern.mp4 |
| Full tour, jump to Navona | http://localhost:5173/?debugGeo=true&debugStop=piazza-navona |

Do **not** combine `resetTour=true` with `debugStop=` unless you pulled latest — older builds reset to Colosseum first.

### Deployed (swap in your Netlify host)

```
https://YOUR-SITE.netlify.app/?assetStudio=true&waypoint=colosseum
https://YOUR-SITE.netlify.app/?assetStudio=true&waypoint=pantheon
https://YOUR-SITE.netlify.app/?assetStudio=true&waypoint=piazza-navona
```

---

## What you get on each page

- Framing pass/fail (viewpoint offset + pitch)
- Street View deep link from seed `viewpoint`
- Modern reference image preview
- **Copy buttons:** modern video · ancient still · ancient video · DaVinci brief
- Deliverable path checklist (`public/waypoints/<id>/...`)

---

## When adding a new waypoint

1. Scaffold code (`src/data/<id>.js`, register in merge/geo/tour) — see [WAYPOINT_PLAYBOOK.md](./WAYPOINT_PLAYBOOK.md)
2. **Add a row to the table above** with `?assetStudio=true&waypoint=<id>`
3. Add the same line to `public/waypoints/<id>/README.md`
4. Open the link → prompts are generated automatically from the seed file

No separate “create link” step in code — the link is always:

```
http://localhost:5173/?assetStudio=true&waypoint=<your-new-id>
```

---

## Quick start

```bash
cd chronowalk
npm run dev
```

Then open: http://localhost:5173/?assetStudio=true&waypoint=piazza-navona
