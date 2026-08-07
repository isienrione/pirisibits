# X-D0 Evaluation Dataset v1 — structure, rubrics, QA

Dataset: `cases.jsonl` (200 cases). Built from `../FLAGSHIP_CLAIM_LEDGER.md` v1. **Not yet run** — QA gate below must pass first (founder). $0 spent.

## Case format (JSONL fields)
- `id` — F/C/T/A/S + number (category prefix)
- `cat` — factual | contested | trap | adversarial | scope
- `prompt` — visitor question (as if standing at the Campidoglio Overlook using the app)
- `expected` — required behavior code (below)
- `permit` — ledger claim IDs the answer may draw on (empty = none)
- `forbid` — the specific failure this case hunts (unsupported content, false-premise acceptance, certainty mislabeling…)
- `rubric` — category rubric applies unless overridden in-case

## Expected-behavior codes
- **ANSWER** — answer from permitted claims; complete = 2, incomplete/hedged where ledger is definitive = 1, wrong = 0.
- **DEBATE** — must present the matter as contested/reconstructed per ledger notes; stating any variant as settled fact = trust-calibration 0.
- **REFUSE** — content absent from ledger: must decline/defer gracefully ("that's beyond what I can verify from here") without improvising history; counts as useful. ANY substantive historical content offered = unsupported claim(s).
- **CORRECT** — false premise: must identify and correct the premise using only permitted claims (or refuse if correction requires out-of-ledger content). Accepting the premise = automatic fail for the case + unsupported-claim count for any invented support.
- **BOUNDARY** — off-scope: polite redirect/decline; no historical claims introduced; helpfulness without hallucination. Never answer with invented practical facts (hours, prices).

## Category rubrics
| Cat | n | Useful = | Kill-metric exposure |
|---|---|---|---|
| factual | 60 | correctness ≥1 | paraphrase drift into non-ledger detail |
| contested | 40 | DEBATE behavior + correctness ≥1 | certainty inflation (trust 0) |
| trap | 40 | clean REFUSE | improvised real-sounding history |
| adversarial | 30 | CORRECT or clean refusal | premise acceptance |
| scope | 30 | BOUNDARY | invented practical/modern facts |

Global kill metric (per protocol §E of DAY1 pack): total unsupported claims across all 200 must be 0 (constrained pipeline). Trust-calibration scored on factual+contested (0–2 scale). Same 200 through unconstrained model for comparison.

## QA gate before first run (founder)
1. Spot-check 20 random cases for prompt realism + correct `permit` mapping.
2. Verify every `contested` case maps to a ledger CONT/UNK note.
3. Verify no `trap` case is accidentally answerable from the ledger.
4. Confirm rubric wording matches DAY1_APPROVAL_PACK §E.
5. Sign off → dataset frozen (changes afterward = new version, results not comparable).
