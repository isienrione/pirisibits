# TravelerMatch Distribution Audit V0.1

**Gate:** 2E.5-QA · **Status:** NON-CANONICAL · **Formula unchanged**

## Summary

Fixtures with max TM < 60: F7, F8, F11, F14, F16

Machine-readable: `src/data/santiago/qa/gate_2e5_qa_measurements.v0.1.json` and `traveler_match_distribution_f1_f18.v0.1.csv`

## Per-fixture TM

| Fixture | min | median | mean | max | std | selected TM route | diagnosis |
|---|---:|---:|---:|---:|---:|---:|---|
| F1 | 23.6 | 61.2 | 58.9 | 84.2 | 19.8 | 79.7 | OK_OR_MODERATE |
| F2 | 23.6 | 61.2 | 58.9 | 84.2 | 19.8 | 63.4 | DOWNSTREAM_ROUTE_SELECTION_GAP |
| F3 | 23.6 | 61.2 | 58.9 | 84.2 | 19.8 | 65.1 | DOWNSTREAM_ROUTE_SELECTION_GAP |
| F4 | 23.6 | 61.2 | 58.9 | 84.2 | 19.8 | 63.4 | DOWNSTREAM_ROUTE_SELECTION_GAP |
| F5 | 36.2 | 57.8 | 56.9 | 82.0 | 12.4 | 63.5 | DOWNSTREAM_ROUTE_SELECTION_GAP |
| F6 | 24.4 | 29.1 | 40.3 | 76.7 | 18.9 | 61.5 | DOWNSTREAM_ROUTE_SELECTION_GAP |
| F7 | 26.6 | 44.6 | 46.3 | 59.1 | 9.6 | 47.4 | LOW_CORPUS_CEILING_OR_SCALE_COMPRESSION |
| F8 | 20.0 | 29.1 | 30.3 | 50.1 | 7.3 | 40.1 | LOW_CORPUS_CEILING_OR_SCALE_COMPRESSION |
| F9 | 25.3 | 43.1 | 46.4 | 70.6 | 10.3 | 53.7 | DOWNSTREAM_ROUTE_SELECTION_GAP |
| F10 | 23.4 | 65.1 | 61.2 | 86.9 | 20.3 | 65.1 | DOWNSTREAM_ROUTE_SELECTION_GAP |
| F11 | 24.8 | 46.3 | 40.2 | 50.6 | 11.0 | 54.1 | LOW_CORPUS_CEILING_OR_SCALE_COMPRESSION |
| F12 | 36.2 | 57.8 | 56.9 | 82.0 | 12.3 | 63.5 | DOWNSTREAM_ROUTE_SELECTION_GAP |
| F13 | 21.6 | 50.2 | 48.7 | 86.1 | 16.1 | 67.6 | DOWNSTREAM_ROUTE_SELECTION_GAP |
| F14 | 23.6 | 49.7 | 42.3 | 53.5 | 11.6 | 55.9 | LOW_CORPUS_CEILING_OR_SCALE_COMPRESSION |
| F15 | 23.4 | 65.1 | 61.2 | 86.9 | 20.3 | 67.6 | DOWNSTREAM_ROUTE_SELECTION_GAP |
| F16 | 26.6 | 44.6 | 46.3 | 59.1 | 9.6 | 48.9 | LOW_CORPUS_CEILING_OR_SCALE_COMPRESSION |
| F17 | 23.6 | 61.2 | 58.9 | 84.2 | 19.8 | 63.4 | DOWNSTREAM_ROUTE_SELECTION_GAP |
| F18 | 23.6 | 61.2 | 58.9 | 84.2 | 19.8 | 63.4 | DOWNSTREAM_ROUTE_SELECTION_GAP |

## Component notes

TravelerMatch = coverage-aware blend of:

- ThematicMatch (0.50)
- DiscoveryMatch / discoveryPostureAffinity (0.20)
- FamiliarityMatch (0.10)
- StructuralMatch (0.10)
- ContextMatch (0.10)

Low TM may come from thematic scale compression, weak corpus fit, UNKNOWN coverage, or downstream route selection — see `diagnosis` column. **No formula change in this gate.**
