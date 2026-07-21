# Ambient beds (Layer 2)

Looping zone beds played live by `AudioEngine` — never baked into narration.

| File | Zone | Where it plays (production plan) |
|------|------|----------------------------------|
| `bed_antiquity.mp3` | `antiquity` | Palatine → Forum → Trajan; Circus / Appia encore |
| `bed_river.mp3` | `river` | Castel approach (`t16`) + Castel Sant'Angelo finale (`w21`) |
| `bed_centro.mp3` | `centro` | Steps → Trevi → Pantheon exterior → Navona → Largo *(file still missing)* |
| `bed_underworld.mp3` | `underworld` | Colosseum hypogeum (`w02`) *(file still missing)* |
| `bed_pantheon_interior.mp3` | `pantheon_interior` | Pantheon interior chapters *(file still missing)* |

`bed_antiquity.mp3` and `bed_river.mp3` are **loop stand-ins** for field-testing zone crossfades. Normalize each file to roughly **−12 to −9 dB mean** (peak near −1 dBFS) before the engine applies its mix gain (`idleDb` ≈ −24 dB under narration-free walking, `duckedDb` ≈ −26 dB under voice). Replace with Freesound-layered masters when ready — same filenames, 60–90 s seamless loops.
