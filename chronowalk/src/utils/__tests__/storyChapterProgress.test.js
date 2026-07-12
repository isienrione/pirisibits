import { describe, expect, it } from 'vitest'
import {
  getChapterStatuses,
  isChapterComplete,
  resolveCurrentChapterIndex,
} from '../storyChapterProgress'

const chapters = [
  { id: '1', startProgress: 0 },
  { id: '2', startProgress: 1 / 6 },
  { id: '3', startProgress: 2 / 6 },
  { id: '4', startProgress: 0.5 },
  { id: '5', startProgress: 4 / 6 },
  { id: '6', startProgress: 5 / 6 },
]

describe('storyChapterProgress', () => {
  it('resolves the current chapter from audio progress', () => {
    expect(resolveCurrentChapterIndex(chapters, 0)).toBe(0)
    expect(resolveCurrentChapterIndex(chapters, 0.34)).toBe(2)
    expect(resolveCurrentChapterIndex(chapters, 0.9)).toBe(5)
  })

  it('marks completed chapters for replay', () => {
    expect(isChapterComplete(chapters, 0, 0.2)).toBe(true)
    expect(isChapterComplete(chapters, 2, 0.2)).toBe(false)
  })

  it('returns chapter statuses for the timeline', () => {
    const statuses = getChapterStatuses(chapters, 0.5)

    expect(statuses[3].status).toBe('current')
    expect(statuses[0].status).toBe('complete')
    expect(statuses[5].status).toBe('upcoming')
  })
})
