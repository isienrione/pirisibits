# Spanish Rome narration assets

Spanish hero-stop narration lives under:

```
/rome/audio/es/narration/{filename}
```

Filenames match the English masters exactly (no rename). English remains at the legacy unprefixed tree:

```
/rome/audio/narration/{filename}
```

Beds, inserts, and non-verbal system cues (e.g. arrival chime) stay language-neutral under `/rome/audio/{beds|inserts|system}/`.

Spoken system VO forks by locale with the same English filename:

```
/rome/audio/es/system/ui_waypoint_unlocked.mp3
```

(English master: `/rome/audio/system/ui_waypoint_unlocked.mp3` — “Waypoint unlocked!”)

## 21 hero-stop primary files

| Stop | Primary file | Spanish path |
|------|--------------|--------------|
| w01 Colosseum | `w01.mp3` | `/rome/audio/es/narration/w01.mp3` |
| w02 Colosseum interior | `w02_ch1.mp3` | `/rome/audio/es/narration/w02_ch1.mp3` |
| w03 Arch of Titus | `w03_ch1.mp3` | `/rome/audio/es/narration/w03_ch1.mp3` |
| w04 The Palatine | `w04_ch1.mp3` | `/rome/audio/es/narration/w04_ch1.mp3` |
| w06 Basilica of Maxentius | `w06.mp3` | `/rome/audio/es/narration/w06.mp3` |
| w07 Via Sacra | `w07.mp3` | `/rome/audio/es/narration/w07.mp3` |
| w08 Temple of Vesta | `w08.mp3` | `/rome/audio/es/narration/w08.mp3` |
| w10 The Rostra | `w10.mp3` | `/rome/audio/es/narration/w10.mp3` |
| w11_12 Arch of Septimius Severus | `w1112_b1.mp3` | `/rome/audio/es/narration/w1112_b1.mp3` |
| w13 Capitoline Hill | `w13.mp3` | `/rome/audio/es/narration/w13.mp3` |
| w14 Trajan's Market | `w14.mp3` | `/rome/audio/es/narration/w14.mp3` |
| w15 Spanish Steps | `w15.mp3` | `/rome/audio/es/narration/w15.mp3` |
| w16 Fontana di Trevi | `w16.mp3` | `/rome/audio/es/narration/w16.mp3` |
| w17 The Pantheon | `w17_ch1.mp3` | `/rome/audio/es/narration/w17_ch1.mp3` |
| w23 Pantheon interior | `w17_ch2.mp3` | `/rome/audio/es/narration/w17_ch2.mp3` |
| w18 Piazza Navona | `w18.mp3` | `/rome/audio/es/narration/w18.mp3` |
| w19 Campo de' Fiori | `w19.mp3` | `/rome/audio/es/narration/w19.mp3` |
| w20 Largo di Torre Argentina | `w20.mp3` | `/rome/audio/es/narration/w20.mp3` |
| w21 Castel Sant'Angelo | `w21.mp3` | `/rome/audio/es/narration/w21.mp3` |
| enc_circus Circus Maximus View | `enc_circus.mp3` | `/rome/audio/es/narration/enc_circus.mp3` |
| w22 Via Appia Antica | `w22.mp3` | `/rome/audio/es/narration/w22.mp3` |

Pantheon also requires `w17_ch3.mp3` and `w17_ch4.mp3` in the same folder.

Canonical map: `src/i18n/audio/heroStopAudioMap.js`  
Hard fail when files are required: `npm run check:i18n:audio`
