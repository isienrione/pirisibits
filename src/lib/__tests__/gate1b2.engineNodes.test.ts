import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  AUTO_CURATOR_APPROVE_FROM_MAPBOX,
  PHYSICAL_ROUTE_GENERATION_ENABLED,
} from '../city-graph/flags'
import type { SantiagoEngineNodesFile } from '../city-graph/types'

const root = resolve(__dirname, '../../..')
const expectedIds = Array.from({ length: 103 }, (_, i) => `STGO_${String(i + 1).padStart(2, '0')}`)

describe('Gate 1B.2 Santiago canonical physical node layer', () => {
  it('keeps physical route generation disabled and never auto-approves Mapbox', () => {
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(AUTO_CURATOR_APPROVE_FROM_MAPBOX).toBe(false)
  })

  it('authoritative inventory is exactly STGO_01…STGO_103', () => {
    const path = resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json')
    expect(existsSync(path)).toBe(true)
    const data = JSON.parse(readFileSync(path, 'utf8')) as SantiagoEngineNodesFile
    expect(data.nodeCount).toBe(103)
    expect(data.nodes).toHaveLength(103)
    expect(data.nodes.map((n) => n.stgoId)).toEqual(expectedIds)
    expect(new Set(data.nodes.map((n) => n.stgoId)).size).toBe(103)
    expect(data.launchCorpusCount).toBe(30)
    expect(data.backlogCount).toBe(73)
    expect(data.nodes.filter((n) => n.launchCorpus)).toHaveLength(30)
    expect(data.nodes.filter((n) => !n.launchCorpus)).toHaveLength(73)
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
      expect(n.stgoId).toMatch(/^STGO_(?:0[1-9]|[1-9]\d|10[0-3])$/)
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
