/**
 * Emit Gate 2A fixture candidate scores as JSON for the curator HTML.
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildCandidatePool } from '../../src/engine/candidates/buildCandidatePool'
import { TRAVELER_FIXTURES } from '../../src/engine/fixtures/travelerFixtures'
import { loadLaunchNodes } from '../../src/engine/loadSantiagoNodes'

const root = resolve(__dirname, '../..')
const nodes = loadLaunchNodes(root)
const out: Record<string, unknown> = {}

for (const [id, traveler] of Object.entries(TRAVELER_FIXTURES)) {
  const pool = buildCandidatePool(nodes, traveler)
  out[id] = Object.fromEntries(
    pool.candidates.map((c) => [c.nodeId, { utility: c.utility, rank: c.rank, matched: c.matchedThemes }]),
  )
  out[`${id}__excluded`] = pool.excludedIds
  out[`${id}__eligibleCount`] = pool.eligibleCount
}

const dest = resolve(root, 'docs/engine/gate-2a-fixture-scores.json')
writeFileSync(dest, JSON.stringify(out, null, 2) + '\n')
console.log('Wrote', dest)
