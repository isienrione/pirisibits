# Gate 2E — Santiago Route Lab V0.1

## Status

Developer/editorial inspection surface for the provisional Santiago route engine pipeline.

| Flag | Value |
|------|-------|
| `ROUTE_LAB_V0_1_READY` | `true` |
| `ARC_QUALITY_V0_1_PROVISIONAL_READY` | `true` |
| `EDITORIAL_CALIBRATION_CURATOR_APPROVED` | `false` |
| `PHYSICAL_ROUTE_GENERATION_ENABLED` | `false` |

## URL

```bash
npm run gate:2e:build   # embed F1–F18 engine outputs
npm run gate:2e:serve   # http://localhost:8791/dev/route-lab
```

Expo dev entry (redirects on web): `/dev/route-lab`

Static fallback (open directly after build):

`docs/engine/gate-2e-route-lab.html`

## Default experience

Opens **F2** — 120 min · WALK_ONLY · BALANCED with 3 candidates, map, timeline, diagnostics.

## Modules

| Path | Role |
|------|------|
| `src/dev/route-lab/fixtures.ts` | F1–F18 presets + watch cases |
| `src/dev/route-lab/runRouteLab.ts` | compose + rerank wrapper |
| `src/dev/route-lab/derivations.ts` | ribbon, themes, relations, map segments |
| `src/dev/route-lab/embedPayload.ts` | HTML embed serialization |
| `docs/engine/gate-2e-route-lab.html` | Generated lab UI |
| `scripts/engine/serve_route_lab_v0_1.ts` | Dev server + `/api/run` |

## Curator deep link

Route Lab stop inspector links to:

`docs/engine/gate-2a1-founder-calibration-cockpit.html?stgoId=STGO_XX`

## Non-goals

Production routing · score tuning · in-place semantic editing · Gate 2F.

## Validate

```bash
npm run gate:2e:validate
```
