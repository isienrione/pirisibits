import { describe, expect, it } from 'vitest'
import { ROME_CORE_TOUR } from '../../data/rome-core-tour'
import { listAssetStudioEntries, buildAssetStudioUrl } from '../assetStudioUrls'

describe('assetStudioUrls', () => {
  it('builds asset studio URL for a waypoint', () => {
    const url = buildAssetStudioUrl('pantheon', 'http://localhost:5173')
    expect(url).toBe('http://localhost:5173/?assetStudio=true&waypoint=pantheon')
  })

  it('lists all tour stops with studio links', () => {
    const entries = listAssetStudioEntries()
    expect(entries.map((e) => e.id)).toEqual(ROME_CORE_TOUR.stopIds)
    expect(entries.find((e) => e.id === 'piazza-navona')?.localDevUrl).toContain('piazza-navona')
  })
})
