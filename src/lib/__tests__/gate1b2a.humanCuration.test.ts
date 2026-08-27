import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  AUTO_CURATOR_APPROVE_FROM_MAPBOX,
  PHYSICAL_ROUTE_GENERATION_ENABLED,
} from '../city-graph/flags'
import type { SantiagoEngineNodesFile } from '../city-graph/types'

const root = resolve(__dirname, '../../..')
const launchIds = [
  'STGO_01', 'STGO_02', 'STGO_03', 'STGO_04', 'STGO_05', 'STGO_06', 'STGO_07',
  'STGO_10', 'STGO_11', 'STGO_16', 'STGO_18', 'STGO_19', 'STGO_20', 'STGO_21',
  'STGO_22', 'STGO_23', 'STGO_24', 'STGO_25', 'STGO_26', 'STGO_27', 'STGO_28',
  'STGO_29', 'STGO_32', 'STGO_33', 'STGO_34', 'STGO_35', 'STGO_48', 'STGO_91',
  'STGO_92', 'STGO_30',
]

describe('Gate 1B.2A launch human curation', () => {
  it('keeps route generation disabled and never auto-approves Mapbox', () => {
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(AUTO_CURATOR_APPROVE_FROM_MAPBOX).toBe(false)
  })

  it('ingests exactly 30 founder curation records keyed by STGO ID', () => {
    const raw = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/curation/launch30_physical_review.raw.v0.1.json'), 'utf8'),
    )
    expect(raw.recordCount).toBe(30)
    expect(raw.records.map((r: { stgoId: string }) => r.stgoId).sort()).toEqual([...launchIds].sort())
  })

  it('applies human curation only to launch corpus without touching backlog approvals', () => {
    const data = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
    ) as SantiagoEngineNodesFile
    expect(data.gate).toBe('1B.2A')
    const launch = data.nodes.filter((n) => n.launchCorpus)
    const backlog = data.nodes.filter((n) => !n.launchCorpus)
    expect(launch).toHaveLength(30)
    expect(backlog).toHaveLength(73)
    expect(launch.map((n) => n.stgoId).sort()).toEqual([...launchIds].sort())
    for (const n of launch) {
      expect(n.curatorCuration).toBeTruthy()
      expect(n.providerAudit).toBeTruthy()
      expect(n.entranceCoordinate).toBeNull()
    }
    for (const n of backlog) {
      expect(n.curatorApproval).not.toBe('CURATOR_APPROVED')
      expect(n.curatorCuration).toBeFalsy()
    }
  })

  it('preserves special-node rules for STGO_05, STGO_23, STGO_32, STGO_33', () => {
    const data = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
    ) as SantiagoEngineNodesFile
    const by = Object.fromEntries(data.nodes.map((n) => [n.stgoId, n]))
    expect(by.STGO_23.launchPhysicalReadiness).toBe('UNRESOLVED_RESEARCH_REQUIRED')
    expect(by.STGO_23.poiCoordinate).toBeNull()
    expect(by.STGO_33.launchPhysicalReadiness).toBe('NEEDS_SEMANTIC_REVIEW')
    expect(by.STGO_33.poiCoordinate).toBeNull()
    expect(by.STGO_32.accessPoints?.length).toBeGreaterThanOrEqual(3)
    expect(by.STGO_05.physicalPoints?.some((p) => p.id === 'terraza_neptuno')).toBe(true)
    expect(by.STGO_05.physicalPoints?.some((p) => p.id === 'castillo_hidalgo')).toBe(true)
    expect(by.STGO_05.curatorCuration?.coordinateConflict).toBeTruthy()
  })

  it('never leaks secrets and keeps POI/experience distinct', () => {
    const raw = readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8')
    expect(raw).not.toMatch(/pk\.ey/)
    expect(raw).not.toMatch(/MAPBOX_ACCESS_TOKEN/)
    const data = JSON.parse(raw) as SantiagoEngineNodesFile
    for (const n of data.nodes) {
      if (n.poiCoordinate && n.experiencePointCoordinate) {
        const same =
          n.poiCoordinate.lat === n.experiencePointCoordinate.lat &&
          n.poiCoordinate.lng === n.experiencePointCoordinate.lng
        expect(same).toBe(false)
      }
    }
  })
})
