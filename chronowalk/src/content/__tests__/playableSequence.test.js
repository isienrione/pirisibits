import { describe, expect, it } from 'vitest'
import { JOURNEY_PACE } from '../../data/romePacing.js'
import { loadRomeManifest } from '../manifest.js'
import { buildPlayableSequence } from '../playableSequence.js'
import { buildEffectiveSequence } from '../optionalPromotion.js'

describe('playable sequence', () => {
  const manifest = loadRomeManifest()

  it('keeps the full linear path when not on own-pace custom Heroes', () => {
    expect(buildPlayableSequence(manifest, 'a', [])).toEqual(buildEffectiveSequence(manifest, 'a', []))
  })

  it('filters own-pace guest Pantheon to w17 + w23', () => {
    const sequence = buildPlayableSequence(manifest, 'a', [], {
      pace: JOURNEY_PACE.OWN,
      customWaypointIds: ['w17', 'w23'],
    })
    expect(sequence).toEqual(['w17', 'w23'])
  })
})
