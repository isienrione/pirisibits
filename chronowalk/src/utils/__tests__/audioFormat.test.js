import { describe, expect, it } from 'vitest'
import { formatAudioTime, formatRemainingTime } from '../audioFormat'

describe('audioFormat', () => {
  it('formats seconds into mm:ss', () => {
    expect(formatAudioTime(0)).toBe('0:00')
    expect(formatAudioTime(65)).toBe('1:05')
    expect(formatAudioTime(3723)).toBe('1:02:03')
  })

  it('formats remaining time with a leading minus', () => {
    expect(formatRemainingTime(30, 120)).toBe('-1:30')
    expect(formatRemainingTime(0, 0)).toBe('—:——')
  })
})
