# Ambient beds (Layer 2)

Looping zone beds played live by `AudioEngine` — never baked into narration.

| File | Zone | Where it plays (production plan) | Status |
|------|------|----------------------------------|--------|
| `bed_antiquity.mp3` | `antiquity` | Colosseum → Palatine → Forum → Trajan; Circus / Appia | *missing — zone assignment TBD* |
| `bed_river.mp3` | `river` | Castel approach (`t16`) + Castel Sant'Angelo finale (`w21`) | *missing — zone assignment TBD* |
| `bed_centro.mp3` | `centro` | Steps → Trevi → Pantheon exterior → Navona → Largo | *missing* |
| `bed_underworld.mp3` | `underworld` | Reserved *(unused while Colosseum uses antiquity)* | *missing* |
| `bed_pantheon_interior.mp3` | `pantheon_interior` | Pantheon interior stop (`w23`) | *missing* |

Temporary stand-in loops were removed until beds are assigned correctly. The engine skips a bed when its file cannot be loaded, so narration still plays without ambience.

Beds loop for continuity. Engine mix (`src/audio/mix.config.js`): **`idleDb` ≈ −24 dB** while walking / silent (fill-in), **`duckedDb` ≈ −42 dB** under voice narration (faint background). When masters land, normalize to roughly **−12 to −9 dB mean** (peak near −1 dBFS) before the engine gain. Same filenames, 60–90 s seamless loops.
