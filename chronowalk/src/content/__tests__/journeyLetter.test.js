import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import {
  buildJourneyLetter,
  buildLetterStops,
  composeLetterBody,
  projectMeanderPoints,
} from '../journeyLetter.js'

describe('journeyLetter', () => {
  const manifest = loadRomeManifest()

  it('builds letter stops in path order', () => {
    const stops = buildLetterStops(manifest, ['w02', 'w01'], 'a')
    expect(stops.map((stop) => stop.id)).toEqual(['w01', 'w02'])
  })

  it('composes preview copy when nothing is completed', () => {
    expect(composeLetterBody(manifest, [])).toMatch(/still blank/i)
  })

  it('weaves completed stop names into the letter body', () => {
    const stops = buildLetterStops(manifest, ['w01', 'w02'], 'a')
    const body = composeLetterBody(manifest, stops)
    expect(body).toMatch(/Colosseum/i)
    expect(body).toMatch(/interior/i)
  })

  it('projects a meander path for completed stops', () => {
    const stops = buildLetterStops(manifest, ['w01', 'w02'], 'a')
    const meander = projectMeanderPoints(stops)
    expect(meander.points).toHaveLength(2)
    expect(meander.path.startsWith('M ')).toBe(true)
  })

  it('builds a shareable letter object', () => {
    const letter = buildJourneyLetter(manifest, {
      path: 'a',
      completedWaypointIds: ['w01'],
    })

    expect(letter.title).toBe('The path you walked')
    expect(letter.stopCount).toBe(1)
    expect(letter.shareText).toContain('You began in Rome')
  })
})
