import { describe, expect, it } from 'vitest'
import { pickApproachCue, getApproachCues } from '../walkingApproachCues.js'

describe('walkingApproachCues', () => {
  it('rotates cues without repeating the previous index', () => {
    localStorage.clear()
    const first = pickApproachCue('w01')
    const second = pickApproachCue('w02')
    const cues = getApproachCues()
    expect(cues).toContain(first)
    expect(cues).toContain(second)
    expect(second).not.toBe(first)
  })
})
