import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  AUTO_CURATOR_APPROVE_FROM_MAPBOX,
  PHYSICAL_ROUTE_GENERATION_ENABLED,
} from '../city-graph/flags'
import type { SantiagoEngineNodesFile } from '../city-graph/types'

const root = resolve(__dirname, '../../..')
const expectedIds = Array.from({ length: 104 }, (_, i) => `STGO_${String(i + 1).padStart(2, '0')}`)
const ACTIVE_LAUNCH_IDS = [
  'STGO_01', 'STGO_02', 'STGO_03', 'STGO_04', 'STGO_05', 'STGO_06', 'STGO_07',
  'STGO_10', 'STGO_11', 'STGO_16', 'STGO_18', 'STGO_19', 'STGO_20', 'STGO_21',
  'STGO_22', 'STGO_24', 'STGO_25', 'STGO_26', 'STGO_27', 'STGO_28', 'STGO_29',
  'STGO_30', 'STGO_32', 'STGO_33', 'STGO_34', 'STGO_35', 'STGO_48', 'STGO_91',
  'STGO_92', 'STGO_104',
]

describe('Gate 1B.2 Santiago canonical physical node layer', () => {
  it('keeps physical route generation disabled and never auto-approves Mapbox', () => {
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(AUTO_CURATOR_APPROVE_FROM_MAPBOX).toBe(false)
  })

  it('authoritative inventory is STGO_01…STGO_104 (103 frozen seed + STGO_104 extension)', () => {
    const frozen = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json'), 'utf8'),
    )
    expect(frozen.nodes).toHaveLength(103)
    expect(frozen.source_node_count).toBe(103)

    const path = resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json')
    expect(existsSync(path)).toBe(true)
    const data = JSON.parse(readFileSync(path, 'utf8')) as SantiagoEngineNodesFile
    expect(data.nodeCount).toBe(104)
    expect(data.nodes).toHaveLength(104)
    expect(data.nodes.map((n) => n.stgoId)).toEqual(expectedIds)
    expect(new Set(data.nodes.map((n) => n.stgoId)).size).toBe(104)
    expect(data.launchCorpusCount).toBe(30)
    expect(data.backlogCount).toBe(74)
    expect(data.nodes.filter((n) => n.launchCorpus)).toHaveLength(30)
    expect(data.nodes.filter((n) => !n.launchCorpus)).toHaveLength(74)
    expect(data.nodes.filter((n) => n.launchCorpus).map((n) => n.stgoId).sort()).toEqual(
      [...ACTIVE_LAUNCH_IDS].sort(),
    )
    expect(data.launchCorpusStgoIds).toEqual(expect.arrayContaining(['STGO_33', 'STGO_104']))
    expect(data.launchCorpusStgoIds).not.toContain('STGO_23')
  })

  it('rejects synthetic names and preserves backlog provider discipline', () => {
    const data = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
    ) as SantiagoEngineNodesFile
    const launchIds = new Set(data.launchCorpusStgoIds ?? [])
    for (const n of data.nodes) {
      const isLaunch = launchIds.has(n.stgoId)
      const name = `${n.canonicalName ?? ''} ${n.displayName ?? ''}`
      expect(name).not.toMatch(/Cultural Node Sector|Sector\s+\d+/i)
      expect(n.legacySlug).not.toBe(n.stgoId)
      expect(n.entranceCoordinate).toBeNull()
      expect(n.nearestTransit.status).toBe('UNRESOLVED')
      expect(n.physicalRouteGenerationEnabled).toBe(false)
      if (!isLaunch) {
        expect(n.curatorApproval).toBeNull()
        expect(n.physicalVerificationState).not.toBe('CURATOR_APPROVED')
        expect(n.experiencePointCoordinate).toBeNull()
        if (n.poiCoordinate) {
          expect(n.providerId).toBeTruthy()
          expect(n.providerCandidate?.lat).toBe(n.poiCoordinate.lat)
          expect(n.providerCandidate?.lng).toBe(n.poiCoordinate.lng)
          expect(n.experiencePointCoordinate).not.toEqual(n.poiCoordinate)
        }
      } else if (n.poiCoordinate && n.experiencePointCoordinate) {
        const same =
          n.poiCoordinate.lat === n.experiencePointCoordinate.lat &&
          n.poiCoordinate.lng === n.experiencePointCoordinate.lng
        expect(same).toBe(false)
      }
    }
  })

  it('launch references resolve to canonical STGO ids; legacy ids are not primary keys', () => {
    const data = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
    ) as SantiagoEngineNodesFile
    const launch = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_launch_corpus.v0.1.json'), 'utf8'),
    )
    const launchNodes = data.nodes.filter((n) => n.launchCorpus)
    expect(launchNodes.map((n) => n.stgoId).sort()).toEqual([...(launch.stgoIds ?? launch.ids)].sort())
    for (const n of launchNodes) {
      expect(n.stgoId).toMatch(/^STGO_(?:0[1-9]|[1-9]\d|10[0-4])$/)
      expect(data.launchCorpusStgoIds).toContain(n.stgoId)
    }
  })

  it('provider enrichment never leaks secrets; backlog stays never-automatic', () => {
    const raw = readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8')
    expect(raw).not.toMatch(/pk\.ey/)
    expect(raw).not.toMatch(/MAPBOX_ACCESS_TOKEN/)
    const data = JSON.parse(raw) as SantiagoEngineNodesFile
    const launchIds = new Set(data.launchCorpusStgoIds ?? [])
    expect(data.physicalRouteGenerationEnabled).toBe(false)
    expect(data.autoCuratorApproveFromMapbox).toBe(false)
    for (const n of data.nodes) {
      const isLaunch = launchIds.has(n.stgoId)
      if (!isLaunch) {
        expect(n.provenance.physical.curatorApproval).toBe('never-automatic')
      }
      if (n.providerClassification === 'AUTO_HIGH_CONFIDENCE' && !isLaunch) {
        expect(n.physicalVerificationState).toBe('PROVIDER_DERIVED')
      }
    }
  })

  it('enrich scripts load dotenv safely without overriding shell env', () => {
    const enrich = readFileSync(
      resolve(root, 'scripts/physical-graph/enrich_santiago_engine_nodes.py'),
      'utf8',
    )
    expect(enrich).toContain('load_dotenv(ROOT / ".env.local"')
    expect(enrich).toContain('load_dotenv(ROOT / ".env"')
    expect(enrich).toContain('override=False')
    expect(enrich).toContain('NEVER')
  })
})
