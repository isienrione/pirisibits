# Audio sprint — how to activate (start here)

**There is no in-app “start audio” button.** The sprint is a **manual pipeline**: scripts in `content/` → TTS → MP3s in `public/waypoints/` → seed URLs → test in browser.

**Full reference:** [AUDIO_PRODUCTION_PLAYBOOK.md](./AUDIO_PRODUCTION_PLAYBOOK.md)

---

## Before you start (15 minutes)

### 1. Pull the branch

```bash
cd chronowalk    # or cd pirisibits/chronowalk on your Mac
git pull origin cursor/chronowalk-setup-a224
npm install
```

### 2. Run the app (keep this terminal open)

```bash
npm run dev
```

Open: http://localhost:5173/?resetTour=true&debugGeo=true

You’ll use this to test audio as soon as the first MP3 lands.

### 3. Pick your TTS voice (Day 1 — do not skip)

1. Open [ElevenLabs](https://elevenlabs.io) or OpenAI TTS.
2. Choose **one** narrator voice for all 17 stops.
3. Record settings in **`content/VOICE_SETTINGS.md`** (voice ID, speed, model).

You need this before Day 2 batch generation so every file sounds the same.

### 4. Optional: ffmpeg for mastering

```bash
brew install ffmpeg   # macOS
ffmpeg -version
```

Used via `npm run normalize-audio -- <id> arrival`.

---

## Day 1 — Activate scripts (start now)

### Step A — Open 4 AI chats (or do them one after another)

| Session | Paste file |
|---------|------------|
| **1 (do first)** | [content/batches/BATCH_A-live-tour.md](../content/batches/BATCH_A-live-tour.md) |
| 2 | [content/batches/BATCH_B-forum-east.md](../content/batches/BATCH_B-forum-east.md) |
| 3 | [content/batches/BATCH_C-forum-west.md](../content/batches/BATCH_C-forum-west.md) |
| 4 | [content/batches/BATCH_D-standalone.md](../content/batches/BATCH_D-standalone.md) |

Use **Gemini** or **Claude**. Each batch returns scripts for multiple stops in one reply.

### Step B — Save AI output to disk

For each stop, create:

```
content/<id>/arrival.script.md
content/<id>/transit.script.md    # skip for colosseum only
```

**Example:**

```
content/colosseum/arrival.script.md
content/pantheon/arrival.script.md
content/pantheon/transit.script.md
content/piazza-navona/arrival.script.md
content/piazza-navona/transit.script.md
```

Strip markdown headers from the narration before TTS — paste **spoken words only** into ElevenLabs.

### Step C — Commit scripts (checkpoint)

```bash
git add content/
git commit -m "Audio sprint Day 1: scripts batch A"
git push origin cursor/chronowalk-setup-a224
```

---

## Day 2 — Activate arrival audio

### For each stop

1. Open `content/<id>/arrival.script.md` — copy narration body (no `claims` section).
2. Paste into ElevenLabs → generate → download WAV.
3. Save as `public/waypoints/<id>/arrival-raw.wav`
4. Master:

```bash
npm run normalize-audio -- colosseum arrival
npm run normalize-audio -- pantheon arrival
npm run normalize-audio -- piazza-navona arrival
```

### Wire the live tour seeds (3 stops)

In each file, change audio paths from `Audio_sample.mp3` to real files:

**`src/data/colosseum.js`**

```javascript
const COLOSSEUM_ARRIVAL_AUDIO = '/waypoints/colosseum/arrival.mp3'
// colosseum: no transit file (tour start) — leave transit on sample or remove later
arrival_immersive_url: COLOSSEUM_ARRIVAL_AUDIO,
```

**`src/data/pantheon.js`**

```javascript
const PANTHEON_ARRIVAL_AUDIO = '/waypoints/pantheon/arrival.mp3'
const PANTHEON_TRANSIT_AUDIO = '/waypoints/pantheon/transit.mp3'   // after Day 3
arrival_immersive_url: PANTHEON_ARRIVAL_AUDIO,
transit_narrative_url: PANTHEON_TRANSIT_AUDIO,
```

**`src/data/piazza-navona.js`** — same pattern.

### Smoke test

```
http://localhost:5173/?singleWaypoint=colosseum&debugGeo=true
```

1. Arrive (debug geo = instant).
2. Tap **Begin Immersive View**.
3. Confirm **your voice** plays (not the old sample).
4. Slider should reveal on the first “look at…” line.

Commit MP3s + seed changes:

```bash
git add public/waypoints/ src/data/
git commit -m "Audio sprint Day 2: arrival MP3s for live tour"
git push
```

---

## Day 3 — Activate transit + full tour

1. TTS each `content/<id>/transit.script.md` → `transit-raw.wav` → `npm run normalize-audio -- <id> transit`
2. Ensure `pantheon.js` and `piazza-navona.js` point `transit_narrative_url` at `transit.mp3`
3. Full tour test:

```
http://localhost:5173/?resetTour=true&debugGeo=true
```

Flow:

1. Colosseum → play arrival audio.
2. Dismiss card → **Walk to Pantheon** → `pantheon/transit.mp3` should play.
3. Arrive Pantheon → arrival audio.
4. Walk to Navona → `piazza-navona/transit.mp3`.

4. Note issues in **`content/POLISH_BACKLOG.md`**.

---

## How audio “activates” in the app

| User action | What plays | File |
|-------------|------------|------|
| Tour start (optional) | Ambient loop | `ambient_url` — **skip in sprint** |
| Geofence entry | Chime | `arrival_alert_url` |
| **Begin Immersive View** | Arrival narration + slider sync | `arrival_immersive_url` |
| **Walk to next stop** | Transit narration | **Next** stop’s `transit_narrative_url` |

Transit for the Pantheon walk lives on **`pantheon`**, not `colosseum`.

---

## Expansion stops (Forum + rest)

Code scaffolds (`src/data/<id>.js`) may not exist yet for all 14 expansion stops. You can still:

1. Generate scripts + MP3s now under `content/` and `public/waypoints/<id>/`
2. Wire seeds when each waypoint is added to `rome-core-tour.js` (see [WAYPOINT_PLAYBOOK.md](../WAYPOINT_PLAYBOOK.md))

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Still hear old sample | Seed still points at `Audio_sample.mp3` — update `arrival_immersive_url` |
| No audio on play | Hard refresh; check `http://localhost:5173/waypoints/colosseum/arrival.mp3` in browser |
| `normalize-audio` fails | Install ffmpeg; ensure `arrival-raw.wav` exists |
| Transit silent | File on **destination** id (`pantheon/transit.mp3` for Colosseum→Pantheon leg) |
| `git pull` / missing scripts | `git pull origin cursor/chronowalk-setup-a224` |

---

## Fastest path (today, ~2 hours)

If you only want to **prove the pipeline** before batching all 17:

1. Paste **[BATCH_A](../content/batches/BATCH_A-live-tour.md)** into Gemini → save **colosseum** arrival script only.
2. ElevenLabs → `arrival-raw.wav` → `npm run normalize-audio -- colosseum arrival`
3. Update `colosseum.js` → `arrival_immersive_url: '/waypoints/colosseum/arrival.mp3'`
4. Test `?singleWaypoint=colosseum&debugGeo=true`

Once that works, run the full Day 1–3 plan.

---

## Cursor agent one-liner

Paste into a new Cursor cloud agent to run Batch A for you:

```
Read chronowalk/docs/AUDIO_SPRINT_ACTIVATION.md and content/batches/BATCH_A-live-tour.md.
Generate content/colosseum/arrival.script.md, content/pantheon/arrival.script.md,
content/pantheon/transit.script.md, content/piazza-navona/arrival.script.md,
content/piazza-navona/transit.script.md per sprint rules. Commit to cursor/chronowalk-setup-a224.
```
