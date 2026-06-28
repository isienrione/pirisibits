import { describe, expect, it, beforeEach } from 'vitest'
import {
  loadTourProgress,
  resetTourProgress,
  saveTourProgress,
} from '../../utils/tourProgressStorage'

describe('tourProgressStorage', () => {
  beforeEach(() => {
    resetTourProgress('rome-core')
  })

  it('returns defaults when no progress saved', () => {
    const progress = loadTourProgress('rome-core')
    expect(progress.targetStopIndex).toBe(0)
    expect(progress.arrivedStopIds).toEqual([])
    expect(progress.transitLegActive).toBe(false)
  })

  it('persists progress to localStorage', () => {
    const progress = {
      targetStopIndex: 1,
      arrivedStopIds: ['colosseum'],
      transitLegActive: true,
      startedAtMs: null,
      completedAtMs: null,
    }
    saveTourProgress('rome-core', progress)
    expect(loadTourProgress('rome-core')).toEqual(progress)
  })
})
