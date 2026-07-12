# ChronoWalk — Audio File Map & Cursor Integration

**Purpose:** the complete list of audio files to produce in ElevenLabs, in the order the app plays them (six Acts + Encore), plus the three prompts you feed Cursor to wire them into the build.

**Two things to hold in mind before you start:**

1. **SFX are baked into narration, not shipped separately.** Every one-shot sound (the hatch slam, the geese, the Trevi roar) gets mixed *into* the narration master in Phase 3. So the SFX list in the master script's Appendix A produces *intermediate* files — they never ship on their own. The shipping inventory below is narration masters + beds + inserts + system + preview.
2. **Playback order ≠ production order.** You produce in the pipeline order (Phase 0→4, beds first) but the app *plays* in Act order. Both lists are here — don't confuse them.

---

## PART 1 — THE FILE INVENTORY (72 shipping files)

Naming law: lowercase, waypoint = `wNN`, chapter = `_chN`, transit = `tNN`, path variant = `_a`/`_b`, insert = `ins_`, bed = `bed_`, system = `sfx_`/`t_`. All `.mp3`, 44.1kHz, 112kbps, −16 LUFS (two-pass), −1.5 dBTP, 0.8s lead-in / 1.2s tail.

### 1A. Narration masters — in play order (Layer 1, ~49 files incl. variants)

**ACT I — THE ARENA**
| File | Content |
|---|---|
| `w01.mp3` | Colosseum exterior (flagship, ~7:00) |
| `w02_ch1.mp3` | Colosseum interior — chapter 1 |
| `w02_ch2.mp3` | Colosseum interior — chapter 2 |
| `t01_shared.mp3` | Piazza + Arch of Constantine beat (spolia plant) |
| `t01_fork_a.mp3` | Routing tail → Path A |
| `t01_fork_b.mp3` | Routing tail → Path B |

**ACT II — THE HILL & THE VALLEY** *(traversal order flips by path; files are the same)*
| File | Content |
|---|---|
| `w03_ch1.mp3` | Arch of Titus — ch.1 (absorbs the old Forum intro) |
| `w03_ch2.mp3` | Arch of Titus — ch.2 |
| `w03_outro_a.mp3` | Titus ending, Path A (offers optional Palatine climb) |
| `w03_outro_b.mp3` | Titus ending, Path B |
| `t02.mp3` | Titus ↔ Palatine gate connector |
| `t03_a.mp3` | Descent into Forum — Path A variant |
| `t03_b.mp3` | Descent into Forum — Path B variant |
| `w04_ch1.mp3` | Palatine — palace (ch.1) |
| `w04_ch2.mp3` | Palatine — Circus from the Belvedere (ch.2, WINDOW plant) |

**ACT III — THE FORUM**
| File | Content |
|---|---|
| `t05.mp3` | Into the Forum / to the Basilica |
| `w06.mp3` | Basilica of Maxentius (CONSTANTINE payoff) |
| `t06.mp3` | Basilica → Via Sacra |
| `w07.mp3` | Via Sacra |
| `t07.mp3` | Via Sacra → Vesta |
| `w08.mp3` | Temple of Vesta (FIRE plant) |
| `pause.mp3` | Scripted ~10-min rest beat |
| `t09.mp3` | To the Rostra |
| `w10.mp3` | The Rostra (repaced) |
| `w11_12.mp3` | Heart of the Forum — 2 beats, marker between |
| `t12.mp3` | To the Capitoline |
| `w13.mp3` | Capitoline Hill (geese SFX baked) |

**ACT IV — THE MARKET**
| File | Content |
|---|---|
| `t13.mp3` | Capitoline → Trajan's Market |
| `w14.mp3` | Trajan's Market (+ Half-Letter) |

**ACT V — THE LIVING CITY**
| File | Content |
|---|---|
| `t14.mp3` | Trajan → Spanish Steps (long transit) |
| `w15.mp3` | **Spanish Steps — PRODUCTION BENCHMARK, cut this first** |
| `t15.mp3` | Spanish Steps → Trevi |
| `w16.mp3` | Trevi Fountain (WATER payoff) |
| `t16.mp3` | Trevi → Pantheon |
| `w17_ch1.mp3` | Pantheon — ch.1 |
| `w17_ch2.mp3` | Pantheon — ch.2 |
| `w17_ch3.mp3` | Pantheon — ch.3 |
| `w17_ch4.mp3` | Pantheon — ch.4 (AGRIPPA payoff) |
| `t17.mp3` | Pantheon → Navona |
| `w18.mp3` | Piazza Navona (footrace SFX baked) |
| `t18.mp3` | Navona → Campo *(renamed — verify against master)* |
| `w19.mp3` | Campo de' Fiori |
| `t19.mp3` | Campo → Largo *(renamed — verify against master)* |
| `w20.mp3` | Largo di Torre Argentina (cats) |

**ACT VI — THE RIVER**
| File | Content |
|---|---|
| `t20.mp3` | Largo → Castel (new opening para + Tiber/angels) |
| `w21.mp3` | Castel Sant'Angelo — finale (+ Journey Letter) |

**ENCORE — LONG GAMES & LONG ROAD**
| File | Content |
|---|---|
| `enc_circus.mp3` | Circus Maximus floor (WINDOW payoff) |
| `t22.mp3` | To the Appia (taxi framing) |
| `w22.mp3` | Via Appia Antica |

### 1B. Ambient beds — Layer 2 (5 files)
`bed_antiquity.mp3` · `bed_centro.mp3` · `bed_river.mp3` · `bed_underworld.mp3` · `bed_pantheon_interior.mp3`
60–90s seamless loops. App crossfades on zone change, ducks −26 dB under voice.

### 1C. Conditional inserts — Layer 3 (9 files)
Each fires only if its plant-waypoint was heard, so any skip order stays coherent.
| File | Fires at | Requires |
|---|---|---|
| `ins_whopaid.mp3` | payoff of WHO-PAID arc | W01 heard |
| `ins_window.mp3` | Circus / Belvedere | W04 ch.2 heard |
| `ins_jerusalem.mp3` | Arch of Titus | W01 heard |
| `ins_fire.mp3` | FIRE-AND-REFUSAL payoff | W08 heard |
| `ins_caesar_tease.mp3` | CAESAR-ROOM tease | (held across acts) |
| `ins_water_trevi.mp3` | Trevi | WATER plant heard |
| `ins_agrippa.mp3` | Pantheon ch.4 | earlier Agrippa beat |
| `ins_constantine.mp3` | W06 apse line | T01 heard |
| `w21_alt_bruno.mp3` | Castel — `playIfMissing` if Campo skipped | — |

### 1D. System / presence — Layer 3 (8 files)
`sfx_presence.mp3` (bronze 2-note pulse, every ~2 min silent walking) · `t_longwalk.mp3` (fires if transit runs >1.5× expected) · `alt_forum_1.mp3` + `alt_forum_2.mp3` (no-ticket "Forum from the railing" variant) · plus 4 UI cues: arrival chime, threshold-reveal tone, phase-transition seam, completion tone.

### 1E. Preview (1 file)
`preview_pantheon.mp3` — the free sample clip for the paywall / share.

**Total: 72 shipping files.** (SFX one-shots and `cues.json` are intermediate — they live in `/masters` pre-bake, not on R2.)

---

## PART 2 — THE PRODUCTION ORDER (what you actually do in ElevenLabs)

Don't produce in Act order. Produce in pipeline order — each phase feeds the next.

**Phase 0 — Shared library first (½ day).** The 5 beds + `sfx_presence` + `t_longwalk` + 4 UI cues. First because they unblock app testing immediately and are reused everywhere.

**Phase 1 — All narration (ElevenLabs v3, locked settings).** One file per waypoint-chapter + per transit, Track 1 of the master only (never paste anything in ⟦double brackets⟧). **Start with `w15` (Spanish Steps) as the benchmark** — cut it, then test it on a phone speaker *and* cheap earbuds in street noise before you batch the rest. Locked settings: stability 0.45, similarity 0.78, style 0.30, one voice forever. QA each file at first/middle/last 15s.

**Phase 2 — Normalize + measure.** Every file through `normalize_audio.sh` (−16 LUFS two-pass, −1.5 dBTP), generate `durations.json`, apply the naming law.

**Phase 3 — Bake the one-shots.** (a) Generate the ~22 SFX from Appendix A. (b) Listen to each narration once with the script open, note the second each ⟦SFX⟧ lands → `cues.json`. (c) Run `bake_sfx.sh` (ffmpeg `amix`+`adelay`, SFX at −16 dB rel / −10 dB for `hero` cues, re-normalize). Outputs = your shipping masters. **Never runtime cue-sync.**

**Phase 4 — R2 + manifest + check.** Upload to `/rome/audio/narration/`, `/beds/`, `/inserts/`, `/system/`. Build `manifest.json` (schema in Prompt A). Run `npm run check:content` until green.

---

## PART 3 — THE THREE CURSOR PROMPTS

Run in order **after** the media is on R2. Each carries your standard Safety Header ("Work only in the live repo, current branch; make no changes outside the files named; stop and ask if anything is ambiguous or would touch payments/keys"). Never paste keys — reference env var names only.

### PROMPT A — Manifest schema (chapters / variants / inserts / acts / journey.path)

```
Create src/content/rome/manifest.json and a Zod schema src/content/manifest.schema.ts that validates it. The manifest is the single source of truth mapping the tour to audio files on R2 (base URL from VITE_MEDIA_BASE). Structure:

{
  "city": "rome",
  "acts": [ { "id":"act1","title":"The Arena","waypoints":["w01","w02"] }, ... ],   // six acts + "encore"
  "journey": {
    "paths": ["a","b"],                       // Act II fork
    "default_path": "a",
    "path_reorder": { "b": ["w04","w03"] }     // Path B traverses Act II in this order
  },
  "waypoints": {
    "w02": {
      "title":"Colosseum interior",
      "act":"act1",
      "geofence":{ "lat":..,"lng":..,"radius_m":35 },
      "chapters":["w02_ch1.mp3","w02_ch2.mp3"],  // ordered; single-file stops use one entry
      "zone":"antiquity",                        // which bed plays under it
      "inserts":["ins_jerusalem"]                // conditional callbacks eligible here
    },
    "w03": { ..., "outro_variants":{ "a":"w03_outro_a.mp3","b":"w03_outro_b.mp3" } }
  },
  "transits": {
    "t01": { "audio":"t01_shared.mp3", "zone":"antiquity",
             "variants":{ "a":"t01_fork_a.mp3","b":"t01_fork_b.mp3" } },  // optional path tail
    "t03": { "variants":{ "a":"t03_a.mp3","b":"t03_b.mp3" } }
  },
  "inserts": {
    "ins_jerusalem": { "audio":"ins_jerusalem.mp3", "requires":["w01"] },
    "w21_alt_bruno": { "audio":"w21_alt_bruno.mp3", "playIfMissing":["w19"] }
  },
  "beds": { "antiquity":"bed_antiquity.mp3", "centro":"bed_centro.mp3", "river":"bed_river.mp3", "underworld":"bed_underworld.mp3", "pantheon_interior":"bed_pantheon_interior.mp3" },
  "system": { "presence":"sfx_presence.mp3", "longwalk":"t_longwalk.mp3", "no_ticket":["alt_forum_1.mp3","alt_forum_2.mp3"] },
  "durations": {}   // populated from durations.json at build
}

Requirements: the Zod schema must reject a waypoint whose `zone` isn't a defined bed key, an insert `requires` that names an unknown waypoint, and a `path_reorder` that names a waypoint outside that act. Add scripts/check-content.mjs (wired to `npm run check:content`) that loads the manifest, validates it, and HEAD-requests every referenced file at VITE_MEDIA_BASE, failing with a list of any missing URLs. Do not hardcode file paths anywhere else in the app — everything reads from this manifest.
```

### PROMPT B — Three-layer audio engine (with path-fork reordering)

```
Build src/audio/AudioEngine.ts (Web Audio, single AudioContext) with exactly three channels feeding one ducking master. No timeline/cue-sync logic — SFX are already baked into narration masters.

LAYER 1 — Narration: play the current stop's chapters in sequence (or a transit's audio) when a stop/transit becomes active. On W03, after the last chapter, play outro_variants[path]. On a transit with variants, play `audio` then variants[path] if present.

LAYER 2 — AmbientBed: one looping bed per zone. On zone change (zone comes from the active waypoint/transit in the manifest), crossfade beds over ~2s. Bed sits at −24 dB in silence and ducks to −26 dB (relative to voice) whenever Layer 1 is playing, via one ducking GainNode keyed to narration play/pause. bed_pantheon_interior swaps in only inside the Pantheon geofence.

LAYER 3 — Presence + inserts:
  • presence pulse: while state==walking AND no narration playing, play sfx_presence every 120s ± 15s jitter.
  • long-walk: if a transit's elapsed time > 1.5× its expected duration, play t_longwalk once.
  • conditional inserts: maintain completedWaypointIds. When entering a waypoint, for each eligible insert check `requires` ⊆ completed (and for playIfMissing, that the named waypoint is NOT completed) before queuing it after the relevant chapter.

PATH FORK: add `path: 'a'|'b'` to journey context, set at the T01 choice screen. When path==='b', reorder Act II traversal per manifest.journey.path_reorder (geofences are unchanged — only expected sequence and which transit/outro file plays). On Path A, mark W04 optional; if a Path A traveler's GPS still enters the Palatine geofence, promote W04 to active seamlessly and play t02.

All mix levels, fade times, jitter, and the 1.5× threshold live in one src/audio/mix.config.ts — nothing hardcoded in the engine. Expose play(stopId), setPath(p), onZoneChange, and a teardown that releases nodes. Keep the offline cache (Prompt C) in mind: the engine must play from cached blob URLs when offline.
```

### PROMPT C — Offline package

```
Add offline support so a purchased tour plays fully with no connection (travelers often have no data in Rome).

1. Service worker (Workbox or hand-rolled) that, on tour purchase/start, pre-caches every file the manifest references for that city: all narration, beds, inserts, system, and the map tiles for the route bbox. Show a "Downloading tour (X/Y)" progress UI; the tour is not "ready offline" until all audio is cached. Cache-first for audio and tiles; network-first for the manifest with cached fallback.

2. Store the audio as blobs in the Cache Storage API keyed by the R2 URL; AudioEngine resolves each file through a getAudioUrl(name) helper that returns the cached blob URL when present, else the network URL.

3. A per-tour "Available offline" indicator + a manual "Download for offline" button on the tour detail screen, and a storage-used readout with a clear-download option in settings.

4. Guard against partial downloads: verify count and (from durations.json) that each cached blob is non-empty before flipping the ready flag. If verification fails, keep the tour in "streaming" mode and offer retry.

Do not cache payment or auth endpoints. Do not change any existing Lemon Squeezy or Supabase flow.
```

---

*One honest flag:* I rebuilt this map from our locked decisions, so the **waypoint IDs, chapters, path fork, inserts, beds, and the three prompts are solid** — but a couple of the plain transit IDs between Forum stops (`t05`–`t13`) and the two you renamed (`t18`/`t19`) are worth a 2-minute cross-check against `ChronoWalk_MASTER_Production_Script_v2.md` before you paste Prompt A, since that's the one place a number could drift. Everything the engine does keys off the manifest, so if a transit ID differs, you fix it in one file.
