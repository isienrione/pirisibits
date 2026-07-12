import { describe, expect, it } from 'vitest'
import {
  isSameCalendarDay,
  resolveResumeCue,
  wasAwayLongEnough,
  RESUME_AWAY_MS,
} from '../journeyResume.js'

describe('journeyResume', () => {
  it('detects same calendar day in Rome', () => {
    const morning = Date.parse('2026-07-03T08:00:00Z')
    const evening = Date.parse('2026-07-03T20:00:00Z')
    expect(isSameCalendarDay(morning, evening)).toBe(true)
  })

  it('chooses same_day vs new_day resume cues', () => {
    const earlier = Date.parse('2026-07-03T10:00:00Z')
    const laterSameDay = Date.parse('2026-07-03T18:00:00Z')
    const nextDay = Date.parse('2026-07-04T10:00:00Z')

    expect(resolveResumeCue(earlier, laterSameDay)).toBe('same_day')
    expect(resolveResumeCue(earlier, nextDay)).toBe('new_day')
    expect(resolveResumeCue(null, nextDay)).toBe('new_day')
  })

  it('requires a minimum away duration before greeting again', () => {
    const lastActiveAt = Date.now() - RESUME_AWAY_MS + 1000
    expect(wasAwayLongEnough(lastActiveAt)).toBe(false)
    expect(wasAwayLongEnough(lastActiveAt - 2000)).toBe(true)
  })
})
