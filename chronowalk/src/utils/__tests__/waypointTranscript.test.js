import { describe, expect, it } from 'vitest'
import { getWaypointTranscript, hasPublishedTranscript } from '../waypointTranscript'

describe('waypointTranscript', () => {
  it('prefers arrival_transcript over subtitle', () => {
    const waypoint = {
      arrival_transcript: 'Published transcript copy.',
      arrival_subtitle: 'Subtitle only.',
    }

    expect(getWaypointTranscript(waypoint)).toBe('Published transcript copy.')
    expect(hasPublishedTranscript(waypoint)).toBe(true)
  })

  it('falls back to subtitle and placeholder', () => {
    expect(getWaypointTranscript({ arrival_subtitle: 'Built c. 126 AD' })).toBe('Built c. 126 AD')
    expect(hasPublishedTranscript({ arrival_subtitle: 'Built c. 126 AD' })).toBe(false)
    expect(getWaypointTranscript(null)).toMatch(/full captions and transcript/i)
  })
})
