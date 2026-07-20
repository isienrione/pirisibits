import { describe, expect, it } from 'vitest'
import { pickApproachCue, APPROACH_CUES } from '../walkingApproachCues.js'

describe('walkingApproachCues', () => {
  it('rotates cues without repeating the previous index', () => {
    localStorage.clear()
    const first = pickApproachCue('w01')
    const second = pickApproachCue('w02')
    expect(APPROACH_CUES).toContain(first)
    expect(APPROACH_CUES).toContain(second)
    expect(second).not.toBe(first)
  })
})
