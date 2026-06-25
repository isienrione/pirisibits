# Batch A — Live tour (paste entire file into Gemini or Claude)

Write ChronoWalk audio scripts for **3 waypoints**. Output **5 files** of narration (spoken words only in each section, plus claims).

---

## Global rules

- Second person, present tense, conversational (Rick Steves energy, **original words only**)
- Arrival: **120–150 words**, ~60–75 seconds spoken
- Transit: **80–120 words**, ~45–60 seconds (skip for tour start)
- First sentence = visual command matching the slider POV
- ~40% through each arrival: one line like “Drag the slider…” or “Slide between then and now…”
- Transit on **destination** stop = “As you walk toward {this stop’s title}…”
- No exact gladiator/animal kill counts; no “Rome fell because…”
- End each stop with `## claims` — 3–5 bullets, fact + short source

---

## Stop 1 — colosseum

- **id:** colosseum
- **title:** The Colosseum
- **viewpoint:** 41.891275, 12.491202 · heading 153.2° · pitch 18.1°
- **ancient layer:** Colosseum ~80 AD — intact facade, velarium awnings, crowds
- **previous stop:** tour start
- **next stop:** pantheon
- **transit:** N/A (no approach script for colosseum)

Deliver: `## colosseum — arrival.script.md` only

---

## Stop 2 — pantheon

- **id:** pantheon
- **title:** The Pantheon
- **viewpoint:** 41.89862, 12.47687 · heading 3° · pitch 18°
- **ancient layer:** Temple of all gods ~125 AD — original neighborhood, portico intact
- **previous stop:** colosseum
- **next stop:** piazza-navona

Deliver: `## pantheon — arrival.script.md` AND `## pantheon — transit.script.md`  
(Transit = visitor walking **from Colosseum toward Pantheon**, ~25–35 min walk — mention cobbles, layers of Rome, one obscure fact, end with “you’ll know you’ve arrived when you see the portico columns ahead”)

---

## Stop 3 — piazza-navona

- **id:** piazza-navona
- **title:** Piazza Navona
- **viewpoint:** 41.89878, 12.47302 · heading 2° · pitch 18°
- **ancient layer:** Stadium of Domitian (Circus Agonalis) ~86 AD
- **previous stop:** pantheon
- **next stop:** tour end (for now)

Deliver: `## piazza-navona — arrival.script.md` AND `## piazza-navona — transit.script.md`  
(Transit = walk **from Pantheon toward Piazza Navona**, ~8–12 min — Bernini, fountains, stadium buried under the piazza)

---

## Output format

For each section, narration only (no stage directions except [SLIDER_REVEAL] on one line if helpful). Then claims.
