import { beforeEach, describe, expect, it } from 'vitest'
import {
  clampAudioPositionMs,
  clearAudioPosition,
  loadAudioPosition,
  saveAudioPosition,
  __resetAudioPositionSaveThrottleForTests,
} from '../audioPositionStore.js'
import { resetTourProgress } from '../../utils/tourProgressStorage.js'

describe('audioPositionStore', () => {
  beforeEach(() => {
    resetTourProgress('rome')
    __resetAudioPositionSaveThrottleForTests()
  })

  it('clamps invalid and overshot positions', () => {
    expect(clampAudioPositionMs(-10)).toBe(0)
    expect(clampAudioPositionMs(Number.NaN)).toBe(0)
    expect(clampAudioPositionMs(12_000, 10_000)).toBe(9_750)
  })

  it('saves and restores a narration offset', () => {
    saveAudioPosition('rome', 'w17', {
      positionMs: 12_500,
      itemIndex: 1,
      force: true,
    })
    expect(loadAudioPosition('rome', 'w17')).toMatchObject({
      positionMs: 12_500,
      itemIndex: 1,
      completed: false,
    })
  })

  it('marks completed tracks without parking at the final millisecond', () => {
    saveAudioPosition('rome', 'w17', {
      positionMs: 60_000,
      completed: true,
      force: true,
    })
    const saved = loadAudioPosition('rome', 'w17')
    expect(saved?.completed).toBe(true)
    expect(saved?.positionMs).toBe(0)
  })

  it('clears a stop position', () => {
    saveAudioPosition('rome', 'w17', { positionMs: 1000, force: true })
    clearAudioPosition('rome', 'w17')
    expect(loadAudioPosition('rome', 'w17')).toBeNull()
  })

  it('throttles frequent saves unless forced', () => {
    saveAudioPosition('rome', 'w17', { positionMs: 1000, force: true })
    saveAudioPosition('rome', 'w17', { positionMs: 2000 })
    expect(loadAudioPosition('rome', 'w17')?.positionMs).toBe(1000)
    saveAudioPosition('rome', 'w17', { positionMs: 3000, force: true })
    expect(loadAudioPosition('rome', 'w17')?.positionMs).toBe(3000)
  })
})
