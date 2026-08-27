# Gate 1B.1 — Santiago geocoding report

**Generated:** 2026-08-27T01:16:02.909635+00:00  
**Branch target:** chronowalk3.0  
**Dataset:** `src/data/santiago/santiago_physical_nodes.proposed.v0.1.json`

## Corpus

- Identity nodes: **103**
- Launch corpus: **30**
- Launch IDs: `la-moneda, morande-80, londres-38, plaza-de-armas, pasaje-phillips, catedral, merced, santa-lucia, lastarria, parque-forestal, gam, bellavista, la-chascona, san-cristobal, mercado-central, museo-memoria, yungay, barrio-brasil, barrio-italia, san-francisco, palacio-pereira, ex-congreso, plaza-constitucion, museo-bellas-artes, estacion-mapocho, cementerio-general, plaza-nunoa, villa-grimaldi, teatro-municipal, casa-de-los-diez`

## Counts

| Selection status | Count | UI color |
|---|---:|---|
| PROVIDER_SELECTED_HIGH_CONFIDENCE | 2 | GREEN |
| NEEDS_CURATOR_REVIEW | 16 | YELLOW |
| NO_RESULT | 0 | RED |
| SUSPICIOUS_OUT_OF_BBOX / false-friend | 12 | RED |

## Policy confirmations

- Physical route generation: **DISABLED**
- Mapbox result ≠ CURATOR_APPROVED (none auto-approved)
- No arithmetic / centroid fallback
- Suspicious/city-centroid collapses do not promote root lat/lng
- Token never written into generated JSON
- `.env` / `.env.local` gitignored; `.env.local` untracked

## GREEN (manual spot-check recommended)

- **san-cristobal** — San Cristóbal, Recoleta, Región Metropolitana de Santiago 8420000, Chile (`-33.420729, -70.642442`) — High-confidence provider selection relevance=0.911 overlap=0.50
- **plaza-nunoa** — Plaza Ñuñoa, Ñuñoa, Región Metropolitana de Santiago, Chile (`-33.459415, -70.59024`) — High-confidence provider selection relevance=0.911 overlap=1.00

## YELLOW / RED

- **YELLOW `la-moneda`** — status `NEEDS_CURATOR_REVIEW` — Plausible hit (relevance=0.617, overlap=1.00) — curator review — provider: Moneda, Santiago, Región Metropolitana de Santiago, Chile
- **RED `morande-80`** — status `SUSPICIOUS_OUT_OF_BBOX` — Low name overlap (0.00) with provider place_name — provider: Santiago, Región Metropolitana de Santiago, Chile
- **YELLOW `londres-38`** — status `NEEDS_CURATOR_REVIEW` — Ambiguous: multiple near-equal Mapbox candidates — provider: Londres 38, Santiago, Región Metropolitana de Santiago 8320000, Chile
- **YELLOW `plaza-de-armas`** — status `NEEDS_CURATOR_REVIEW` — Ambiguous: multiple near-equal Mapbox candidates — provider: Plaza de Armas, Santiago, Región Metropolitana de Santiago 8320000, Chile
- **RED `pasaje-phillips`** — status `SUSPICIOUS_OUT_OF_BBOX` — Low name overlap (0.00) with provider place_name — provider: Santiago, Región Metropolitana de Santiago, Chile
- **YELLOW `catedral`** — status `NEEDS_CURATOR_REVIEW` — kind=micro requires curator confirmation (overlap=0.00) — provider: Plaza de Armas, Santiago, Región Metropolitana de Santiago 8320000, Chile
- **RED `merced`** — status `SUSPICIOUS_OUT_OF_BBOX` — Low name overlap (0.00) with provider place_name — provider: Santiago, Región Metropolitana de Santiago, Chile
- **YELLOW `santa-lucia`** — status `NEEDS_CURATOR_REVIEW` — Plausible hit (relevance=0.704, overlap=0.50) — curator review — provider: Santa Lucía, Santiago, Región Metropolitana de Santiago 8320000, Chile
- **YELLOW `lastarria`** — status `NEEDS_CURATOR_REVIEW` — Provider hit needs curator review (relevance=0.822, overlap=1.00) — provider: Lastarria, Huechuraba, Región Metropolitana de Santiago 8580000, Chile
- **YELLOW `parque-forestal`** — status `NEEDS_CURATOR_REVIEW` — kind=micro requires curator confirmation (overlap=0.50) — provider: Parque, Estación Central, Región Metropolitana de Santiago 9160000, Chile
- **RED `gam`** — status `SUSPICIOUS_OUT_OF_BBOX` — Low name overlap (0.00) with provider place_name — provider: Santiago, Región Metropolitana de Santiago, Chile
- **RED `bellavista`** — status `SUSPICIOUS_OUT_OF_BBOX` — Low name overlap (0.00) with provider place_name — provider: Avenida Recoleta, Recoleta, Región Metropolitana de Santiago 8420000, Chile
- **RED `la-chascona`** — status `SUSPICIOUS_OUT_OF_BBOX` — Low name overlap (0.00) with provider place_name — provider: Santiago, Región Metropolitana de Santiago, Chile
- **YELLOW `mercado-central`** — status `NEEDS_CURATOR_REVIEW` — kind=micro requires curator confirmation (overlap=0.00) — provider: Ismael Valdés Vergara, Santiago, Región Metropolitana de Santiago 8320000, Chile
- **YELLOW `museo-memoria`** — status `NEEDS_CURATOR_REVIEW` — Plausible hit (relevance=1.000, overlap=0.00) — curator review — provider: Matucana, Santiago, Región Metropolitana de Santiago, Chile
- **YELLOW `yungay`** — status `NEEDS_CURATOR_REVIEW` — kind=micro requires curator confirmation (overlap=1.00) — provider: Yungay, Quinta Normal, Región Metropolitana de Santiago, Chile
- **YELLOW `barrio-brasil`** — status `NEEDS_CURATOR_REVIEW` — kind=micro requires curator confirmation (overlap=1.00) — provider: Brasil, Santiago, Región Metropolitana de Santiago, Chile
- **RED `barrio-italia`** — status `SUSPICIOUS_OUT_OF_BBOX` — Low name overlap (0.00) with provider place_name — provider: Ñuñoa, Región Metropolitana de Santiago, Chile
- **YELLOW `san-francisco`** — status `NEEDS_CURATOR_REVIEW` — kind=micro requires curator confirmation (overlap=0.00) — provider: Alameda, Estación Central, Región Metropolitana de Santiago 9160000, Chile
- **RED `palacio-pereira`** — status `SUSPICIOUS_OUT_OF_BBOX` — Low name overlap (0.00) with provider place_name — provider: Huérfanos, Quinta Normal, Región Metropolitana de Santiago 8500000, Chile
- **YELLOW `ex-congreso`** — status `NEEDS_CURATOR_REVIEW` — Ambiguous: multiple near-equal Mapbox candidates — provider: Pasaje El Congreso, Peñalolén, Región Metropolitana de Santiago 7910000, Chile
- **YELLOW `plaza-constitucion`** — status `NEEDS_CURATOR_REVIEW` — Ambiguous: multiple near-equal Mapbox candidates — provider: Constitución, Providencia, Región Metropolitana de Santiago 7500000, Chile
- **RED `museo-bellas-artes`** — status `SUSPICIOUS_OUT_OF_BBOX` — Low name overlap (0.00) with provider place_name — provider: Parque, Estación Central, Región Metropolitana de Santiago 9160000, Chile
- **YELLOW `estacion-mapocho`** — status `NEEDS_CURATOR_REVIEW` — Plausible hit (relevance=0.611, overlap=0.50) — curator review — provider: Mapocho, Santiago, Región Metropolitana de Santiago, Chile
- **YELLOW `cementerio-general`** — status `NEEDS_CURATOR_REVIEW` — kind=memory requires curator confirmation (overlap=1.00) — provider: Cementerio General, Recoleta, Región Metropolitana de Santiago, Chile
- **RED `villa-grimaldi`** — status `SUSPICIOUS_OUT_OF_BBOX` — Low name overlap (0.00) with provider place_name — provider: La Paz, Recoleta, Región Metropolitana de Santiago 8420000, Chile
- **RED `teatro-municipal`** — status `SUSPICIOUS_OUT_OF_BBOX` — Low name overlap (0.00) with provider place_name — provider: Los Agustinos, Ñuñoa, Región Metropolitana de Santiago 7750000, Chile
- **RED `casa-de-los-diez`** — status `SUSPICIOUS_OUT_OF_BBOX` — Low name overlap (0.00) with provider place_name — provider: Pasaje 10, Quinta Normal, Región Metropolitana de Santiago 8500000, Chile

## Curator UI

Open `docs/city-graph/gate-1b1-curator-review.html` for the full 30-node inspector.

## Gate 1B.2 blockers

1. Curator must resolve all YELLOW/RED launch nodes before any physical route composition.
2. Mapbox forward geocoding alone is insufficient for many Santiago memory/micro sites — expect manual pin placement for RED.
3. No CURATOR_APPROVED physical state exists yet.
4. Physical route generation remains disabled until curator-approved coordinates land in a later gate.
