import { describe, expect, it } from 'vitest'
import { loadRomeTourManifest } from '../romeTourManifest'
import { buildJourneyLetter, collectVisitedStops } from '../launchJourneyLetter'

describe('launchJourneyLetter', () => {
  const manifest = loadRomeTourManifest()

  it('collects visited stops from completed ids and current stop', () => {
    const visited = collectVisitedStops(manifest, {
      completedStopIds: ['colosseum', 'pantheon'],
      currentStopId: 'piazza-navona',
    })

    expect(visited.map((stop) => stop.id)).toEqual([
      'colosseum',
      'pantheon',
      'piazza-navona',
    ])
  })

  it('addresses the traveler by name', () => {
    const letter = buildJourneyLetter({
      travelerName: 'Livia',
      manifest,
      context: {
        completedStopIds: ['colosseum'],
        currentStopId: 'pantheon',
      },
    })

    expect(letter.salutation).toBe('Dear Livia,')
    expect(letter.paragraphs.length).toBeGreaterThanOrEqual(4)
    expect(letter.signature).toBe('ChronoWalk')
  })

  it('weaves visited places into the emotional summary', () => {
    const letter = buildJourneyLetter({
      travelerName: 'Marco',
      manifest,
      context: {
        completedStopIds: ['colosseum', 'pantheon'],
        currentStopId: 'piazza-navona',
      },
    })

    expect(letter.paragraphs[1]).toMatch(/Colosseum/i)
    expect(letter.paragraphs[1]).toMatch(/Pantheon/i)
  })
})
