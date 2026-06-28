import { describe, expect, it } from 'vitest'
import { JOURNEY_STATE } from '../../hooks/useGeoLocation'
import {
  buildOfflineWalkingInstruction,
  formatDistanceLabel,
} from '../offlineWalkingGuide'

describe('offlineWalkingGuide', () => {
  it('formats distance labels', () => {
    expect(formatDistanceLabel(240)).toBe('240 m')
    expect(formatDistanceLabel(1500)).toBe('1.5 km')
  })

  it('uses cached walking steps when available', () => {
    const instruction = buildOfflineWalkingInstruction({
      cachedSteps: [{ instruction: 'Turn right onto Via dei Fori Imperiali', type: 'turn' }],
      targetStopTitle: 'Roman Forum',
      distance: 180,
    })

    expect(instruction).toContain('Turn right onto Via dei Fori Imperiali')
  })

  it('builds a fallback instruction with distance and destination', () => {
    const instruction = buildOfflineWalkingInstruction({
      distance: 320,
      targetStopTitle: 'Colosseum',
      userPos: { lat: 41.88, lng: 12.48 },
      targetLandmark: { lat: 41.8902, lng: 12.4922 },
      state: JOURNEY_STATE.TRANSIT,
    })

    expect(instruction).toContain('Colosseum')
    expect(instruction).toContain('320 m')
  })
})
