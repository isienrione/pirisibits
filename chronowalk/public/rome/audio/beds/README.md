# Ambient beds (Layer 2)

Looping zone beds played live by `AudioEngine` — never baked into narration.

| File | Zone | Where it plays (production plan) |
|------|------|----------------------------------|
| `bed_antiquity.mp3` | `antiquity` | Colosseum → Palatine → Forum → Trajan; Circus / Appia |
| `bed_river.mp3` | `river` | Castel approach (`t16`) + Castel Sant'Angelo finale (`w21`) |
| `bed_centro.mp3` | `centro` | Steps → Trevi → Pantheon exterior → Navona → Largo *(file still missing)* |
| `bed_underworld.mp3` | `underworld` | Reserved *(unused while Colosseum uses antiquity)* |
| `bed_pantheon_interior.mp3` | `pantheon_interior` | Pantheon interior stop (`w23`) *(file still missing)* |

Beds loop for continuity. Engine mix (`src/audio/mix.config.js`): **`idleDb` ≈ −24 dB** while walking / silent (fill-in), **`duckedDb` ≈ −42 dB** under voice narration (faint background). `bed_antiquity.mp3` and `bed_river.mp3` are loop stand-ins — normalize masters to roughly **−12 to −9 dB mean** (peak near −1 dBFS) before the engine gain. Same filenames, 60–90 s seamless loops.
