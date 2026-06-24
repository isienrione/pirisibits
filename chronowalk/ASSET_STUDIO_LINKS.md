# Asset Studio — prompt links per waypoint

**AI prompt generator** — Runway, Midjourney, DaVinci copy-paste prompts from each stop’s seed file.

**Also see:** [TOUR_TEST_LINKS.md](./TOUR_TEST_LINKS.md) for full tour map, single-stop, and raw media URLs.

Run `npm run dev` first. Replace `localhost:5173` with your Netlify host on device.

---

## Asset Studio links

| Stop | `id` | Open prompts |
|------|------|--------------|
| Colosseum | `colosseum` | http://localhost:5173/?assetStudio=true&waypoint=colosseum |
| Pantheon | `pantheon` | http://localhost:5173/?assetStudio=true&waypoint=pantheon |
| Piazza Navona | `piazza-navona` | http://localhost:5173/?assetStudio=true&waypoint=piazza-navona |

`?waypoint=` works **only with** `?assetStudio=true` — not for tour mode.

---

## Quick test links (after assets ready)

| Goal | URL |
|------|-----|
| **Navona slider only** | http://localhost:5173/?singleWaypoint=piazza-navona&debugGeo=true |
| Navona + media URLs | http://localhost:5173/?singleWaypoint=piazza-navona&debugGeo=true&debugMedia=true |
| Full tour map → Navona | http://localhost:5173/?debugGeo=true&debugStop=piazza-navona |
| Full tour from Colosseum | http://localhost:5173/?resetTour=true&debugGeo=true |

Full tables: [TOUR_TEST_LINKS.md](./TOUR_TEST_LINKS.md)

---

## On each Asset Studio page

- Framing pass/fail
- **Open Street View at viewpoint** (for `modern-exterior.jpg` export)
- Modern reference preview
- Copy: modern video · ancient still · ancient video · DaVinci brief
- Deliverable path checklist

---

## New waypoint

1. Scaffold `src/data/<id>.js` — see [WAYPOINT_PLAYBOOK.md](./WAYPOINT_PLAYBOOK.md)
2. Add a row to the table above
3. Add test URLs to [TOUR_TEST_LINKS.md](./TOUR_TEST_LINKS.md)

```
http://localhost:5173/?assetStudio=true&waypoint=<your-new-id>
```
