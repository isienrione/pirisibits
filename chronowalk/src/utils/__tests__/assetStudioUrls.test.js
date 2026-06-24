import { describe, expect, it } from 'vitest'
import { listAssetStudioEntries, buildAssetStudioUrl } from '../assetStudioUrls'

describe('assetStudioUrls', () => {
  it('builds asset studio URL for a waypoint', () => {
    const url = buildAssetStudioUrl('pantheon', 'http://localhost:5173')
    expect(url).toBe('http://localhost:5173/?assetStudio=true&waypoint=pantheon')
  })

  it('lists all tour stops with studio links', () => {
    const entries = listAssetStudioEntries()
    expect(entries.map((e) => e.id)).toEqual(['colosseum', 'pantheon', 'piazza-navona'])
    expect(entries[2].localDevUrl).toContain('piazza-navona')
  })
})
