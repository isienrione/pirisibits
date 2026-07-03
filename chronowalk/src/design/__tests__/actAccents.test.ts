import { describe, expect, it } from 'vitest'
import { actAccentValue, getActAccentVar } from '../actAccents.ts'

describe('actAccents', () => {
  it('maps act ids to vitality CSS variables', () => {
    expect(getActAccentVar('act1')).toBe('--act-arena')
    expect(getActAccentVar('act6')).toBe('--act-river')
    expect(getActAccentVar('encore')).toBe('--act-encore')
  })

  it('falls back to forum accent for unknown acts', () => {
    expect(getActAccentVar('unknown')).toBe('--act-forum')
    expect(actAccentValue(null)).toBe('var(--act-forum)')
  })
})
