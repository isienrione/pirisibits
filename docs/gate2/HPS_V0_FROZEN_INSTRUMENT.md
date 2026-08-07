# HPS v0 — Frozen Instrument (Gate 2)

Status: PROPOSED FOR FREEZE. Once the founder approves, no item wording changes until after Rome Trip 1 (a frozen instrument is a Rome-gate requirement). Supersedes the exploratory draft in `docs/gate1/HISTORICAL_PRESENCE_SCORE_V0.md` as the operational instrument; that document remains the rationale.

## Design goals
Distinguish, per founder brief: spatial presence, temporal presence, historical legibility, emotional presence/wonder, interaction burden, attention conflict, trust — and NOT reward mere novelty ("wow factor").

## Response scale
All items 7-point Likert, 1 = strongly disagree … 7 = strongly agree, administered immediately after each experience cell, before any discussion. Negative-keyed items reverse-scored. Order randomized within blocks.

## Items

### Core HPS (8 items, 4 subscales × 2)
**Spatial presence (SP)**
- SP1. "I felt oriented inside the historical place — I knew where things were around me."
- SP2. "The historical space felt like it had real depth and extent, not like an image in front of me."

**Temporal presence (TP)**
- TP1. "At moments, I could genuinely imagine standing in this place in another era."
- TP2. "The past version of this place felt like somewhere that once really existed, not like an illustration."

**Historical legibility (HL)**
- HL1. "I now understand what these ruins/this place used to be and how it worked."
- HL2. "I could point at specific things around me and say what they were."

**Emotional presence / wonder (EW)**
- EW1. "Something in this experience moved me or gave me chills."
- EW2. "I wanted to stay longer in the moment the experience created."

**Core HPS score** = mean of the 8 items (1–7). Subscale scores reported separately — an experiment can pass on the wrong subscale (e.g., high EW, flat HL), and the decision rules below use subscales where relevant.

### Diagnostic dimensions (not in core score)
**Interaction burden (IB, reverse-keyed)**
- IB1. "Operating the experience (holding, aiming, tapping) got in the way of the experience itself."
- IB2. "I had to think about the app more than about the place."

**Attention conflict (AC, reverse-keyed)**
- AC1. "The experience pulled me away from the real place in front of me."
- AC2. "Afterwards I felt I had looked at a screen more than at the site." (real-site sessions only)

**Trust (TR)**
- TR1. "I trust that what I was shown/told is historically accurate."
- TR2. "I could tell what was known fact versus reconstruction or interpretation."

### Anti-wow controls
- NV1 (novelty probe, excluded from all scores): "This felt technologically impressive." Used only to check divergence: if NV1 is high while core HPS is low, the cell produced spectacle, not presence — reported explicitly.
- **Second-exposure rule:** any cell that passes on first exposure must hold ≥ 85% of its core-HPS delta on a second exposure (same or next day) before it "earns more investment." Novelty decays; presence should not.
- EW items ask about the *place/moment*, never about the technology.

### Behavioral & forced-choice block (per Gate 1 triangulation)
- Forced choice after paired cells: "If you could only keep one on your trip, which one?" (+ one-sentence why).
- Unprompted-narrative probe at +24h (message): "What do you remember about the Forum/place?" Scored blind: does the participant describe the *place/past* (1) or the *app/tech* (0)?
- Logged behavior: dwell time at stop, gaze-up ratio where observable, voluntary replays.

## Scoring & decision use
- Primary metric everywhere: **ΔHPS** = core HPS of test cell minus comparator cell (within-subject wherever possible).
- Standard thresholds (used by the matrix unless an experiment overrides):
  - **Pass:** ΔHPS ≥ +1.0 (on the 7-pt scale, ≈ large effect) AND forced choice ≥ 70% for the test cell.
  - **Kill:** ΔHPS < +0.4 OR forced choice < 55%.
  - **Ambiguous:** anything between → exactly one pre-declared iteration, then re-test once; a second ambiguous result is treated as a kill *for investment purposes* (concept may be revisited in a later gate, but earns nothing now).
- Sample sizes: Phase 1 cells n = 10–12 within-subject (order counterbalanced); Rome cells n = 6–10 (recruited travelers on-site + accompanying testers). These are decision-grade, not publication-grade — the thresholds are set large enough to be readable at this n.

## Administration protocol
- Questionnaire delivered on a separate device/paper, never inside the prototype.
- Facilitator script fixed; no enthusiasm cues; participants told "some versions are deliberately unfinished."
- All sessions audio-recorded for the qualitative block; blind scoring of narratives by someone who doesn't know cell assignment (can be an AI pass + founder spot-check).
