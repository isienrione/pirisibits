import { describe, expect, it } from 'vitest'
import { getStoryReflectionSentence } from '../launchStoryReflections'

describe('launchStoryReflections', () => {
  it('returns a powerful sentence for the pantheon', () => {
    expect(getStoryReflectionSentence({ id: 'pantheon' })).toMatch(
      /two thousand years.*dome/i
    )
  })

  it('returns a colosseum-specific reflection', () => {
    expect(getStoryReflectionSentence({ id: 'colosseum' })).toMatch(/arena/i)
  })

  it('falls back to a default reflection', () => {
    expect(getStoryReflectionSentence({ id: 'unknown-stop' })).toMatch(/do not fade/i)
  })
})
