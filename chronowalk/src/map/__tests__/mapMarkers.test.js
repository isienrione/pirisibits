import { describe, expect, it, vi } from 'vitest'
import {
  createLandmarkMarkerElement,
  createUserMarkerElement,
  escapeHtml,
  resolveLandmarkGlyph,
  shortMarkerLabel,
} from '../mapMarkers.js'

describe('mapMarkers', () => {
  it('resolves landmark glyphs from stop id and title', () => {
    expect(resolveLandmarkGlyph('colosseum', 'The Colosseum')).toBe('amphitheater')
    expect(resolveLandmarkGlyph('pantheon', 'The Pantheon')).toBe('temple')
    expect(resolveLandmarkGlyph('fontana-di-trevi', 'Trevi Fountain')).toBe('fountain')
    expect(resolveLandmarkGlyph('arch-of-titus', 'Arch of Titus')).toBe('arch')
    expect(resolveLandmarkGlyph('palatine-hill', 'Palatine Hill')).toBe('hill')
  })

  it('shortens labels for pill markers', () => {
    expect(shortMarkerLabel('The Colosseum')).toBe('Colosseum')
    expect(shortMarkerLabel('Temple of Antoninus and Faustina', 14).endsWith('…')).toBe(true)
  })

  it('escapes HTML in labels', () => {
    expect(escapeHtml(`Foo <bar> & "baz"`)).toBe('Foo &lt;bar&gt; &amp; &quot;baz&quot;')
  })

  it('builds a dark pill marker with glyph and label', () => {
    const el = createLandmarkMarkerElement('The Pantheon', 'current', null, {
      stopId: 'pantheon',
      showLabel: true,
    })

    expect(el.className).toContain('cw-map-pill')
    expect(el.className).toContain('cw-map-pill--current')
    expect(el.querySelector('.cw-map-pill__icon')?.getAttribute('data-glyph')).toBe('temple')
    expect(el.querySelector('.cw-map-pill__label')?.textContent).toBe('Pantheon')
    expect(el.querySelector('svg')).toBeTruthy()
  })

  it('invokes onPress when the pill is clicked', () => {
    const onPress = vi.fn()
    const el = createLandmarkMarkerElement('Colosseum', 'current', onPress, {
      stopId: 'colosseum',
    })

    el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('builds a gold pulsing user-location marker', () => {
    const el = createUserMarkerElement({ minimalUI: true })

    expect(el.className).toContain('cw-map-user')
    expect(el.className).toContain('cw-map-user--minimal')
    expect(el.querySelectorAll('.cw-map-user__ring')).toHaveLength(2)
    expect(el.querySelector('.cw-map-user__core')).toBeTruthy()
    expect(el.getAttribute('aria-label')).toBe('Your location')
  })
})
