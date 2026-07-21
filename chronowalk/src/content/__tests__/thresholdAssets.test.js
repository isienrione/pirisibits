import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import { thenLoopForWaypoint } from '../../redesign/lib/waypointPresentation.js'

const publicRoot = join(process.cwd(), 'public')

describe('threshold reconstruction assets', () => {
  const manifest = loadRomeManifest()

  it('ships ancient reconstruction loops for every visit stop except scripted rest', () => {
    const missing = []

    for (const waypoint of manifest.waypoints) {
      if (waypoint.scripted_rest) continue
      const loop = thenLoopForWaypoint(waypoint)
      if (!loop) {
        missing.push(`${waypoint.id}: no loop path`)
        continue
      }
      const filePath = join(publicRoot, loop.replace(/^\//, ''))
      if (!existsSync(filePath)) {
        missing.push(`${waypoint.id}: missing ${loop}`)
      }
    }

    expect(missing).toEqual([])
  })
})
