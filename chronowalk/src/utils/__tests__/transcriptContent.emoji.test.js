import { describe, expect, it } from 'vitest'
import { stripDirectorCues } from '../transcriptContent.js'

describe('stripDirectorCues emoji', () => {
  it('removes director emoji cues from Navona-style transcripts', () => {
    const raw =
      'Look down at the cobbles. ✋ This is the floor. Navona. 🎭 Every tourist ordering coffee.'
    expect(stripDirectorCues(raw)).toBe(
      'Look down at the cobbles. This is the floor. Navona. Every tourist ordering coffee.',
    )
  })
})
