import { describe, expect, it } from 'vitest'
import {
  PHYSICAL_LAYER_V0_1_READY,
  PHYSICAL_ROUTE_GENERATION_ENABLED,
  NODE_UTILITY_V0_1_READY,
} from '@/src/lib/city-graph/flags'
import { buildCandidatePool } from '@/src/engine/candidates/buildCandidatePool'
import { evaluateNodeEligibility } from '@/src/engine/eligibility/evaluateNodeEligibility'
import { scoreNodeUtility } from '@/src/engine/scoring/nodeUtility'
import { loadLaunchNodes, loadSantiagoEngineNodes } from '@/src/engine/loadSantiagoNodes'
import { TRAVELER_FIXTURES } from '@/src/engine/fixtures/travelerFixtures'
import { THEME_CODES } from '@/src/engine/taxonomy'
import { COMPONENT_CAPS, NODE_UTILITY_MAX } from '@/src/engine/scoring/constants'
import type { EngineNodeRecord } from '@/src/engine/types'
import { normalizeTraveler } from '@/src/engine/traveler'

describe('Gate 2A node utility foundation', () => {
  const nodes = loadSantiagoEngineNodes()
  const launch = loadLaunchNodes()

  it('keeps physical routing off and marks node utility ready', () => {
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(PHYSICAL_LAYER_V0_1_READY).toBe(true)
    expect(NODE_UTILITY_V0_1_READY).toBe(true)
  })

  it('evaluates launch corpus only; STGO_23 backlog-excluded; STGO_33/104 active but physically ineligible', () => {
    const pool = buildCandidatePool(nodes, TRAVELER_FIXTURES.A_first_time_essentials)
    expect(pool.evaluatedLaunchCount).toBe(30)
    expect(launch.map((n) => n.stgoId)).toContain('STGO_33')
    expect(launch.map((n) => n.stgoId)).toContain('STGO_104')
    expect(launch.map((n) => n.stgoId)).not.toContain('STGO_23')
    expect(pool.candidates.some((c) => c.nodeId === 'STGO_23')).toBe(false)
    // STGO_23 left active launch (backlog / RUNTIME_EXCLUDED_RESEARCH) — not scored into pool exclusions.
    expect(pool.excludedIds).not.toContain('STGO_23')
    // STGO_33 restored to ACTIVE_LAUNCH (not RUNTIME_EXCLUDED_SEMANTIC) but still physicalRouteGenerationEligible=false.
    const stgo33 = launch.find((n) => n.stgoId === 'STGO_33')!
    expect(stgo33.launchRuntimeDisposition).toBe('ACTIVE_LAUNCH')
    expect(stgo33.launchRuntimeDisposition).not.toBe('RUNTIME_EXCLUDED_SEMANTIC')
    expect(stgo33.physicalRouteGenerationEligible).toBe(false)
    expect(pool.excludedIds).toContain('STGO_33')
    expect(pool.excludedIds).toContain('STGO_104')
    expect(pool.candidates.some((c) => c.nodeId === 'STGO_33')).toBe(false)
    expect(pool.candidates.some((c) => c.nodeId === 'STGO_104')).toBe(false)
    const backlogIds = new Set(nodes.filter((n) => !n.launchCorpus).map((n) => n.stgoId))
    expect(backlogIds.has('STGO_23')).toBe(true)
    expect(pool.candidates.some((c) => backlogIds.has(c.nodeId))).toBe(false)
    expect(pool.backlogLeakCount).toBe(74)
  })

  it('hard-excludes explicit sensitive-memory sites without opt-in (not T1B alone)', () => {
    const pool = buildCandidatePool(nodes, TRAVELER_FIXTURES.A_first_time_essentials)
    // Founder source sensitive launch nodes: STGO_04, STGO_07, STGO_48 (STGO_19 is NOT founder-sensitive)
    expect(pool.excludedIds).toEqual(expect.arrayContaining(['STGO_04', 'STGO_07', 'STGO_48']))
    expect(pool.excludedIds).not.toContain('STGO_19')
    const t1bOnly = launch.find((n) => n.stgoId === 'STGO_02')!
    const el = evaluateNodeEligibility(t1bOnly, TRAVELER_FIXTURES.A_first_time_essentials)
    if ((t1bOnly.themes || []).includes('T1B') && !t1bOnly.isSensitiveMemorySite) {
      expect(el.eligible).toBe(true)
      expect(el.warnings.some((w) => w.code === 'SENSITIVE_THEME_WITHOUT_OPT_IN')).toBe(true)
    }
  })

  it('does not treat UNKNOWN accessibility as accessible under M2', () => {
    const node = launch.find((n) => n.stgoId === 'STGO_01')!
    const el = evaluateNodeEligibility(node, TRAVELER_FIXTURES.H_accessibility_sensitive)
    expect(el.hardFailures.some((f) => f.code === 'EXPLICIT_ACCESSIBILITY_INCOMPATIBLE')).toBe(false)
    if (node.accessibility === 'UNKNOWN' || node.accessibility == null) {
      expect(el.warnings.some((w) => w.code === 'ACCESSIBILITY_UNKNOWN')).toBe(true)
    }
  })

  it('hard-fails only on explicit accessibility incompatibility', () => {
    const base = launch.find((n) => n.stgoId === 'STGO_01')!
    const blocked: EngineNodeRecord = { ...base, step_free_certified: false, stepFree: false, accessibility: 'KNOWN_NOT_STEP_FREE' }
    const el = evaluateNodeEligibility(blocked, TRAVELER_FIXTURES.H_accessibility_sensitive)
    expect(el.eligible).toBe(false)
    expect(el.hardFailures.some((f) => f.code === 'EXPLICIT_ACCESSIBILITY_INCOMPATIBLE')).toBe(true)
  })

  it('uses proposed ChronoWorth without marking it curator-approved', () => {
    const node = launch.find((n) => n.stgoId === 'STGO_01')!
    expect(node.chronoWorthApproved).toBeNull()
    expect(node.chronoWorthProposed).toBeGreaterThan(0)
    expect(String(node.chronoWorthProvenance)).toMatch(/AI_PROPOSED/)
    const scored = scoreNodeUtility(node, TRAVELER_FIXTURES.B_civic_history)
    expect(scored.chronoWorthEffective).toBe(node.chronoWorthEffective)
    expect(scored.components.editorial.available).toBe(true)
    expect(scored.yourMatch).toBeGreaterThanOrEqual(0)
    expect(scored.yourMatch).not.toBe(scored.chronoWorthEffective)
  })

  it('keeps STGO_104 ChronoWorth UNAVAILABLE (null semantics, not zero)', () => {
    const node = launch.find((n) => n.stgoId === 'STGO_104')!
    expect(node.chronoWorthProposed).toBeNull()
    expect(node.chronoWorthApproved).toBeNull()
    expect(node.chronoWorthEffective).toBeNull()
    expect(String(node.chronoWorthProvenance)).toMatch(/UNAVAILABLE/)
    for (const code of THEME_CODES) {
      expect(node.thematicVector?.[code] ?? null).toBeNull()
    }
    const scored = scoreNodeUtility(node, TRAVELER_FIXTURES.B_civic_history)
    expect(scored.chronoWorthEffective).toBeNull()
    expect(scored.components.editorial.available).toBe(false)
  })

  it('ranks civic/history travelers toward T1A/T3 tagged anchors when tags support it', () => {
    const pool = buildCandidatePool(nodes, TRAVELER_FIXTURES.B_civic_history)
    const top = pool.candidates.slice(0, 8).map((c) => c.nodeId)
    expect(top).toContain('STGO_01')
    const plaza = pool.candidates.find((c) => c.nodeId === 'STGO_01')!
    expect(plaza.matchedThemes.length).toBeGreaterThan(0)
    expect(plaza.utility).toBeGreaterThan(0)
    expect(plaza.utility).toBeLessThanOrEqual(NODE_UTILITY_MAX)
  })

  it('boosts memory traveler matches on T1B nodes when opt-in is true', () => {
    const pool = buildCandidatePool(nodes, TRAVELER_FIXTURES.E_memory_human_rights)
    const memoria = pool.candidates.find((c) => c.nodeId === 'STGO_48')
    expect(memoria).toBeTruthy()
    expect(memoria!.matchedThemes).toContain('T1B')
    expect(memoria!.themeContributions.T1B).toBeGreaterThan(0)
  })

  it('keeps thematic preference soft — T1B nodes without sensitive flag stay eligible without opt-in', () => {
    const node = launch.find((n) => n.stgoId === 'STGO_11')! // Yungay — not in sensitive list
    const el = evaluateNodeEligibility(node, TRAVELER_FIXTURES.A_first_time_essentials)
    expect(el.hardFailures.some((f) => f.code === 'EXPLICIT_SENSITIVE_MEMORY_WITHOUT_OPT_IN')).toBe(false)
  })

  it('is deterministic under repeated ranking', () => {
    const a = buildCandidatePool(nodes, TRAVELER_FIXTURES.D_architecture_aesthetics)
    const b = buildCandidatePool(nodes, TRAVELER_FIXTURES.D_architecture_aesthetics)
    expect(a.candidates.map((c) => c.nodeId)).toEqual(b.candidates.map((c) => c.nodeId))
    expect(a.candidates.map((c) => c.utility)).toEqual(b.candidates.map((c) => c.utility))
  })

  it('tie-breaks by canonical STGO ID', () => {
    const traveler = normalizeTraveler({
      interests: [],
      rhythm: 'equilibrado',
      timeBudgetMinutes: 105,
    })
    const pool = buildCandidatePool(nodes, traveler)
    for (let i = 1; i < pool.candidates.length; i += 1) {
      const prev = pool.candidates[i - 1]
      const cur = pool.candidates[i]
      if (prev.utility === cur.utility) {
        expect(prev.nodeId < cur.nodeId).toBe(true)
      } else {
        expect(prev.utility).toBeGreaterThanOrEqual(cur.utility)
      }
    }
  })

  it('does not invoke route composition APIs in the candidate pool payload', () => {
    const pool = buildCandidatePool(nodes, TRAVELER_FIXTURES.F_discovery_forward)
    expect(pool.gate).toBe('2A')
    const blob = JSON.stringify(pool)
    expect(blob).not.toMatch(/optimizeItinerary/)
    expect(blob).not.toMatch(/ArcQuality/)
  })

  it('does not raise utility from fabricated physical centrality fields', () => {
    const base = launch.find((n) => n.stgoId === 'STGO_25')!
    const fat = { ...base, edgeDegree: 999, metroStationCount: 50 } as EngineNodeRecord & {
      edgeDegree: number
      metroStationCount: number
    }
    const a = scoreNodeUtility(base, TRAVELER_FIXTURES.D_architecture_aesthetics)
    const b = scoreNodeUtility(fat, TRAVELER_FIXTURES.D_architecture_aesthetics)
    expect(b.utility).toBe(a.utility)
  })

  it('preserves taxonomy codes including culinary T2 and component caps', () => {
    expect(THEME_CODES).toEqual(['T1A', 'T1B', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'])
    const sum =
      COMPONENT_CAPS.editorial +
      COMPONENT_CAPS.interests +
      COMPONENT_CAPS.structural +
      COMPONENT_CAPS.discovery +
      COMPONENT_CAPS.context
    expect(sum).toBe(100)
  })

  it('treats M1–M5 as structural, not theme interests', () => {
    const t = TRAVELER_FIXTURES.G_express_time_boxed
    expect(t.themeWeights.T1A).toBeGreaterThan(0)
    expect((t.themeWeights as Record<string, number>).M1).toBeUndefined()
    expect(t.expressPreference).toBe(true)
  })
})
