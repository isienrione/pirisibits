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
const FULL_RATIONALES = resolve(ROOT, 'src/data/santiago/curation/santiago_score_rationales.v0.1.json')
const LAUNCH_RATIONALES = resolve(ROOT, 'src/data/santiago/curation/launch30_score_rationales.v0.1.json')
const SEMANTIC = resolve(ROOT, 'src/data/santiago/santiago_semantic_calibration.v0.1.json')
const START = '0e5903e46598365fcee3142c2f374a45e49ece77'

type SourceRec = {
  stgoId: string
  displayName: string
  canonicalName?: string
  shortName?: string | null
  commune?: string | null
  launchCorpus?: boolean
  inventoryProvenance?: string
  thematicVector: Record<string, number | null>
  structuralMetrics: Record<string, number | null>
  chronoWorthProposed?: number | null
}

function parseSource(html: string) {
  const m = html.match(/const SOURCE = (\{[\s\S]*?\});\nconst RATIONALES/)
  expect(m).toBeTruthy()
  return JSON.parse(m![1]!) as {
    gate: string
    sourceCheckpointSha: string
    defaultCorpusFilter: string
    inventoryCounts: Record<string, number>
    launchCorpusIds: string[]
    records: SourceRec[]
    normalizationCorpus: string
    normalizationCorpusAll: string
  }
}

/** Pure helpers mirroring cockpit filter/search/sort/migration contracts for regression tests. */
function matchesCorpus(r: SourceRec, corpusFilter: string) {
  if (corpusFilter === 'LAUNCH30') return !!r.launchCorpus
  if (corpusFilter === 'NONLAUNCH') return !r.launchCorpus
  return true
}

function searchHits(records: SourceRec[], q: string, corpusFilter: string) {
  const needle = q.toLowerCase().trim()
  return records.filter((r) => {
    if (!matchesCorpus(r, corpusFilter)) return false
    if (!needle) return true
    const hay = [r.stgoId, r.displayName, r.canonicalName, r.shortName, r.commune]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(needle)
  })
}

function sortRawUnknownLast(
  ids: string[],
  raws: Record<string, number | null>,
) {
  return [...ids].sort((a, b) => {
    const ra = raws[a]
    const rb = raws[b]
    if (ra == null && rb == null) return a.localeCompare(b)
    if (ra == null) return 1
    if (rb == null) return -1
    return rb - ra || a.localeCompare(b)
  })
}

function migrateLegacyDrafts(
  allIds: string[],
  legacyDrafts: Record<string, { founderApproval?: string; founderChangeReasons?: Record<string, string>; founderNote?: string }>,
) {
  const drafts: Record<string, unknown> = {}
  for (const id of allIds) {
    drafts[id] = {
      founderApproval: 'UNREVIEWED',
      founderChangeReasons: {},
      founderNote: '',
    }
  }
  for (const [id, d] of Object.entries(legacyDrafts)) {
    if (!drafts[id]) continue
    drafts[id] = {
      ...(drafts[id] as object),
      ...d,
      founderChangeReasons: {
        ...((drafts[id] as { founderChangeReasons?: object }).founderChangeReasons || {}),
        ...(d.founderChangeReasons || {}),
      },
    }
  }
  return drafts
}

describe('Gate 2A.1R-UI.2 expand curator to full Santiago inventory', () => {
  const html = readFileSync(COCKPIT, 'utf8')
  const source = parseSource(html)
  const launch = loadEditorialCalibration()
  const fullRat = JSON.parse(readFileSync(FULL_RATIONALES, 'utf8'))
  const launchRat = JSON.parse(readFileSync(LAUNCH_RATIONALES, 'utf8'))
  const semantic = JSON.parse(readFileSync(SEMANTIC, 'utf8'))

  it('keeps product flags unchanged', () => {
    expect(PHYSICAL_LAYER_V0_1_READY).toBe(true)
    expect(MULTIMODAL_PHYSICAL_GRAPH_READY).toBe(true)
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(NODE_UTILITY_V0_1_READY).toBe(true)
    expect(EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY).toBe(true)
    expect(EDITORIAL_CALIBRATION_CURATOR_APPROVED).toBe(false)
  })

  it('embeds 105 records with correct corpus counts', () => {
    expect(source.gate).toBe('2A.1R-UI.2')
    expect(source.sourceCheckpointSha).toBe(START)
    expect(source.records).toHaveLength(105)
    expect(source.defaultCorpusFilter).toBe('LAUNCH30')
    expect(source.inventoryCounts).toEqual({
      all: 105,
      launch30: 30,
      nonLaunch: 75,
      originalSeed: 103,
      founderExtensions: 2,
    })
    const launchN = source.records.filter((r) => r.launchCorpus).length
    const nonN = source.records.filter((r) => !r.launchCorpus).length
    const seedN = source.records.filter((r) => r.inventoryProvenance === 'ORIGINAL_103_SEED').length
    const extN = source.records.filter((r) => r.inventoryProvenance === 'FOUNDER_EXTENSION').length
    expect(launchN).toBe(30)
    expect(nonN).toBe(75)
    expect(seedN).toBe(103)
    expect(extN).toBe(2)
    expect(source.launchCorpusIds).toHaveLength(30)
  })

  it('includes STGO_104 once as founder extension + Launch30; excludes STGO_23 from Launch30', () => {
    const ids = source.records.map((r) => r.stgoId)
    expect(ids.filter((id) => id === 'STGO_104')).toHaveLength(1)
    expect(ids.filter((id) => id === 'STGO_105')).toHaveLength(1)
    expect(ids.filter((id) => id === 'STGO_33')).toHaveLength(1)
    expect(ids).toContain('STGO_23')
    const r104 = source.records.find((r) => r.stgoId === 'STGO_104')!
    const r105 = source.records.find((r) => r.stgoId === 'STGO_105')!
    const r23 = source.records.find((r) => r.stgoId === 'STGO_23')!
    const r33 = source.records.find((r) => r.stgoId === 'STGO_33')!
    expect(r104.launchCorpus).toBe(true)
    expect(r104.inventoryProvenance).toBe('FOUNDER_EXTENSION')
    expect(r105.launchCorpus).toBe(false)
    expect(r105.inventoryProvenance).toBe('FOUNDER_EXTENSION')
    expect(r105.displayName).toBe('Teatro Municipal de Santiago')
    expect(Object.values(r104.thematicVector).every((v) => v == null)).toBe(true)
    expect(Object.values(r104.structuralMetrics).every((v) => v == null)).toBe(true)
    expect(r104.chronoWorthProposed == null).toBe(true)
    expect(r23.launchCorpus).toBe(false)
    expect(r23.inventoryProvenance).toBe('ORIGINAL_103_SEED')
    expect(r33.displayName).toContain('Gárgola')
    expect(r33.displayName).not.toMatch(/Funicular/i)
    expect(source.launchCorpusIds).not.toContain('STGO_23')
    expect(source.launchCorpusIds).toContain('STGO_104')
    expect(source.launchCorpusIds).not.toContain('STGO_105')
  })

  it('supports provenance filters and combined search + corpus filter', () => {
    const seed = source.records.filter((r) => r.inventoryProvenance === 'ORIGINAL_103_SEED')
    const ext = source.records.filter((r) => r.inventoryProvenance === 'FOUNDER_EXTENSION')
    expect(seed).toHaveLength(103)
    expect(ext).toHaveLength(2)
    expect(ext.map((r) => r.stgoId).sort()).toEqual(['STGO_104', 'STGO_105'])

    const byId = searchHits(source.records, 'STGO_23', 'ALL104')
    expect(byId.map((r) => r.stgoId)).toEqual(['STGO_23'])
    expect(searchHits(source.records, 'STGO_23', 'LAUNCH30')).toHaveLength(0)

    const mercadoAll = searchHits(source.records, 'mercado', 'ALL104')
    expect(mercadoAll.length).toBeGreaterThan(0)
    expect(mercadoAll.every((r) => /mercado/i.test([r.displayName, r.canonicalName, r.commune].join(' ')))).toBe(
      true,
    )
    const mercadoLaunch = searchHits(source.records, 'mercado', 'LAUNCH30')
    expect(mercadoLaunch.every((r) => r.launchCorpus)).toBe(true)
    expect(mercadoLaunch.length).toBeLessThanOrEqual(mercadoAll.length)
  })

  it('sorts UNKNOWN ChronoWorth to the end without fabricating scores', () => {
    const raws: Record<string, number | null> = {}
    for (const r of source.records) {
      const m = r.structuralMetrics
      const vals = [m.heritage_depth, m.anchor_density, m.micro_reveal, m.polish]
      if (vals.some((v) => v == null)) raws[r.stgoId] = null
      else {
        raws[r.stgoId] =
          100 *
          (0.35 * Number(m.heritage_depth) +
            0.3 * Number(m.anchor_density) +
            0.2 * Number(m.micro_reveal) +
            0.15 * Number(m.polish))
      }
    }
    expect(raws['STGO_104']).toBeNull()
    expect(raws['STGO_105']).toBeNull()
    const sorted = sortRawUnknownLast(
      source.records.map((r) => r.stgoId),
      raws,
    )
    expect(['STGO_104', 'STGO_105']).toContain(sorted[sorted.length - 1])
    const firstUnknownIdx = sorted.findIndex((id) => raws[id] == null)
    expect(sorted.slice(firstUnknownIdx).every((id) => raws[id] == null)).toBe(true)
  })

  it('migrates Launch30 localStorage drafts into full-inventory store without losing approvals/reasons', () => {
    expect(html).toContain("cw_founder_cockpit_santiago104_v0_1")
    expect(html).toContain("cw_founder_cockpit_launch30_v0_1")
    expect(html).toContain('migrateLegacyStore')
    const legacy = {
      STGO_01: {
        founderApproval: 'APPROVED',
        founderChangeReasons: { T1A: 'civic emphasis' },
        founderNote: 'keep plaza',
      },
      STGO_104: {
        founderApproval: 'MODIFIED_AFTER_APPROVAL',
        founderChangeReasons: { heritage_depth: 'set first value' },
      },
    }
    const migrated = migrateLegacyDrafts(
      source.records.map((r) => r.stgoId),
      legacy,
    )
    expect(Object.keys(migrated)).toHaveLength(105)
    expect((migrated.STGO_01 as { founderApproval: string }).founderApproval).toBe('APPROVED')
    expect((migrated.STGO_01 as { founderChangeReasons: Record<string, string> }).founderChangeReasons.T1A).toBe(
      'civic emphasis',
    )
    expect((migrated.STGO_01 as { founderNote: string }).founderNote).toBe('keep plaza')
    expect((migrated.STGO_104 as { founderApproval: string }).founderApproval).toBe('MODIFIED_AFTER_APPROVAL')
    expect(
      (migrated.STGO_23 as { founderApproval: string }).founderApproval,
    ).toBe('UNREVIEWED')
  })

  it('preserves Launch30 export and adds full-inventory export contracts', () => {
    expect(html).toContain('launch30_founder_calibration.reviewed.v0.1.json')
    expect(html).toContain('santiago_founder_calibration.reviewed.v0.1.json')
    expect(html).toContain('launchCalibrationComplete')
    expect(html).toContain('fullInventoryCalibrationComplete')
    expect(html).toContain('Export Launch30')
    expect(html).toContain('Export Full Inventory')
    expect(html).toContain('Relative — Launch30')
    expect(html).toContain('Relative — All Santiago')
    expect(source.normalizationCorpus).toBe('SANTIAGO_LAUNCH30_V0_1')
    expect(source.normalizationCorpusAll).toBe('SANTIAGO_ALL105_V0_1')
  })

  it('keeps Launch30 semantic values aligned and full rationales covering 105', () => {
    const byLaunch = new Map(launch.records.map((r) => [r.stgoId, r]))
    for (const r of source.records.filter((x) => x.launchCorpus)) {
      const o = byLaunch.get(r.stgoId)!
      expect(r.thematicVector).toEqual(o.thematicVector)
      expect(r.structuralMetrics).toEqual(o.structuralMetrics)
    }
    expect(semantic.recordCount).toBe(105)
    expect(fullRat.records).toHaveLength(105)
    expect(launchRat.records).toHaveLength(30)
    expect(fullRat.sourceCheckpointSha).toBe(START)
  })

  it('does not enable routing or auto-approve backlog', () => {
    expect(html).not.toContain('Approve All')
    expect(html).not.toMatch(/NarrativeEdgeScore|optimizeItinerary/)
    expect(html).not.toContain('EDITORIAL_CALIBRATION_CURATOR_APPROVED=true')
    expect(EDITORIAL_CALIBRATION_CURATOR_APPROVED).toBe(false)
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
  })
})
