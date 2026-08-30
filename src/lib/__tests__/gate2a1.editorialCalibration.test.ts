import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PHYSICAL_LAYER_V0_1_READY,
  PHYSICAL_ROUTE_GENERATION_ENABLED,
  NODE_UTILITY_V0_1_READY,
  EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY,
  EDITORIAL_CALIBRATION_CURATOR_APPROVED,
} from '@/src/lib/city-graph/flags'
import { buildCandidatePool } from '@/src/engine/candidates/buildCandidatePool'
import { scoreNodeUtility } from '@/src/engine/scoring/nodeUtility'
import { loadLaunchNodes, loadSantiagoEngineNodes } from '@/src/engine/loadSantiagoNodes'
import {
  loadCanonicalSemanticCalibration,
  loadEditorialCalibration,
} from '@/src/engine/loadCalibration'
import { TRAVELER_FIXTURES } from '@/src/engine/fixtures/travelerFixtures'
import { DERIVED_THEME_TAG_THRESHOLD, THEME_CODES, deriveThemeTags } from '@/src/engine/taxonomy'
import type { ThemeCode } from '@/src/lib/city-graph/types'

const ROOT = resolve(__dirname, '../../..')
const SOURCE = resolve(ROOT, 'src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json')

describe('Gate 2A.1R founder semantic source restoration', () => {
  const source = JSON.parse(readFileSync(SOURCE, 'utf8'))
  const semantic = loadCanonicalSemanticCalibration()
  const launchCal = loadEditorialCalibration()
  const launch = loadLaunchNodes()
  const nodes = loadSantiagoEngineNodes()

  it('keeps routing off and marks proposed calibration ready (not curator-approved)', () => {
    expect(PHYSICAL_LAYER_V0_1_READY).toBe(true)
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(NODE_UTILITY_V0_1_READY).toBe(true)
    expect(EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY).toBe(true)
    expect(EDITORIAL_CALIBRATION_CURATOR_APPROVED).toBe(false)
  })

  it('validates founder source has exactly 103 STGO nodes with frozen provenance', () => {
    expect(source.nodes).toHaveLength(103)
    expect(source.source_node_count).toBe(103)
    for (const n of source.nodes) {
      expect(n.provenance.source_fields_are_frozen_input).toBe(true)
      expect(n.provenance.derived_fields_are_ai_proposals).toBe(true)
      expect(n.source_calibration.structural_metrics).toBeTruthy()
      expect(n.source_calibration.vectors.t2).toBeDefined()
    }
  })

  it('restores canonical semantic inventory as 105 (103 seed + STGO_104/105 extensions)', () => {
    expect(semantic.recordCount).toBe(105)
    expect(semantic.records).toHaveLength(105)
    expect(['2A.1R', '2A.1R-ADD-01R', '2E.4']).toContain(semantic.gate)
    expect(semantic.sourceDataset).toMatch(/SANTIAGO_ENGINE_DATASET_V0.1/)
    expect(semantic.records.map((r) => r.stgoId)).toContain('STGO_104')
    expect(semantic.records.map((r) => r.stgoId)).toContain('STGO_105')
  })

  it('maps launch 30 founder-precalibrated vectors; STGO_104 remains UNKNOWN/null', () => {
    expect(launch).toHaveLength(30)
    expect(launch.map((n) => n.stgoId)).toContain('STGO_104')
    expect(launch.map((n) => n.stgoId)).toContain('STGO_33')
    expect(launch.map((n) => n.stgoId)).not.toContain('STGO_23')
    expect(launchCal.demoNameMatches ?? 0).toBe(0)

    const calibrated = launchCal.records.filter((r) => r.stgoId !== 'STGO_104')
    const bolsa = launchCal.records.find((r) => r.stgoId === 'STGO_104')!
    expect(bolsa.thematicVectorProvenance).toBe('UNKNOWN')
    expect(bolsa.structuralMetricsProvenance).toBe('UNKNOWN')
    expect(bolsa.chronoWorth.status).toBe('UNAVAILABLE')
    expect(bolsa.chronoWorth.proposed).toBeNull()
    for (const code of THEME_CODES) {
      expect(bolsa.thematicVector[code]).toBeNull()
    }
    for (const key of ['heritage_depth', 'anchor_density', 'micro_reveal', 'polish']) {
      expect(bolsa.structuralMetrics?.[key] ?? null).toBeNull()
    }

    for (const n of launch.filter((x) => x.stgoId !== 'STGO_104')) {
      expect(n.thematicVector).toBeTruthy()
      for (const code of THEME_CODES) {
        const v = Number(n.thematicVector![code])
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
    }
    for (const r of calibrated) {
      expect(r.thematicVectorProvenance).toBe('FOUNDER_PRECALIBRATED')
      expect(r.structuralMetricsProvenance).toBe('FOUNDER_PRECALIBRATED')
      expect(r.tierProvenance).toBe('FOUNDER_PRECALIBRATED')
      expect(r.demoPoiIdMatched ?? null).toBeNull()
      expect(JSON.stringify(r.sources || [])).not.toMatch(/BINARY_THEME_EXPANSION|pois\.ts|DEMO_POI/)
    }

    const stgo33 = launchCal.records.find((r) => r.stgoId === 'STGO_33')!
    expect(stgo33.displayName).toBe('Gárgola de Luciano K')
    expect(stgo33.canonicalName ?? stgo33.displayName).toBe('Gárgola de Luciano K')
    expect(stgo33.displayName).not.toMatch(/Funicular/i)
    expect(stgo33.legacyAlias?.alias).toBe('Kulczewski Funicular Gargoyle')
    expect(stgo33.legacyAlias?.status).toMatch(/deprecated/i)
    expect(stgo33.launchRuntimeDisposition).toBe('ACTIVE_LAUNCH')
  })

  it('restores T2 Culinary from founder source (no heuristic override)', () => {
    const sourceById = new Map(source.nodes.map((n: { poi_id: string }) => [n.poi_id, n]))
    for (const r of launchCal.records.filter((x) => x.stgoId !== 'STGO_104')) {
      const src = sourceById.get(r.stgoId) as {
        source_calibration: { vectors: { t2: number } }
      }
      expect(r.thematicVector.T2).toBe(src.source_calibration.vectors.t2)
    }
    const culinary = launch.filter((n) => (n.thematicVector?.T2 ?? 0) >= 0.7)
    expect(culinary.map((n) => n.stgoId)).toEqual(
      expect.arrayContaining(['STGO_20', 'STGO_21', 'STGO_28', 'STGO_34', 'STGO_35']),
    )
  })

  it('restores structural metrics exactly from founder source for seed nodes', () => {
    const sourceById = new Map(source.nodes.map((n: { poi_id: string }) => [n.poi_id, n]))
    for (const r of semantic.records.filter(
      (x) => x.stgoId !== 'STGO_104' && x.stgoId !== 'STGO_105',
    )) {
      const src = sourceById.get(r.stgoId) as {
        source_calibration: {
          structural_metrics: Record<string, number>
        }
      }
      expect(r.structuralMetrics).toEqual(src.source_calibration.structural_metrics)
    }
  })

  it('uses zero binary-0.7 fallback and zero pois.ts canonical scoring dependency', () => {
    expect(launchCal.demoNameMatches ?? 0).toBe(0)
    for (const r of launchCal.records.filter((x) => x.stgoId !== 'STGO_104')) {
      expect(r.demoPoiIdMatched ?? null).toBeNull()
      expect(r.thematicVectorProvenance).toBe('FOUNDER_PRECALIBRATED')
      const types = (r.sources || []).map((s) => String((s as { type?: string }).type || ''))
      expect(types.every((t) => t === 'FOUNDER_PRECALIBRATED')).toBe(true)
    }
    const scored = scoreNodeUtility(
      launch.find((n) => n.stgoId === 'STGO_01')!,
      TRAVELER_FIXTURES.B_civic_history,
    )
    expect(scored.components.interests.provenance).toMatch(/continuous thematicVector/)
    expect(scored.components.interests.provenance).not.toMatch(/binary theme fallback/)
  })

  it('recomputes ChronoWorth from founder structural metrics as AI proposal', () => {
    for (const r of launchCal.records) {
      const sm = r.structuralMetrics!
      if (
        sm.heritage_depth == null ||
        sm.anchor_density == null ||
        sm.micro_reveal == null ||
        sm.polish == null
      ) {
        expect(r.chronoWorth.status).toBe('UNAVAILABLE')
        expect(r.chronoWorth.proposed).toBeNull()
        expect(r.chronoWorth.approved).toBeNull()
        continue
      }
      const raw =
        100 * (0.35 * sm.heritage_depth + 0.3 * sm.anchor_density + 0.2 * sm.micro_reveal + 0.15 * sm.polish)
      // Match Python round-half-even used by the builder.
      const expected = Math.round(raw - Math.sign(raw) * Number.EPSILON)
      const pyRound = Number.parseInt(
        (Math.round(Math.abs(raw)) === Math.abs(raw) - 0.5 && Math.round(Math.abs(raw)) % 2 === 1
          ? Math.floor(Math.abs(raw))
          : Math.round(Math.abs(raw))
        ).toString(),
        10,
      ) * Math.sign(raw || 1)
      // Prefer exact contributions; allow ±1 for half-even edge cases.
      expect(r.chronoWorth.proposed).toBeGreaterThanOrEqual(Math.floor(raw))
      expect(r.chronoWorth.proposed).toBeLessThanOrEqual(Math.ceil(raw))
      expect(Math.abs((r.chronoWorth.proposed as number) - raw)).toBeLessThanOrEqual(0.5000001)
      expect(r.chronoWorth.approved).toBeNull()
      expect(String(r.chronoWorth.provenance)).toMatch(/AI_PROPOSED/)
      expect(r.chronoWorth.contributions).toMatchObject({
        heritage_depth: sm.heritage_depth,
        anchor_density: sm.anchor_density,
        micro_reveal: sm.micro_reveal,
        polish: sm.polish,
      })
      void expected
      void pyRound
    }
  })

  it('preserves flag presence/absence and founder sensitive-memory list', () => {
    expect(semantic.sensitiveMemorySourceList?.map((s: { stgoId: string }) => s.stgoId).sort()).toEqual(
      ['STGO_04', 'STGO_07', 'STGO_36', 'STGO_48', 'STGO_51'].sort(),
    )
    const stgo19 = launchCal.records.find((r) => r.stgoId === 'STGO_19')!
    expect(stgo19.sensitiveMemory.value).not.toBe(true)
    expect(stgo19.sensitiveMemory.status).toBe('UNKNOWN')
    const stgo04 = launchCal.records.find((r) => r.stgoId === 'STGO_04')!
    expect(stgo04.sensitiveMemory).toMatchObject({ value: true, status: 'PRESENT', provenance: 'FOUNDER_PRECALIBRATED' })
  })

  it('derives ThemeCode tags from founder vectors only', () => {
    for (const r of launchCal.records.filter((x) => x.stgoId !== 'STGO_104')) {
      expect(r.derivedThemeTags).toEqual(
        deriveThemeTags(r.thematicVector as Record<ThemeCode, number>, DERIVED_THEME_TAG_THRESHOLD),
      )
    }
    const bolsa = launchCal.records.find((r) => r.stgoId === 'STGO_104')!
    expect(bolsa.derivedThemeTags).toEqual([])
  })

  it('NodeUtility culinary fixture ranks founder T2 nodes first', () => {
    const pool = buildCandidatePool(nodes, TRAVELER_FIXTURES.C_food_street_life)
    const top5 = pool.candidates.slice(0, 5).map((c) => c.nodeId)
    expect(top5.every((id) => ['STGO_20', 'STGO_21', 'STGO_28', 'STGO_34', 'STGO_35', 'STGO_24'].includes(id))).toBe(
      true,
    )
    expect(top5).toEqual(expect.arrayContaining(['STGO_34', 'STGO_20']))
  })

  it('keeps STGO_23 out of launch, STGO_33 active (not semantic-excluded), backlog 75, no route/NarrativeEdge', () => {
    const pool = buildCandidatePool(nodes, TRAVELER_FIXTURES.A_first_time_essentials)
    expect(pool.evaluatedLaunchCount).toBe(30)
    expect(pool.excludedIds).not.toContain('STGO_23')
    expect(pool.candidates.some((c) => c.nodeId === 'STGO_23')).toBe(false)
    const stgo33 = launch.find((n) => n.stgoId === 'STGO_33')!
    expect(stgo33.launchRuntimeDisposition).toBe('ACTIVE_LAUNCH')
    expect(stgo33.launchRuntimeDisposition).not.toBe('RUNTIME_EXCLUDED_SEMANTIC')
    // Still physicalRouteGenerationEligible=false → pool-excluded for routing eligibility.
    expect(pool.excludedIds).toContain('STGO_33')
    expect(pool.backlogLeakCount).toBe(75)
    const blob = JSON.stringify(pool)
    expect(blob).not.toMatch(/NarrativeEdgeScore|optimizeItinerary|ArcQuality/)
  })
})
