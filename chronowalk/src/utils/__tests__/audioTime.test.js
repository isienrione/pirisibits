import { describe, expect, it } from 'vitest'
import { formatAudioTime } from '../audioTime'

describe('formatAudioTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatAudioTime(0)).toBe('0:00')
    expect(formatAudioTime(65)).toBe('1:05')
    expect(formatAudioTime(3723)).toBe('62:03')
  })

  it('handles invalid values', () => {
    expect(formatAudioTime(Number.NaN)).toBe('0:00')
    expect(formatAudioTime(-4)).toBe('0:00')
  })
})
