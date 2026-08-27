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

  it('rejects synthetic names and arithmetic coordinate assumptions', () => {
    const data = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
    ) as SantiagoEngineNodesFile
    for (const n of data.nodes) {
      const name = `${n.canonicalName ?? ''} ${n.displayName ?? ''}`
      expect(name).not.toMatch(/Cultural Node Sector|Sector\s+\d+/i)
      expect(n.legacySlug).not.toBe(n.stgoId)
      expect(n.curatorApproval).toBeNull()
      expect(n.physicalVerificationState).not.toBe('CURATOR_APPROVED')
      expect(n.entranceCoordinate).toBeNull()
      expect(n.experiencePointCoordinate).toBeNull()
      expect(n.nearestTransit.status).toBe('UNRESOLVED')
      expect(n.physicalRouteGenerationEnabled).toBe(false)
      if (n.poiCoordinate) {
        expect(n.providerId).toBeTruthy()
        expect(n.providerCandidate?.lat).toBe(n.poiCoordinate.lat)
        expect(n.providerCandidate?.lng).toBe(n.poiCoordinate.lng)
        // Distinctions preserved
        expect(n.entranceCoordinate).not.toEqual(n.poiCoordinate)
        expect(n.experiencePointCoordinate).not.toEqual(n.poiCoordinate)
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
    expect(launchNodes.map((n) => n.legacySlug)).toEqual(launch.ids)
    for (const n of launchNodes) {
      expect(n.stgoId).toMatch(/^STGO_(?:0[1-9]|[1-9]\d|10[0-3])$/)
      expect(data.launchCorpusStgoIds).toContain(n.stgoId)
    }
  })

  it('provider enrichment never leaks secrets and cannot mutate canonical identity', () => {
    const raw = readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8')
    expect(raw).not.toMatch(/pk\.ey/)
    expect(raw).not.toMatch(/MAPBOX_ACCESS_TOKEN/)
    const data = JSON.parse(raw) as SantiagoEngineNodesFile
    expect(data.physicalRouteGenerationEnabled).toBe(false)
    expect(data.autoCuratorApproveFromMapbox).toBe(false)
    for (const n of data.nodes) {
      expect(n.provenance.physical.curatorApproval).toBe('never-automatic')
      if (n.providerClassification === 'AUTO_HIGH_CONFIDENCE') {
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
