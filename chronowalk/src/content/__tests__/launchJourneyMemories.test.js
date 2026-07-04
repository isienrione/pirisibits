import { describe, expect, it } from 'vitest'
import { loadRomeTourManifest } from '../romeTourManifest'
import { buildJourneyMemories, MEMORY_SECTIONS } from '../launchJourneyMemories'

describe('launchJourneyMemories', () => {
  const manifest = loadRomeTourManifest()

  it('builds a personal archive from visited stops and recap data', () => {
    const archive = buildJourneyMemories({
      manifest,
      context: {
        completedStopIds: ['colosseum'],
        currentStopId: 'pantheon',
      },
      recap: {
        photos: [{ stopId: 'colosseum', capturedAt: '2026-07-04T09:00:00.000Z' }],
        audioListened: [{ stopId: 'colosseum', listenedAt: '2026-07-04T08:30:00.000Z' }],
        journal: [
          {
            stopId: 'pantheon',
            text: 'For nearly two thousand years, this dome remained the largest on Earth.',
            recordedAt: '2026-07-04T08:45:00.000Z',
          },
        ],
      },
    })

    expect(archive.places.map((place) => place.id)).toEqual(['colosseum', 'pantheon'])
    expect(archive.stories).toHaveLength(1)
    expect(archive.stories[0].audioUrl).toBeTruthy()
    expect(archive.photos).toHaveLength(1)
    expect(archive.journal).toHaveLength(1)
  })

  it('exposes the four memory sections', () => {
    expect(Object.values(MEMORY_SECTIONS)).toEqual(['places', 'stories', 'photos', 'journal'])
  })
})
