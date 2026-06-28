import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getLocalWaypoint, MEDIA_URL_KEYS } from '../../services/waypointMerge'
import { listTours } from '../../services/tourRegistry'

const publicRoot = join(process.cwd(), 'public')

function resolvePublicPath(url) {
  if (!url || /^https?:\/\//i.test(url)) return null
  return join(publicRoot, String(url).replace(/^\//, ''))
}

const allStopIds = [...new Set(listTours().flatMap((tour) => tour.stopIds))]

describe('waypoint public assets', () => {
  for (const stopId of allStopIds) {
    it(`${stopId} seed media paths exist under public/waypoints`, () => {
      const waypoint = getLocalWaypoint(stopId)
      expect(waypoint).toBeTruthy()
      if (waypoint?.ship_assets === false) return

      const missing = []

      for (const field of MEDIA_URL_KEYS) {
        const url = waypoint[field]
        if (!url) continue

        const filePath = resolvePublicPath(url)
        if (!filePath || !existsSync(filePath)) {
          missing.push(`${field}: ${url}`)
        }
      }

      expect(missing, `Missing files for ${stopId}`).toEqual([])
    })
  }
})
