# Gate 2A.1R-UI.1 — Score rationale explainability

## Status
PASS (local). NOT PUSHED.

## Artifacts
- `src/data/santiago/curation/launch30_score_rationales.v0.1.json`
- `docs/engine/gate-2a1-founder-calibration-cockpit.html`
- Builder: `scripts/engine/build_launch30_score_rationales_v0_1.py`
- Cockpit generator: `scripts/engine/generate_gate_2a1_founder_cockpit.py`
- Validator: `scripts/engine/validate_gate_2a1r_ui1.py`

## Coverage
30/30 Launch POIs; 100% T1A–T9, structural metrics, visitTimeMin, M1–M5.

## Notes
- Source vs AI proposal rationale classes kept distinct.
- ChronoWorth contribution panel updates live from founder structural drafts.
- Source rationales remain immutable after edits.
- Export schema extended with per-field rationale + optional founderChangeReason.
- Canonical semantic / physical / launch calibration scores unchanged.
- Routing remains disabled; Gate 2B not started.
