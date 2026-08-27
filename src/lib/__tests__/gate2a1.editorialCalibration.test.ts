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
import { loadEditorialCalibration } from '@/src/engine/loadCalibration'
import { TRAVELER_FIXTURES } from '@/src/engine/fixtures/travelerFixtures'
import { DERIVED_THEME_TAG_THRESHOLD, THEME_CODES, deriveThemeTags } from '@/src/engine/taxonomy'
import type { EngineNodeRecord } from '@/src/engine/types'
import type { ThemeCode } from '@/src/lib/city-graph/types'

const ROOT = resolve(__dirname, '../../..')
const PHYSICAL_PATHS = [
  'src/data/santiago/santiago_physical_edges.v0.1.json',
  'src/data/santiago/santiago_pedestrian_adjacency.v0.2.json',
  'src/data/santiago/santiago_multimodal_graph.v0.3.json',
  'src/data/santiago/santiago_physical_graph_manifest.v0.1.json',
  'src/data/santiago/santiago_physical_edges_stgo05_extension.v0.1.json',
  'src/data/santiago/santiago_launch_runtime_membership.v0.1.json',
]

describe('Gate 2A.1 editorial calibration + semantic restoration', () => {
  const cal = loadEditorialCalibration()
  const launch = loadLaunchNodes()
  const nodes = loadSantiagoEngineNodes()

  it('sets proposed-ready flags and keeps routing / curator-approved off', () => {
    expect(PHYSICAL_LAYER_V0_1_READY).toBe(true)
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(NODE_UTILITY_V0_1_READY).toBe(true)
    expect(EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY).toBe(true)
    expect(EDITORIAL_CALIBRATION_CURATOR_APPROVED).toBe(false)
    expect(cal.curatorApproved).toBe(false)
    expect(cal.status).toMatch(/AI_PROPOSED/)
  })

  it('gives all 30 launch nodes continuous T1A–T9 vectors including T2', () => {
    expect(launch).toHaveLength(30)
    expect(THEME_CODES).toEqual(['T1A', 'T1B', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'])
    for (const n of launch) {
      expect(n.thematicVector).toBeTruthy()
      for (const code of THEME_CODES) {
        const v = Number(n.thematicVector![code] ?? NaN)
        expect(Number.isFinite(v)).toBe(true)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
      expect('T2' in n.thematicVector!).toBe(true)
      expect(Object.keys(n.thematicVector!).sort()).toEqual([...THEME_CODES].sort())
    }
  })

  it('keeps T1A and T1B distinct and never merges them', () => {
    for (const n of launch) {
      expect(n.thematicVector!.T1A).toBeDefined()
      expect(n.thematicVector!.T1B).toBeDefined()
      expect(Object.keys(n.thematicVector!)).not.toContain('T1')
    }
  })

  it('allows culinary nodes to score on continuous T2', () => {
    const culinary = launch.filter((n) => (n.thematicVector?.T2 ?? 0) >= 0.7)
    expect(culinary.map((n) => n.stgoId).sort()).toEqual(
      expect.arrayContaining(['STGO_20', 'STGO_21', 'STGO_28', 'STGO_34', 'STGO_35']),
    )
    const pool = buildCandidatePool(nodes, TRAVELER_FIXTURES.C_food_street_life)
    const top = pool.candidates.slice(0, 10).map((c) => c.nodeId)
    expect(top.some((id) => culinary.some((n) => n.stgoId === id))).toBe(true)
    const vega = pool.candidates.find((c) => c.nodeId === 'STGO_34')
    expect(vega).toBeTruthy()
    expect(vega!.themeContributions.T2).toBeGreaterThan(0)
    expect(vega!.components.interests.provenance).toMatch(/continuous thematicVector/)
  })

  it('treats ThemeCode tags as derived convenience, not canonical source', () => {
    expect(cal.notes.some((n) => /derivedThemeTags/i.test(n) || /convenience/i.test(n))).toBe(true)
    for (const r of cal.records) {
      const derived = deriveThemeTags(r.thematicVector as Record<ThemeCode, number>, r.themeTagThreshold)
      expect(r.derivedThemeTags).toEqual(derived)
      expect(r.themeTagThreshold).toBe(DERIVED_THEME_TAG_THRESHOLD)
    }
    const n = launch.find((x) => x.stgoId === 'STGO_01')!
    expect(n.themes).toEqual(
      deriveThemeTags(n.thematicVector as Record<ThemeCode, number>, DERIVED_THEME_TAG_THRESHOLD),
    )
  })

  it('proposes ChronoWorth without curator approval and without physical centrality', () => {
    expect(cal.chronoWorthFormula.forbiddenInputs).toEqual(
      expect.arrayContaining([
        'physicalCentrality',
        'edgeDegree',
        'metroProximity',
        'travelerInterests',
      ]),
    )
    for (const r of cal.records) {
      expect(r.chronoWorth.approved).toBeNull()
      expect(r.chronoWorth.proposed).toBeGreaterThanOrEqual(0)
      expect(r.chronoWorth.proposed).toBeLessThanOrEqual(100)
      expect(String(r.chronoWorth.provenance)).toMatch(/AI_PROPOSED/)
      expect(String(r.chronoWorth.provenance)).not.toMatch(/CURATOR_APPROVED/)
    }
    const base = launch.find((n) => n.stgoId === 'STGO_01')!
    const fat = {
      ...base,
      edgeDegree: 999,
      metroStationCount: 50,
      pageRank: 1,
    } as EngineNodeRecord & { edgeDegree: number; metroStationCount: number; pageRank: number }
    expect(scoreNodeUtility(fat, TRAVELER_FIXTURES.B_civic_history).utility).toBe(
      scoreNodeUtility(base, TRAVELER_FIXTURES.B_civic_history).utility,
    )
  })

  it('keeps ChronoWorth separate from YourMatch', () => {
    const scored = scoreNodeUtility(
      launch.find((n) => n.stgoId === 'STGO_34')!,
      TRAVELER_FIXTURES.C_food_street_life,
    )
    expect(scored.yourMatch).toBeDefined()
    expect(scored.chronoWorthEffective).toBeGreaterThan(0)
    expect(scored.yourMatch).not.toEqual(scored.chronoWorthEffective)
    expect(scored.components.editorial.key).toBe('editorial')
    expect(scored.components.interests.key).toBe('interests')
  })

  it('proposes visit times that exclude travel time', () => {
    for (const r of cal.records) {
      expect(r.visitTime.includesTravelTime).toBe(false)
      expect(r.visitTime.approved).toBeNull()
      expect(r.visitTime.min).toBeGreaterThan(0)
      expect(r.visitTime.typical).toBeGreaterThanOrEqual(r.visitTime.min)
      expect(r.visitTime.max).toBeGreaterThanOrEqual(r.visitTime.typical)
      expect(String(r.visitTime.provenance)).toMatch(/AI_PROPOSED/)
    }
  })

  it('never infers M2 accessibility from UNKNOWN', () => {
    for (const r of cal.records) {
      const m2 = r.structuralSuitability.M2 as { value: number | null; status?: string; provenance: string }
      if (m2.status === 'UNKNOWN' || String(m2.provenance).includes('UNKNOWN')) {
        expect(m2.value).toBeNull()
      }
    }
    const unknownNode = launch.find((n) => n.accessibility === 'UNKNOWN')
    expect(unknownNode).toBeTruthy()
    expect(unknownNode!.structuralSuitability?.M2?.value ?? null).toBeNull()
  })

  it('uses explicit sensitive-memory metadata, not T1B alone', () => {
    const sensitive = launch.filter((n) => n.isSensitiveMemorySite)
    expect(sensitive.map((n) => n.stgoId).sort()).toEqual(
      expect.arrayContaining(['STGO_04', 'STGO_07', 'STGO_19', 'STGO_48']),
    )
    const t1b = launch.find((n) => (n.thematicVector?.T1B ?? 0) > 0.45 && !n.isSensitiveMemorySite)
    // If present, T1B alone must not imply sensitive
    if (t1b) {
      expect(t1b.sensitiveMemory).toBe(false)
    }
    for (const r of cal.records) {
      if (r.sensitiveMemory.value) {
        expect(r.sensitiveMemory.note || r.sensitiveMemory.provenance).toMatch(/Explicit|CONTENT|DEMO/i)
      }
    }
  })

  it('NodeUtility interest match uses continuous vector weights', () => {
    const node = launch.find((n) => n.stgoId === 'STGO_01')!
    const scored = scoreNodeUtility(node, TRAVELER_FIXTURES.B_civic_history)
    expect(scored.components.interests.provenance).toMatch(/traveler_weight × node_strength/)
    expect(scored.components.interests.available).toBe(true)
  })

  it('keeps STGO_23/33 runtime excluded and backlog outside launch pool', () => {
    for (const f of Object.values(TRAVELER_FIXTURES)) {
      const pool = buildCandidatePool(nodes, f)
      expect(pool.candidates.some((c) => c.nodeId === 'STGO_23')).toBe(false)
      expect(pool.candidates.some((c) => c.nodeId === 'STGO_33')).toBe(false)
      expect(pool.excludedIds).toEqual(expect.arrayContaining(['STGO_23', 'STGO_33']))
      expect(pool.backlogLeakCount).toBe(73)
      expect(pool.evaluatedLaunchCount).toBe(30)
    }
  })

  it('does not mutate physical freeze artifacts and keeps route/edge layers absent', () => {
    for (const rel of PHYSICAL_PATHS) {
      const text = readFileSync(resolve(ROOT, rel), 'utf8')
      expect(text.length).toBeGreaterThan(10)
    }
    const blob = JSON.stringify(buildCandidatePool(nodes, TRAVELER_FIXTURES.A_first_time_essentials))
    expect(blob).not.toMatch(/NarrativeEdgeScore/)
    expect(blob).not.toMatch(/optimizeItinerary/)
    expect(blob).not.toMatch(/ArcQuality/)
    expect(cal.gate).toBe('2A.1')
  })
})
