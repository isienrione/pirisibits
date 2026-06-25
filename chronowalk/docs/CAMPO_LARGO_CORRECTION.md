# Campo de' Fiori vs Largo Argentina — correction

**What went wrong:** An early draft of `GEMINI_PROMPTS_EXPANSION.md` said Campo de' Fiori's ancient layer was the **Theatre of Pompey**. That was **incorrect** for the slider at Campo.

**You were right:** the Theatre of Pompey — cavea, Curia (where Caesar was killed), and the visible **Area Sacra** ruins — is at **Largo di Torre Argentina**, ~200 m southeast of Campo de' Fiori.

---

## Geography (simple)

| Place | What you see today | Correct ancient slider layer |
|-------|-------------------|------------------------------|
| **Campo de' Fiori** | Market square, Bruno statue, cafes | Medieval/Renaissance **open campo** and market field — not the theatre bowl |
| **Largo di Torre Argentina** | Sunken temples, cats, Pompey ruins | **Theatre of Pompey** complex, ~55 BC — portico, cavea, Curia |

Pompey's complex was **huge** and extended across this neighborhood, but the **theatre auditorium** and assassination Curia are identified with **Argentina**, not the Bruno statue square.

---

## What to do with your Gemini credits (already spent)

| Asset you generated | Use for Campo? | What to do |
|---------------------|----------------|------------|
| **Modern still/video** (market, Bruno, stalls) | ✅ **Yes** | Keep for `campo-de-fiori` — location is correct |
| **Ancient still/video** (theatre, togas, cavea) | ❌ **No** | Do **not** pair with Campo modern — wrong place |

### Option A — Salvage ancient for Argentina (best if quality is good)

1. Add waypoint **`largo-argentina`** (prompts now in `GEMINI_PROMPTS_EXPANSION.md` §11).
2. Generate **new modern** still/video at **Largo Argentina** POV (sunken ruins, cats).
3. Use your **existing ancient** theatre clips as `ancient-source` for **`largo-argentina`** — POV may need a re-scout; if framing doesn't match, re-run ancient only at Argentina coords.

### Option B — Discard ancient, minimal loss

If ancient doesn't match any useful POV, treat those credits as sunk cost. Re-run **only** ancient prompts from the corrected doc (Campo = medieval campo; Argentina = Pompey).

---

## Corrected prompts location

- **Campo de' Fiori:** `GEMINI_PROMPTS_EXPANSION.md` → §10 `campo-de-fiori`
- **Theatre of Pompey:** `GEMINI_PROMPTS_EXPANSION.md` → §11 `largo-argentina`

**Gemini tip:** Always run **Prompt 3 (ancient still)** in a **new chat** with **Create image** mode — see workflow section at top of `GEMINI_PROMPTS_EXPANSION.md`. Otherwise Gemini jumps straight to video.

---

## Audio scripts too

If you already wrote Campo audio mentioning "Theatre of Pompey under your feet" — rewrite to market/Bruno/execution history, and write a **separate** script for `largo-argentina` (Caesar, Curia, first stone theatre in Rome).

---

## Sorry

This conflation is a common guidebook shortcut ("Pompey's theatre was near Campo") but it's **wrong for a camera-locked slider** at Campo de' Fiori. Thanks for catching it before it shipped.
