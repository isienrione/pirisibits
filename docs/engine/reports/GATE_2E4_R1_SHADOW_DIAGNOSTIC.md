# Gate 2E.4 — R1 Shadow Diagnostic

**Fixture:** R1 (diagnostic only)  
**Production composer affected:** false  
**Date:** 2026-08-30

## Summary

R1 cannot be recomputed under Experience-Time Model V0.1 until curator-calibrated VisitMode, dwell bands, access overhead, ticket/hours flags, and on-path evidence exist for each listed POI.

Legacy scalar dwell remains available via `LEGACY_SCALAR_DWELL` adapter only and is **not** an experience-time calibration.

## POI requirements

For each POI below, status = **`EXPERIENCE_TIME_UNKNOWN`**.

Required calibration fields (curator schema):

- defaultCoreVisitMode
- coreDwellTypicalMin / coreDwellMin / coreDwellMax
- optionalExtension (+ extensionVisitMode / extensionDwellTypicalMin if yes)
- interiorExterior
- ticketDependent
- openingHoursDependent
- accessOverheadMin
- passThroughCapable
- stopRole
- authoredContentMin / stationaryDwellMin / walkCompatibleContentMin
- contentMayOverlapMovement
- on-path evidence (canonical geometry) — else onPath = UNKNOWN

| STGO | Label | VisitMode | onPath | Notes |
|---|---|---|---|---|
| STGO_01 | Plaza de Armas | UNKNOWN | UNKNOWN | Need core mode + dwell band |
| STGO_02 | Catedral | UNKNOWN | UNKNOWN | Need core mode + dwell band; ticket/hours flags |
| STGO_16 | Pasaje Matte | UNKNOWN | UNKNOWN | Pass-through capability unknown |
| STGO_22 | Museo Precolombino | UNKNOWN | UNKNOWN | Do **not** invent interior/exterior split without evidence |
| STGO_19 | Seguro Obrero | UNKNOWN | UNKNOWN | Exterior micro-reveal vs stop role unknown |
| STGO_18 | Edificio Ariztía | UNKNOWN | UNKNOWN | Identity corrected; experience-time still unknown |
| STGO_06 | Barrio París-Londres | UNKNOWN | UNKNOWN | Corridor vs stop classification unknown |
| STGO_92 | Paseo Bandera | UNKNOWN | UNKNOWN | Marginal movement historically low; dwell mode unknown |
| STGO_03 | La Moneda | UNKNOWN | UNKNOWN | Access overhead / hours dependency unknown |

## Explicit non-actions

- No new VisitMode assignments invented in this gate.
- No new dwell values invented.
- No production composer cutover.
