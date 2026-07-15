# Landing cinematic masters (optional)

Drop full-resolution dusk / blue-hour Rome plates here, then run:

```bash
npm run prepare:landing-cinematic
```

## Expected filenames

| File | Landing slot | Suggested subject (from your set) |
|------|--------------|-----------------------------------|
| `hero.jpg` | Hero full-bleed | Aerial Tiber / Colosseum dusk panorama, or Forum+Colosseum twilight |
| `interlude.jpg` | Act I cinematic interlude | Lit Colosseum facade at blue hour |
| `after-rome.jpg` | After Rome memory | Castel Sant’Angelo reflection, Campo de’ Fiori night, or Trastevere |
| `ending.jpg` | Final cinematic ending | Victor Emmanuel vista, Trevi night, or Forum light-trail plate |

≥1920×1080 preferred. The script writes desktop (16:9), mobile (4:5), WebP, AVIF, and LQIP under `../<slot>/`.

If a master is missing, the script falls back to distinct in-repo waypoint / landing plates so hero / interlude / After Rome / ending never share one photo again.
