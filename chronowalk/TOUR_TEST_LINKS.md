# ChronoWalk — Test & tour links

**Bookmark page** for local dev (`npm run dev`) and Netlify.  
Master workflow: [WAYPOINT_PLAYBOOK.md](./WAYPOINT_PLAYBOOK.md)

Replace `localhost:5173` with `https://YOUR-SITE.netlify.app` on device.

---

## Cumulative tour — full map (6 stops + walking routes)

| Goal | Local URL |
|------|-----------|
| **Fresh tour from Colosseum** | http://localhost:5173/?resetTour=true&debugGeo=true |
| **Resume saved progress** | http://localhost:5173/?debugGeo=true |
| **Fresh tour + media debug** | http://localhost:5173/?resetTour=true&debugGeo=true&debugMedia=true |

Tour order: **Colosseum → Capitoline Hill → Pantheon → Largo Argentina → Campo de' Fiori → Piazza Navona → Castel Sant'Angelo** (`rome-core`).  
Map shows all stop markers, geofence zones, and Mapbox walking legs between consecutive stops.

---

## Jump to a stop on the full tour map

Use when you want the **cumulative map** but arrive at a specific stop (prior stops marked completed).

| Stop | `debugStop` | Local URL |
|------|-------------|-----------|
| Colosseum | `colosseum` | http://localhost:5173/?debugGeo=true&debugStop=colosseum |
| Capitoline Hill | `capitoline-hill` | http://localhost:5173/?debugGeo=true&debugStop=capitoline-hill |
| Pantheon | `pantheon` | http://localhost:5173/?debugGeo=true&debugStop=pantheon |
| Largo Argentina | `largo-argentina` | http://localhost:5173/?debugGeo=true&debugStop=largo-argentina |
| Campo de' Fiori | `campo-de-fiori` | http://localhost:5173/?debugGeo=true&debugStop=campo-de-fiori |
| Piazza Navona | `piazza-navona` | http://localhost:5173/?debugGeo=true&debugStop=piazza-navona |
| Castel Sant'Angelo | `castel-sant-angelo` | http://localhost:5173/?debugGeo=true&debugStop=castel-sant-angelo |

With media URL debug footer on the card: add `&debugMedia=true`.

---

## Single-stop only (fastest slider / asset check)

One marker, no tour HUD. **Best for testing a stop’s slider after processing assets.**

| Stop | Local URL |
|------|-----------|
| Colosseum | http://localhost:5173/?singleWaypoint=colosseum&debugGeo=true |
| Capitoline Hill | http://localhost:5173/?singleWaypoint=capitoline-hill&debugGeo=true |
| Pantheon | http://localhost:5173/?singleWaypoint=pantheon&debugGeo=true |
| Largo Argentina | http://localhost:5173/?singleWaypoint=largo-argentina&debugGeo=true |
| Campo de' Fiori | http://localhost:5173/?singleWaypoint=campo-de-fiori&debugGeo=true |
| Piazza Navona | http://localhost:5173/?singleWaypoint=piazza-navona&debugGeo=true |
| Castel Sant'Angelo | http://localhost:5173/?singleWaypoint=castel-sant-angelo&debugGeo=true |

Add `&debugMedia=true` to see exact `modern` / `ancient` URLs on the card.

---

## Asset Studio — AI prompts per stop

| Stop | Local URL |
|------|-----------|
| Colosseum | http://localhost:5173/?assetStudio=true&waypoint=colosseum |
| Capitoline Hill | http://localhost:5173/?assetStudio=true&waypoint=capitoline-hill |
| Pantheon | http://localhost:5173/?assetStudio=true&waypoint=pantheon |
| Largo Argentina | http://localhost:5173/?assetStudio=true&waypoint=largo-argentina |
| Campo de' Fiori | http://localhost:5173/?assetStudio=true&waypoint=campo-de-fiori |
| Piazza Navona | http://localhost:5173/?assetStudio=true&waypoint=piazza-navona |
| Castel Sant'Angelo | http://localhost:5173/?assetStudio=true&waypoint=castel-sant-angelo |

Each page: framing check, Street View link, copy-paste Runway/Midjourney/DaVinci prompts, deliverable paths.

**Note:** `?waypoint=` is **Asset Studio only** — it does **not** set tour or single-stop mode.

---

## Raw media files (bypass the app)

Confirm files on disk before blaming the slider:

| Stop | Modern video | Modern still |
|------|--------------|--------------|
| Colosseum | http://localhost:5173/waypoints/colosseum/moderncolosseum.mp4 | http://localhost:5173/waypoints/colosseum/modern-exterior.jpg |
| Pantheon | http://localhost:5173/waypoints/pantheon/modern.mp4 | http://localhost:5173/waypoints/pantheon/modern-exterior.jpg |
| Capitoline Hill | http://localhost:5173/waypoints/capitoline-hill/modern.mp4 | http://localhost:5173/waypoints/capitoline-hill/modern-exterior.jpg |
| Largo Argentina | http://localhost:5173/waypoints/largo-argentina/modern.mp4 | http://localhost:5173/waypoints/largo-argentina/modern-exterior.jpg |
| Campo de' Fiori | http://localhost:5173/waypoints/campo-de-fiori/modern.mp4 | http://localhost:5173/waypoints/campo-de-fiori/modern-exterior.jpg |
| Piazza Navona | http://localhost:5173/waypoints/piazza-navona/modern.mp4 | http://localhost:5173/waypoints/piazza-navona/modern-exterior.jpg |
| Castel Sant'Angelo | http://localhost:5173/waypoints/castel-sant-angelo/modern.mp4 | http://localhost:5173/waypoints/castel-sant-angelo/modern-exterior.jpg |

---

## Process expansion stops (MP4s in `incoming/`)

Put **`modern-exterior.jpg`** in each waypoint **root**. Put **`modern-source.mp4`** and **`ancient-source.mp4`** in **`incoming/`**, then:

```bash
npm run process-expansion-waypoints
```

Stops: `capitoline-hill`, `largo-argentina`, `campo-de-fiori`, `castel-sant-angelo`.  
One stop: `npm run process-waypoint -- castel-sant-angelo`

**Wrong folder names?** See [FIX_EXPANSION_MEDIA.md](./docs/FIX_EXPANSION_MEDIA.md) — run `npm run fix-expansion-folders` from `chronowalk/` (not `scripts/`).

---

## URL parameter reference

| Param | Purpose |
|-------|---------|
| `debugGeo=true` | Fake GPS at current target stop (required for desktop testing) |
| `resetTour=true` | Clear `localStorage` tour progress; start at Colosseum |
| `debugStop=<id>` | Full tour map, but start at that stop (overrides saved progress) |
| `singleWaypoint=<id>` | Tour off — only that stop |
| `assetStudio=true` | Open prompt generator UI |
| `waypoint=<id>` | **With assetStudio only** — which stop’s prompts |
| `debugMedia=true` | Show resolved slider URLs on waypoint card |
| `showScript=true` | Show arrival/transit narration text in UI |
| `menuSide=left` or `menuSide=right` | Home menu drawer side |
| `posterAt=3` | Tune hero poster frame (seconds) |
| `loopMs=10000` | Tune post-animation loop (ms) |

**Do not use** `?waypoint=pantheon` for tour testing — use `singleWaypoint` or `debugStop`.

---

## Netlify templates

```
https://YOUR-SITE.netlify.app/?resetTour=true&debugGeo=true
https://YOUR-SITE.netlify.app/?debugGeo=true&debugStop=piazza-navona
https://YOUR-SITE.netlify.app/?singleWaypoint=piazza-navona&debugGeo=true
https://YOUR-SITE.netlify.app/?assetStudio=true&waypoint=piazza-navona
```

Push `public/waypoints/<id>/` media to git before expecting new assets on Netlify.

---

## Terminal commands (from `chronowalk/`)

```bash
npm run dev
npm run verify-piazza-navona      # or verify-waypoint -- <id>
npm run process-piazza-navona     # literal mapping (not Pantheon swap)
npm test
```

You are usually **already in** `chronowalk/` — do not `cd chronowalk` again if that errors.
