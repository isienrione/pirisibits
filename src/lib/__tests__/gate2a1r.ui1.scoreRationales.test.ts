import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PHYSICAL_LAYER_V0_1_READY,
  PHYSICAL_ROUTE_GENERATION_ENABLED,
  NODE_UTILITY_V0_1_READY,
  EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY,
  EDITORIAL_CALIBRATION_CURATOR_APPROVED,
  MULTIMODAL_PHYSICAL_GRAPH_READY,
} from '@/src/lib/city-graph/flags'
import { loadEditorialCalibration } from '@/src/engine/loadCalibration'

const ROOT = resolve(__dirname, '../../..')
const COCKPIT = resolve(ROOT, 'docs/engine/gate-2a1-founder-calibration-cockpit.html')
const RATIONALES = resolve(ROOT, 'src/data/santiago/curation/launch30_score_rationales.v0.1.json')
const START = '0e5903e46598365fcee3142c2f374a45e49ece77'

const REQUIRED = [
  'T1A', 'T1B', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9',
  'anchor_density', 'heritage_depth', 'micro_reveal', 'polish',
  'tier', 'visitTimeMin', 'M1', 'M2', 'M3', 'M4', 'M5',
] as const

describe('Gate 2A.1R-UI.1 score rationale explainability', () => {
  const html = readFileSync(COCKPIT, 'utf8')
  const rationales = JSON.parse(readFileSync(RATIONALES, 'utf8'))
  const launch = loadEditorialCalibration()

  it('keeps product flags / routing unchanged', () => {
    expect(PHYSICAL_LAYER_V0_1_READY).toBe(true)
    expect(MULTIMODAL_PHYSICAL_GRAPH_READY).toBe(true)
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(NODE_UTILITY_V0_1_READY).toBe(true)
    expect(EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY).toBe(true)
    expect(EDITORIAL_CALIBRATION_CURATOR_APPROVED).toBe(false)
  })

  it('has 30/30 rationale coverage for required score fields', () => {
    expect(rationales.sourceCheckpointSha).toBe(START)
    expect(['2A.1R-UI.1', '2A.1R-ADD-01R', '2A.1R-UI.2']).toContain(rationales.gate)
    expect(rationales.records).toHaveLength(30)
    for (const rec of rationales.records) {
      const fields = new Map(rec.fields.map((f: { field: string }) => [f.field, f]))
      for (const f of REQUIRED) {
        expect(fields.has(f)).toBe(true)
        const row = fields.get(f) as {
          confidence: string
          whyThisScore: string
          whyNotHigher: string
          whyNotLower: string
          rationaleClass: string
          provenance: string
          evidenceLimitations?: string
        }
        expect(['HIGH', 'MEDIUM', 'LOW']).toContain(row.confidence)
        expect(row.whyThisScore.length).toBeGreaterThan(10)
        expect(row.whyNotHigher.length).toBeGreaterThan(5)
        expect(row.whyNotLower.length).toBeGreaterThan(5)
      }
      const visit = fields.get('visitTimeMin') as {
        rationaleClass: string
        provenance: string
        evidenceLimitations?: string
      }
      if (rec.stgoId === 'STGO_104') {
        expect(visit.rationaleClass).toBe('NO_PRIOR_SOURCE_RATIONALE')
        expect(visit.provenance).toBe('UNKNOWN')
      } else {
        expect(visit.rationaleClass).toBe('AI_PROPOSAL_RATIONALE')
        expect(`${visit.provenance} ${visit.evidenceLimitations || ''}`).toMatch(/AI_PROPOSED_UNVERIFIED/)
      }
    }
  })

  it('keeps ChronoWorth contribution math exact vs launch structural metrics', () => {
    const by = new Map(launch.records.map((r) => [r.stgoId, r]))
    for (const rec of rationales.records) {
      const row = by.get(rec.stgoId)
      expect(row).toBeTruthy()
      const m = row!.structuralMetrics
      expect(m).toBeTruthy()
      // STGO_104 (and any null-metric founder extension): ChronoWorth UNAVAILABLE — skip numeric math.
      const metricValues = [
        m!.heritage_depth,
        m!.anchor_density,
        m!.micro_reveal,
        m!.polish,
      ]
      if (metricValues.some((v) => v == null)) {
        expect(rec.chronoWorthBreakdown.status).toBe('UNAVAILABLE')
        expect(rec.chronoWorthBreakdown.raw).toBeNull()
        expect(rec.chronoWorthBreakdown.contributions).toEqual({
          heritage_depth: null,
          anchor_density: null,
          micro_reveal: null,
          polish: null,
        })
        continue
      }
      const expected = {
        heritage_depth: Math.round(m!.heritage_depth! * 35 * 10) / 10,
        anchor_density: Math.round(m!.anchor_density! * 30 * 10) / 10,
        micro_reveal: Math.round(m!.micro_reveal! * 20 * 10) / 10,
        polish: Math.round(m!.polish! * 15 * 10) / 10,
      }
      expect(rec.chronoWorthBreakdown.contributions).toEqual(expected)
      const raw =
        Math.round(
          (expected.heritage_depth +
            expected.anchor_density +
            expected.micro_reveal +
            expected.polish) *
            10,
        ) / 10
      expect(rec.chronoWorthBreakdown.raw).toBe(raw)
    }
  })

  it('embeds rationales and explainability UI without changing cockpit scores', () => {
    const sm = html.match(/const SOURCE = (\{[\s\S]*?\});\nconst RATIONALES/)
    const rm = html.match(/const RATIONALES = (\{[\s\S]*?\});\nconst THEME_META/)
    expect(sm).toBeTruthy()
    expect(rm).toBeTruthy()
    const source = JSON.parse(sm![1]!)
    const emb = JSON.parse(rm![1]!)
    expect([30, 104]).toContain(source.records.length)
    expect(source.sourceCheckpointSha).toBe(START)
    expect(['2A.1R-UI.1', '2A.1R-ADD-01R', '2A.1R-UI.2']).toContain(source.gate)
    expect([30, 104]).toContain(emb.records.length)

    const by = new Map(launch.records.map((r) => [r.stgoId, r]))
    for (const r of source.records) {
      if (!r.launchCorpus && source.records.length === 104) continue
      const o = by.get(r.stgoId)!
      expect(r.thematicVector).toEqual(o.thematicVector)
      expect(r.structuralMetrics).toEqual(o.structuralMetrics)
    }

    expect(html).toContain('Why this score?')
    expect(html).toContain('liveChronoBreakdown')
    expect(html).toContain('Current thematic interpretation')
    expect(html).toContain('Current structural interpretation')
    expect(html).toContain('founderChangeReasons')
    expect(html).toContain('proposalRationale')
    expect(html).toContain('exportField')
    expect(html).toContain('SOURCE RATIONALE')
    expect(html).not.toContain('Approve All')
    expect(html).not.toMatch(/NarrativeEdgeScore|optimizeItinerary/)
  })
})
