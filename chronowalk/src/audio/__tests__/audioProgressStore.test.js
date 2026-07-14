import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getAudioProgressSnapshot,
  publishAudioProgress,
  resetAudioProgressStore,
  subscribeAudioProgress,
} from '../audioProgressStore.js'

describe('audioProgressStore', () => {
  beforeEach(() => {
    resetAudioProgressStore()
  })

  it('notifies subscribers when progress crosses a quarter-second bucket', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeAudioProgress(listener)

    publishAudioProgress({
      currentTime: 1.0,
      duration: 10,
      chapterIndex: 0,
      chapterCount: 1,
      itemIndex: 0,
      itemCount: 1,
      playing: true,
      paused: false,
    })
    expect(listener).toHaveBeenCalledTimes(1)

    publishAudioProgress({
      currentTime: 1.1,
      duration: 10,
      chapterIndex: 0,
      chapterCount: 1,
      itemIndex: 0,
      itemCount: 1,
      playing: true,
      paused: false,
    })
    expect(listener).toHaveBeenCalledTimes(1)

    publishAudioProgress({
      currentTime: 1.3,
      duration: 10,
      chapterIndex: 0,
      chapterCount: 1,
      itemIndex: 0,
      itemCount: 1,
      playing: true,
      paused: false,
    })
    expect(listener).toHaveBeenCalledTimes(2)
    expect(getAudioProgressSnapshot().currentTime).toBe(1.3)

    unsubscribe()
  })

  it('resets to the idle snapshot', () => {
    publishAudioProgress({
      currentTime: 4,
      duration: 20,
      chapterIndex: 1,
      chapterCount: 2,
      itemIndex: 0,
      itemCount: 1,
      playing: false,
      paused: true,
    })
    resetAudioProgressStore()
    expect(getAudioProgressSnapshot()).toMatchObject({
      currentTime: 0,
      duration: 0,
      playing: false,
      paused: false,
    })
  })
})
