import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  loadTourProgress,
  loadTourProgressAsync,
  resetTourProgress,
  saveTourProgress,
} from '../../utils/tourProgressStorage'

vi.mock('../../offline/offlineRepository', () => ({
  loadOfflineUserProgress: vi.fn(),
  saveOfflineUserProgress: vi.fn(),
}))

import { loadOfflineUserProgress } from '../../offline/offlineRepository'

describe('tourProgressStorage', () => {
  beforeEach(() => {
    resetTourProgress('rome-core')
    vi.mocked(loadOfflineUserProgress).mockReset()
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
    }
    saveTourProgress('rome-core', progress)
    expect(loadTourProgress('rome-core')).toEqual(progress)
  })

  it('falls back to IndexedDB progress when localStorage is empty', async () => {
    vi.mocked(loadOfflineUserProgress).mockResolvedValue({
      targetStopIndex: 2,
      transitLegActive: false,
      arrivedStopIds: ['colosseum', 'roman-forum'],
    })

    const progress = await loadTourProgressAsync('rome-core')

    expect(progress.targetStopIndex).toBe(2)
    expect(progress.arrivedStopIds).toEqual(['colosseum', 'roman-forum'])
  })
})
