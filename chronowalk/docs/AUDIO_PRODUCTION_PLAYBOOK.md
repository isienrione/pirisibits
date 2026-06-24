# ChronoWalk — Audio scripts & production playbook

**Agentic workflow** for historically rigorous, engaging narration — tuned to how the app actually plays audio today.

**Related:** [WAYPOINT_PLAYBOOK.md](../WAYPOINT_PLAYBOOK.md) · [GEMINI_PROMPTS_EXPANSION.md](./GEMINI_PROMPTS_EXPANSION.md) · [WAYPOINT_ASSET_PIPELINE.md](../WAYPOINT_ASSET_PIPELINE.md)

**Branch:** `cursor/chronowalk-setup-a224`

---

## Verdict on the proposed workflow

Your proposal is **directionally excellent**: two-track scripting (stop vs walk), fact ledger, conversational tone, legal awareness, and QA gates are all industry-standard for premium audio guides.

**What to keep as-is**

- Copyright-safe research hierarchy (primary texts, Parco archeologico, peer-reviewed secondary)
- Rick Steves–inspired *structure* (orientation → story → human detail → transition) without copying voice or scripts
- Separate **waypoint** vs **transit** narrative arcs
- Fact-checking before recording — non-negotiable for Rome content
- Outdoor listening specs (compression, LUFS, clarity at street noise)

**What to change for ChronoWalk**

| Proposal element | Issue | ChronoWalk adjustment |
|------------------|-------|------------------------|
| 22-week timeline | Serial agency scale | **Rolling batch:** 3 stops at a time; agents parallelize research + draft |
| Colosseum exterior + interior as separate waypoints | App = **one geofence + one slider per `id`** | Split only if you add a second seed (`colosseum-interior`) with its own coords |
| Phase 4 Visual Recreation Engine | Duplicates Gemini slider pipeline | **Drop** — visual layer is `modern.mp4` / `ancient-reconstruction.mp4` |
| Gamification (quizzes, badges, Easter eggs) | Not in audio orchestrator | **Defer to v2** — ship narration first |
| Inline `[SFX: …]` in scripts | `AudioOrchestrator` plays **one MP3 per mode** | Bake SFX/ambience in post, or use a quiet loop on `ambient_url` |
| Transit on *previous* stop | App plays **`nextWaypoint.transit_narrative_url`** when user taps “Walk to next” | Author transit as **“approach to {destination}”** on the **destination** waypoint seed |
| 90–180 s waypoint + 60–120 s transit | Can exceed walk time or fatigue listeners | **Duration budget from Mapbox leg minutes** (see below) |
| “100–135 words per stop” vs 90–180 s | Contradictory (~130 wpm → 90 s ≈ **195 words**) | Pick **duration first**, then word cap |
| Sensational claims in examples | Legal + credibility risk | Soften or source: inauguration kill counts vary; avoid “Rome fell because…” |

---

## How audio maps to the app (read this first)

Each waypoint seed exposes **four files**:

| File | Seed field | When it plays |
|------|------------|---------------|
| `arrival.mp3` | `arrival_immersive_url` | User taps **Begin Immersive View** or **Play audio** on waypoint card |
| `transit.mp3` | `transit_narrative_url` | User taps **Walk to {next}** — plays en route to **this** stop (loaded from *next* waypoint) |
| `ambient.mp3` | `ambient_url` | Optional loop at tour start / background (low priority for MVP) |
| `geocache-arrival-alert.wav` | `arrival_alert_url` | Short chime at geofence entry (~30 m) |

**Critical sync:** Arrival narration triggers the before/after slider ~250 ms after playback starts (`AUDIO_SYNC_TRIGGER`). Write arrival scripts so the **first visual cue** lands in the **first 5–8 seconds** — visitors see the card, hit play, then the slider reveals on the “look at this” beat.

**Transit wiring** (`useTourSession.beginTransitToNextStop`):

```
Colosseum → Pantheon walk uses pantheon.transit_narrative_url
Pantheon → Navona walk uses piazza-navona.transit_narrative_url
```

Author transit copy as: *“As you walk toward the Pantheon…”* and store it on **`pantheon`**, not `colosseum`.

---

## Duration budgeting (efficiency without dumbing down)

**Rule:** Transit script length ≤ **80% of Mapbox walking time** for that leg (leave margin for pauses, photos, crossings).

| Leg (example) | Walk ~min | Transit target | Waypoint arrival target |
|---------------|-----------|----------------|-------------------------|
| Colosseum → Pantheon | ~25–35 | 2:00–2:30 | 1:30–2:00 |
| Pantheon → Piazza Navona | ~8–12 | 1:00–1:30 | 1:30–2:00 |
| Forum cluster hop | ~3–6 | 0:45–1:15 | 1:15–1:45 |

**Word caps** at ~125–130 wpm (clear outdoor delivery):

- 60 s → **~125 words**
- 90 s → **~190 words**
- 120 s → **~250 words**

Waypoint scripts: **1:30–2:00** sweet spot (dense but not lecture). Transit: **shorter, movement-forward**.

---

## The lean agentic pipeline

Six agents, one **Fact Ledger** per stop. No agent records audio until Fact Ledger is signed off.

```mermaid
flowchart LR
  A[Research Agent] --> B[Fact Ledger YAML]
  B --> C[Outline Agent]
  C --> D[Script Agent]
  D --> E[Fact-Check Agent]
  E --> F[Read-Aloud Agent]
  F --> G[Voice Production]
  G --> H[Master + seed wiring]
```

### Agent 1 — Research

**Input:** waypoint `id`, coordinates, slider ancient target  
**Output:** `content/<id>/facts.yaml`

```yaml
id: colosseum
title: The Colosseum
ancient_era_label: "80 AD (inauguration games)"
claims:
  - id: velarium_sailors
    narration: "The awning was handled by sailors from the fleet at Misenum."
    confidence: high
    sources:
      - "Suetonius, Claud. 21 (velarium)"
      - "Cassius Dio 66.25"
  - id: iron_clamps
    narration: "Medieval scavengers pried out iron clamps, leaving pockmarks in the travertine."
    confidence: high
    sources:
      - "Amanda Claridge, Rome: An Oxford Archaeological Guide"
avoid:
  - "Exact kill counts for inaugural games" # figures vary by source; use "hundreds" or cite range
  - "Rome fell because X" # single-cause fall narratives
trivia_candidates:
  - "arena ← harena (sand)"
  - "planned wool factory under Sixtus V (never built)"
visual_anchors:
  - "holes in travertine at eye level"
  - "hypogeum visible from arena floor level"
```

**Source tiers (use in order):**

1. Site authorities: Parco Colosseo, Parco archeologico del Colosseo, Sovrintendenza
2. Primary texts (public domain): Suetonius, Cassius Dio, Pliny, Livy
3. Reference works: Claridge, Coarelli, Platner & Ashby
4. Inspiration only: Rick Steves, VoiceMap, Action Tour Guide (**structure**, not sentences)

### Agent 2 — Outline

**Input:** facts.yaml + leg context (from, to, walk minutes)  
**Output:** `content/<id>/outline.md`

Waypoint outline blocks (fixed):

1. **Hook** (1 sentence, present tense, “you are here”)
2. **Visual anchor** (what to look at *now* — matches slider POV)
3. **Time machine** (one era shift, tied to ancient reconstruction)
4. **Human story** (one named person, ritual, or sensory detail)
5. **Obscure wow** (one fact from `trivia_candidates`, ledger-backed)
6. **Slider cue** (`[SLIDER_REVEAL]` — “Drag the slider…” or “Watch the façade rebuild…”)
7. **Transition** (optional on last stop; else hand off to map / Walk to next)

Transit outline blocks:

1. **Movement** (“Keep the cobbles on your left…”)
2. **Thread** (link previous stop theme to next)
3. **Hidden layer** (one thing visible on the walk)
4. **Anticipation** (“In about a minute, you’ll see…”)

### Agent 3 — Script

**Input:** outline + word cap  
**Output:** `content/<id>/arrival.script.md`, `content/<id>/transit.script.md`

**Delivery format** — plain narration only in recording script; production notes in comments:

```markdown
---
target_duration_sec: 105
word_count: 198
voice: primary_narrator
---

Stop here at the outer ring. Look at the travertine — see those square holes?

They held iron clamps. Scavengers pulled them out centuries ago. That's why the wall looks punched full of sockets.

[ELEVEN: warm, slight smile]

In eighty AD, this place could hold tens of thousands. Games ran for a hundred days at the opening — a spectacle Rome had never seen at this scale.

[SLIDER_REVEAL]
Now drag the slider. Same stones — but the upper tiers intact, awnings rigged, the crowd noise you'd have heard from exactly where you're standing.

One word you use every week comes from here: arena, from harena — sand. They spread it over the wooden floor to soak what the games left behind.

When you're ready, open the map and head toward our next stop.
```

**Tone rules**

- Second person, present tense, **one idea per sentence**
- No academic hedging in audio (“scholars debate…” → pick the mainstream view or say “most historians…”)
- **Fun ≠ fiction** — vivid yes, invented dialogue no
- Name **one** date or number per minute max (listener retention)

### Agent 4 — Fact-check

**Input:** script + facts.yaml  
**Output:** annotated script + `content/<id>/factcheck.md`

Checklist:

- [ ] Every historical claim maps to a ledger `claims[].id`
- [ ] No claim in `avoid` list
- [ ] Visual anchors match `viewpoint` / slider POV
- [ ] Transit directions match real walking path (spot-check on Google Maps / Mapbox)
- [ ] Plagiarism: no 8+ word string match to commercial guides (manual or `diff` against notes)

### Agent 5 — Read-aloud

**Input:** final script  
**Output:** timing report

- TTS dry run (ElevenLabs / OpenAI) at final speed
- Flag sentences > 20 words
- Flag tongue-twisters (Latin names back-to-back)
- Target: **within ±10% of duration budget**

### Agent 6 — Production & master

See [Production specs](#production-specs) below. Output files into `public/waypoints/<id>/`.

---

## Script templates (copy-paste)

### Waypoint — arrival (`arrival.mp3`)

| Block | Sec | Purpose |
|-------|-----|---------|
| Hook | 0–5 | Stop + single visual command |
| Anchor | 5–25 | Describe only what’s in frame |
| Time machine | 25–70 | Era shift → ties to ancient video |
| Human / wow | 70–95 | One story or obscure fact |
| Slider + close | 95–110 | `[SLIDER_REVEAL]` + optional “when ready” |

### Transit — approach (`transit.mp3` on **destination** id)

| Block | Sec | Purpose |
|-------|-----|---------|
| Movement cue | 0–10 | Feet, direction, safety |
| Thread | 10–40 | Thematic bridge from last stop |
| Hidden Rome | 40–70 | One facades / layer detail on route |
| Anticipation | 70–end | “You’ll know you’ve arrived when…” |

---

## Example: Pantheon arrival (ledger-safe draft)

**~185 words · ~1:30**

> You're in the piazza, facing the portico. That granite row out front? Each column is a single stone hauled from Egypt — a flex of imperial logistics, not just architecture.
>
> The bronze letters on the pediment once read a dedication to Marcus Agrippa. What you see today is mostly Hadrian's rebuilding — he kept the old inscription out of respect, or politics, or both.
>
> Look up at the dome. It's still the world's largest unreinforced concrete span after nearly two millennia. The oculus isn't decoration — it's the building's lantern, rain and all. Stand under it on a wet day and you'll believe in Roman engineering fast.
>
> Drag the slider: same viewpoint, but the neighborhood behind it melts away — temples, open sky, the city when this was a temple to all the gods, not a church.
>
> When you're ready, explore the floor — or open the map for our next walk.

---

## Voice strategy: quality vs speed

| Tier | Use | Tool |
|------|-----|------|
| **Hero stops** (Colosseum, Pantheon, Forum flagship) | Human VO or premium cloned narrator | Studio or ElevenLabs Professional Voice Clone |
| **Batch stops** (Forum cluster) | One consistent TTS voice, human polish pass | ElevenLabs / PlayHT with locked settings |
| **Patches** | TTS sentence replace | Same voice ID + same chain |

**Recommendation for ChronoWalk MVP**

1. Record **one** brand narrator for Colosseum + Pantheon + Navona (sets tone).
2. Use **same voice** via TTS for Forum expansion with human review — listeners prefer one guide voice over a cast of strangers.
3. Skip “character voices” for emperors until v2 — breaks outdoor clarity.

**Italian pronunciation pass:** native speaker reviews proper nouns (Vespasian, Septimius, Agrippa) once per script batch.

---

## Production specs

### Recording

- **48 kHz / 24-bit WAV** master
- Deliver **MP3** to app: **128 kbps CBR** or **96 kbps** (smaller offline bundle)
- Mono or stereo: **mono** is fine for voice; stereo only if ambiences are wide

### Mix chain

1. High-pass ~80 Hz on voice
2. De-ess lightly
3. Compression **2:1**, slow attack — intelligibility in traffic
4. **Integrated loudness −16 LUFS** (mobile podcast standard)
5. True peak **≤ −1 dBTP**
6. Optional: **−18 to −22 dB** ambience bed under voice in transit (pre-mixed into `transit.mp3`)

### File naming (matches existing seeds)

```
public/waypoints/<id>/
  arrival.mp3              → arrival_immersive_url
  transit.mp3              → transit_narrative_url   # "approach to THIS stop"
  ambient.mp3              → ambient_url             # optional
  geocache-arrival-alert.wav → arrival_alert_url
```

Placeholder today: `Audio_sample.mp3` on all fields — replace per file.

### Arrival alert

Keep **< 1.5 s**, no voice, distinct from notification sounds. Same file can be reused across stops or customized per landmark.

---

## Forum cluster: batch efficiency

For 8 Forum stops, don’t write 8 isolated operas:

1. **One** Forum “super-outline” for chronological thread (kingdom → republic → empire).
2. Per-stop script gets **one unique wow** + **one visual anchor**; thread line is lighter.
3. Transit between Forum stops can be **shorter** (45–75 s) — visitor is already in archaeological zone.
4. Shared `facts-forum-common.yaml` for Cloaca Maxima, Campo Vaccino nickname, Via Sacra processions.

---

## QA before ship

| Gate | Method | Pass |
|------|--------|------|
| Historical | Fact ledger 100% mapped | No orphan claims |
| Legal | Original prose + PD sources | No copied guide paragraphs |
| Engagement | 3 listeners, phone speaker, outdoors | ≥ 2/3 finish without skip |
| Clarity | Play at 85 dB ambient noise simulation | All proper nouns intelligible |
| App sync | `?singleWaypoint=<id>&debugGeo=true` | Slider reveals on `[SLIDER_REVEAL]` beat |
| Transit | Walk leg with narration | Ends before or as geofence triggers |
| Bundle | `du -sh public/waypoints/` | Watch total download size |

---

## What to defer (still good ideas, wrong phase)

- Quizzes / Centurion’s Challenge
- AR pose mode
- Multilingual tiers
- Per-leg `transit_narrative_url` on tour leg objects (code change) — until you need different copy per direction
- Full transcript UI — add `arrival_transcript` text field in seed when you build captions

---

## Suggested production order

| Wave | Stops | Why |
|------|-------|-----|
| **1** | colosseum, pantheon, piazza-navona | Tour already live — replace placeholders |
| **2** | forum-arch-titus → forum cluster | Dense zone, shared research |
| **3** | capitoline-hill, campo-de-fiori, trajan-market | Standalone walks |
| **4** | castel-sant-angelo, circus-maximus, appian-way | Longer legs, longer transit |

---

## Repo layout (proposed)

```
chronowalk/
  content/
  colosseum/
    facts.yaml
    outline.md
    arrival.script.md
    transit.script.md      # optional: approach-to-colosseum if first stop
    factcheck.md
  pantheon/
    facts.yaml
    arrival.script.md
    transit.script.md      # colosseum → pantheon walk
  ...
  public/waypoints/<id>/
    arrival.mp3
    transit.mp3
```

Wire paths in `src/data/<id>.js` — same pattern as [WAYPOINT_ASSET_PIPELINE.md](../WAYPOINT_ASSET_PIPELINE.md#phase-5--audio-assets).

---

## Agent one-liner (audio pass)

```
Read chronowalk/docs/AUDIO_PRODUCTION_PLAYBOOK.md.
For waypoint <id>: create content/<id>/facts.yaml, arrival.script.md, transit.script.md (transit = approach to this stop).
Fact-check against ledger. Master to public/waypoints/<id>/arrival.mp3 and transit.mp3.
Update seed URLs. Test ?singleWaypoint=<id>&debugGeo=true — slider sync on first visual cue.
```

---

## Fixes to apply to the draft example scripts

| Line in proposal | Issue | Safer version |
|------------------|-------|---------------|
| “5,000 animals and 2,000 gladiators” | Sources disagree | “Hundreds of animals and many gladiatorial bouts over a hundred days” |
| “300 TONS of iron clamps” | Needs citation | “Tons of iron clamps” + ledger source |
| Vestal fire → “Rome fell not long after” | Causal oversimplification | “The cult ended under Theodosius; the temple was gone within decades” |
| “bullet holes” joke | Fine for tone | Keep — clearly rhetorical |
| Sixtus V wool factory | Good obscure fact | Keep — verify via ledger |

---

## Summary

Your workflow is **80% of a world-class pipeline**. The highest-leverage improvements for ChronoWalk:

1. **Align to four audio slots** and destination-stop transit convention.
2. **Duration from walk time**, not fixed 3-minute stops.
3. **Fact Ledger YAML** before any prose — agents scale; quality gates stay.
4. **One narrator brand**, TTS for volume, human for hero stops.
5. **Cut visual/gamification phases** — already covered or v2.
6. **Pre-mix SFX** — don’t rely on inline tags in the app.
7. **Script to slider sync** — first visual command early for `AUDIO_SYNC_TRIGGER`.

Ship **arrival** scripts first (highest engagement), then **transit**, then **ambient**.
