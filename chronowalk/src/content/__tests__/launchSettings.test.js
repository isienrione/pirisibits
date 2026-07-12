import { describe, expect, it } from 'vitest'
import { LAUNCH_SETTINGS_COPY, SETTINGS_SECTION_LABELS, SETTINGS_SECTIONS } from '../launchSettings'

describe('launchSettings', () => {
  it('defines the seven settings sections', () => {
    expect(Object.values(SETTINGS_SECTIONS)).toEqual([
      'tour',
      'audio',
      'offline',
      'notifications',
      'appearance',
      'help',
      'privacy',
    ])
    expect(SETTINGS_SECTION_LABELS[SETTINGS_SECTIONS.HELP]).toBe('Help & Support')
  })

  it('uses clear copy without dense technical language', () => {
    expect(LAUNCH_SETTINGS_COPY.subtitle).toMatch(/clear choices/i)
    expect(LAUNCH_SETTINGS_COPY.privacySummary).toMatch(/this device/i)
  })
})
