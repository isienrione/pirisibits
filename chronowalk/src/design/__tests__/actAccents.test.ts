import { describe, expect, it } from 'vitest'
import {
  actAccentPair,
  actAccentTextValue,
  actAccentValue,
  getActAccentTextVar,
  getActAccentVar,
} from '../actAccents.ts'

describe('actAccents', () => {
  it('maps act ids to vitality CSS variables', () => {
    expect(getActAccentVar('act1')).toBe('--act-arena')
    expect(getActAccentVar('act6')).toBe('--act-river')
    expect(getActAccentVar('encore')).toBe('--act-encore')
  })

  it('maps act ids to WCAG text CSS variables', () => {
    expect(getActAccentTextVar('act1')).toBe('--act-arena-text')
    expect(getActAccentTextVar('act5')).toBe('--act-city-text')
    expect(getActAccentTextVar('encore')).toBe('--act-encore-text')
  })

  it('falls back to forum accent for unknown acts', () => {
    expect(getActAccentVar('unknown')).toBe('--act-forum')
    expect(getActAccentTextVar('unknown')).toBe('--act-forum-text')
    expect(actAccentValue(null)).toBe('var(--act-forum)')
    expect(actAccentTextValue(null)).toBe('var(--act-forum-text)')
  })

  it('returns accent and accentText pairs', () => {
    expect(actAccentPair('act1')).toEqual({
      accent: 'var(--act-arena)',
      accentText: 'var(--act-arena-text)',
    })
  })
})
