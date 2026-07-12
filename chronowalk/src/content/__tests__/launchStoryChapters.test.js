import { describe, expect, it } from 'vitest'
import { getStoryChapters, STORY_CHAPTER_COUNT } from '../launchStoryChapters'

describe('launchStoryChapters', () => {
  it('returns six chapters for a stop', () => {
    const chapters = getStoryChapters({ id: 'colosseum', title: 'The Colosseum' })

    expect(chapters).toHaveLength(STORY_CHAPTER_COUNT)
    expect(chapters[0].title).toBe('The Threshold')
    expect(chapters[5].title).toBe('What Remains')
    expect(chapters[0].startProgress).toBe(0)
    expect(chapters[3].startProgress).toBeCloseTo(0.5)
  })

  it('falls back to default chapter copy for unknown stops', () => {
    const chapters = getStoryChapters({ id: 'pantheon', title: 'The Pantheon' })

    expect(chapters[0].title).toBe('Arrival')
    expect(chapters).toHaveLength(6)
  })
})
