import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import { buildMapStopsFromManifest } from '../mapStops.js'
import { toStopRowModel, toWalkCardModel } from '../stopPresentation.js'

describe('stopPresentation', () => {
  const manifest = loadRomeManifest()

  it('maps manifest stops to shell row props', () => {
    const stops = buildMapStopsFromManifest(manifest, {
      path: 'a',
      sequenceIndex: 0,
      completedWaypointIds: [],
    })

    const row = toStopRowModel(manifest, stops[0], 0)
    expect(row.title).toMatch(/colosseum/i)
    expect(row).toMatchObject({
      id: 'w01',
      index: 0,
      status: 'current',
    })
  })

  it('maps active stop to walk card props', () => {
    const stops = buildMapStopsFromManifest(manifest, {
      path: 'a',
      sequenceIndex: 0,
      completedWaypointIds: [],
    })

    const card = toWalkCardModel(manifest, stops[0], 230)
    expect(card?.title).toMatch(/colosseum/i)
    expect(card?.distanceM).toBe(230)
  })
})
