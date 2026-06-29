import { beforeEach, describe, expect, it } from 'vitest'
import {
  readAcquisitionSource,
  resolveAcquisitionSource,
  writeAcquisitionSource,
} from '../appPreferences'

describe('acquisition source preferences', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('persists utm_source from the landing URL once', () => {
    window.history.replaceState({}, '', '/?utm_source=rome-blogger')
    expect(resolveAcquisitionSource()).toBe('rome-blogger')
    expect(readAcquisitionSource()).toBe('rome-blogger')

    window.history.replaceState({}, '', '/?utm_source=other')
    expect(resolveAcquisitionSource()).toBe('rome-blogger')
  })

  it('falls back to via when utm_source is absent', () => {
    window.history.replaceState({}, '', '/?via=newsletter')
    expect(resolveAcquisitionSource()).toBe('newsletter')
  })

  it('does not overwrite an existing stored source', () => {
    writeAcquisitionSource('podcast')
    window.history.replaceState({}, '', '/?via=email')
    expect(resolveAcquisitionSource()).toBe('podcast')
  })
})
