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
const OLD = resolve(ROOT, 'docs/engine/gate-2a1-editorial-calibration.html')
const START = '0e5903e46598365fcee3142c2f374a45e49ece77'

describe('Gate 2A.1R-UI founder calibration cockpit', () => {
  const html = readFileSync(COCKPIT, 'utf8')
  const launch = loadEditorialCalibration()

  it('keeps product flags unchanged and does not globally approve curation', () => {
    expect(PHYSICAL_LAYER_V0_1_READY).toBe(true)
    expect(MULTIMODAL_PHYSICAL_GRAPH_READY).toBe(true)
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(NODE_UTILITY_V0_1_READY).toBe(true)
    expect(EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY).toBe(true)
    expect(EDITORIAL_CALIBRATION_CURATOR_APPROVED).toBe(false)
  })

  it('embeds full 104 inventory with Launch30 membership preserved', () => {
    const m = html.match(/const SOURCE = (\{[\s\S]*?\});\nconst (?:RATIONALES|THEME_META)/)
    expect(m).toBeTruthy()
    const source = JSON.parse(m![1]!)
    expect(source.records).toHaveLength(104)
    expect(source.sourceCheckpointSha).toBe(START)
    expect(['2A.1R-UI.2', '2A.1R-UI.1', '2A.1R-ADD-01R']).toContain(source.gate)
    expect(source.normalizationCorpus).toBe('SANTIAGO_LAUNCH30_V0_1')
    expect(source.defaultCorpusFilter).toBe('LAUNCH30')
    const launchRecs = source.records.filter((r: { launchCorpus?: boolean }) => r.launchCorpus)
    expect(launchRecs).toHaveLength(30)
    const by = new Map(launch.records.map((r) => [r.stgoId, r]))
    expect(source.records.map((r: { stgoId: string }) => r.stgoId)).toContain('STGO_104')
    expect(source.records.map((r: { stgoId: string }) => r.stgoId)).toContain('STGO_33')
    expect(source.records.map((r: { stgoId: string }) => r.stgoId)).toContain('STGO_23')
    expect(launchRecs.map((r: { stgoId: string }) => r.stgoId)).not.toContain('STGO_23')
    for (const r of launchRecs) {
      const o = by.get(r.stgoId)!
      expect(r.thematicVector).toEqual(o.thematicVector)
      expect(r.structuralMetrics).toEqual(o.structuralMetrics)
      expect(r.tier).toBe(o.tier)
    }
  })

  it('includes editable dimensions, dual ChronoWorth, persistence and approval workflow', () => {
    for (const t of ['T1A', 'T1B', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9']) {
      expect(html).toContain(t)
    }
    for (const m of ['anchor_density', 'heritage_depth', 'micro_reveal', 'polish']) {
      expect(html).toContain(m)
    }
    expect(html).toMatch(/rawChrono|0\.35/)
    expect(html).toContain('maxRaw')
    expect(html).toContain('localStorage')
    expect(html).toContain('Save Draft')
    expect(html).toContain('Approve POI')
    expect(html).toContain('MODIFIED_AFTER_APPROVAL')
    expect(html).toContain('Reset POI to Source')
    expect(html).toContain('Reset field')
    expect(html).toContain('launch30_founder_calibration.reviewed.v0.1.json')
    expect(html).toContain('santiago_founder_calibration.reviewed.v0.1.json')
    expect(html).toContain('cw_founder_cockpit_santiago104_v0_1')
    expect(html).toContain('INCOMPLETE_FOUNDER_REVIEW')
    expect(html).not.toContain('Approve All')
    expect(html).toContain('ORIGINAL → DRAFT')
    expect(html).toContain('orig-mark')
  })

  it('includes taxonomy / structural / M1–M5 handbooks', () => {
    const tm = html.match(/const THEME_META = (\[[\s\S]*?\]);\nconst METRIC_META/)
    const mm = html.match(/const METRIC_META = (\[[\s\S]*?\]);\nconst MODE_META/)
    const om = html.match(/const MODE_META = (\[[\s\S]*?\]);\nconst STORAGE_KEY/)
    expect(JSON.parse(tm![1]!)).toHaveLength(10)
    expect(JSON.parse(mm![1]!)).toHaveLength(4)
    expect(JSON.parse(om![1]!)).toHaveLength(5)
    expect(html).toMatch(/Taxonomy &amp; Scoring Guide|Taxonomy & Scoring Guide/)
    expect(html).toContain('YourMatch')
    expect(html).toContain('UNKNOWN never auto-becomes')
  })

  it('preserves historical QA HTML and does not add route/narrative composition', () => {
    expect(readFileSync(OLD, 'utf8').length).toBeGreaterThan(1000)
    expect(html).not.toMatch(/NarrativeEdgeScore|optimizeItinerary/)
    expect(html).not.toMatch(/BINARY_THEME_EXPANSION/)
  })
})
