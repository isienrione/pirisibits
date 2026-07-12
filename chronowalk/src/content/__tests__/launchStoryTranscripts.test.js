import { describe, expect, it } from 'vitest'
import { getLaunchTranscriptParagraphs } from '../launchStoryTranscripts'

describe('launchStoryTranscripts', () => {
  it('returns editorial paragraphs for a stop', () => {
    const paragraphs = getLaunchTranscriptParagraphs({ id: 'colosseum' })

    expect(paragraphs).toHaveLength(6)
    expect(paragraphs[0].text).toMatch(/Colosseum/i)
    expect(paragraphs[0].startProgress).toBe(0)
  })
})
