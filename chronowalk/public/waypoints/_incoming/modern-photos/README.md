# Modern-day waypoint photos

Drop your **current modern-day JPEGs** here, then run:

```bash
npm run install:modern-photos
```

The installer copies each file into the matching `public/waypoints/...` folder as:

- `modern-exterior.jpg` — full photo (max 2400px wide)
- `modern-poster.jpg` — 16:9 hero crop for cards and launch UI

It also refreshes `public/tour-hero.jpg` from the Colosseum exterior shot.

## Required filenames

Match these names exactly (based on the photos you provided):

| Save as | Waypoint(s) |
|---------|-------------|
| `colosseum-exterior.jpg` | Colosseum exterior |
| `colosseum-interior.jpg` | Colosseum interior |
| `palatine-hill.jpg` | Palatine Hill + Capitoline Hill |
| `trajan-market.jpg` | Trajan's Market |
| `pantheon.jpg` | Pantheon |
| `trevi-fountain.jpg` | Trevi Fountain |
| `largo-argentina.jpg` | Largo Argentina |
| `piazza-navona.jpg` | Piazza Navona + Campo de' Fiori |
| `appian-way.jpg` | Appian Way (`via-appia/`) |
| `forum-arch-titus.jpg` | Arch of Titus |
| `forum-basilica-maxentius.jpg` | Basilica of Maxentius |
| `forum-via-sacra.jpg` | Via Sacra |
| `forum-temple-vesta.jpg` | Temple of Vesta |
| `forum-rostra.jpg` | The Rostra |
| `forum-temple-saturn.jpg` | Temple of Saturn |
| `forum-curia-julia.jpg` | Curia Julia |
| `forum-arch-severus.jpg` | Arch of Septimius Severus |

## Optional (add when you have them)

| Save as | Waypoint |
|---------|----------|
| `castel-sant-angelo.jpg` | Castel Sant'Angelo |
| `circus-maximus.jpg` | Circus Maximus |

## After installing

```bash
npm run verify-all-waypoints   # check for duplicate/wrong media
npm run dev
```

Bump `media_cache_version` in the matching `src/data/*.js` seed if phones should refetch cached images.
