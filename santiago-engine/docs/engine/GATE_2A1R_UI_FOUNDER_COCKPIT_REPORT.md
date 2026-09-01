# Gate 2A.1R-UI — Founder Calibration Cockpit

**Gate:** 2A.1R-UI  
**Status:** PASS (curation tooling only)  
**Starting checkpoint:** `aee3098b2f70c64799a896c51377b6da02dd9f90`

## Artifact

`docs/engine/gate-2a1-founder-calibration-cockpit.html`

Historical QA surface retained:

`docs/engine/gate-2a1-editorial-calibration.html`

Generator:

`scripts/engine/generate_gate_2a1_founder_cockpit.py`

## Capabilities

- Immutable Gate 2A.1R source snapshot for Launch 30
- Editable founder draft for T1A–T9 + structural metrics + tier/visit/M1–M5
- Live Raw ChronoWorth + Relative corpus-normalized ChronoWorth (`SANTIAGO_LAUNCH30_V0_1`)
- localStorage draft persistence, Save / Approve / Reset field / Reset POI
- Export `launch30_founder_calibration.reviewed.v0.1.json` (does not overwrite repo)
- Taxonomy, structural, ChronoWorth, and M1–M5 handbooks
- No Approve All; incomplete export marked `INCOMPLETE_FOUNDER_REVIEW`

## Non-goals preserved

Physical freeze unchanged · semantic source unchanged · no Gate 2B · no route generation · curator-approved flag remains false
