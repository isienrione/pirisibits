import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  AUTO_CURATOR_APPROVE_FROM_MAPBOX,
  PHYSICAL_ROUTE_GENERATION_ENABLED,
} from '../city-graph/flags'

const root = resolve(__dirname, '../../..')

describe('Gate 1B.1 physical graph contract', () => {
  it('keeps physical route generation disabled', () => {
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(AUTO_CURATOR_APPROVE_FROM_MAPBOX).toBe(false)
  })

  it('has a 103-node identity corpus and locked 30 launch ids', () => {
    const identity = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_physical_identity.v0.1.json'), 'utf8'),
    )
    const launch = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_launch_corpus.v0.1.json'), 'utf8'),
    )
    expect(identity.nodeCount).toBe(103)
    expect(identity.nodes).toHaveLength(103)
    expect(launch.count).toBe(30)
    expect(launch.ids).toHaveLength(30)
    for (const node of identity.nodes) {
      expect(node.lat).toBeNull()
      expect(node.lng).toBeNull()
      expect(node.physicalState).toBe('IDENTITY_ONLY')
    }
  })

  it('proposed geocode file never auto-approves or leaks tokens', () => {
    const path = resolve(root, 'src/data/santiago/santiago_physical_nodes.proposed.v0.1.json')
    expect(existsSync(path)).toBe(true)
    const raw = readFileSync(path, 'utf8')
    expect(raw).not.toMatch(/pk\.ey/)
    expect(raw).not.toMatch(/MAPBOX_ACCESS_TOKEN/)
    const proposed = JSON.parse(raw)
    expect(proposed.physicalRouteGenerationEnabled).toBe(false)
    expect(proposed.nodes).toHaveLength(30)
    for (const node of proposed.nodes) {
      expect(node.selectionStatus).not.toBe('CURATOR_APPROVED')
      expect(node.physicalState).not.toBe('CURATOR_APPROVED')
      if (node.lat != null) {
        expect(node.providerId).toBeTruthy()
        expect(node.selectedCandidate.lat).toBe(node.lat)
        expect(node.selectedCandidate.lng).toBe(node.lng)
      }
    }
  })

  it('enrich script loads dotenv safely', () => {
    const enrich = readFileSync(
      resolve(root, 'scripts/physical-graph/enrich_santiago_physical_graph.py'),
      'utf8',
    )
    expect(enrich).toContain('load_dotenv(ROOT / ".env.local"')
    expect(enrich).toContain('load_dotenv(ROOT / ".env"')
    expect(enrich).toContain('override=False')
    expect(enrich).toContain('NEVER')
  })
})
