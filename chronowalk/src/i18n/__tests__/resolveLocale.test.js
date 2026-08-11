import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, LOCALES } from '../locales.js'
import { resolveLocale } from '../resolveLocale.js'

describe('resolveLocale', () => {
  it('defaults to English with no query, storage, or navigator preference', () => {
    expect(
      resolveLocale({
        search: '',
        stored: null,
        preferNavigator: false,
      }),
    ).toBe(DEFAULT_LOCALE)
    expect(DEFAULT_LOCALE).toBe(LOCALES.EN)
  })

  it('does not follow a Spanish browser when preferNavigator is off', () => {
    const previous = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { language: 'es-ES', languages: ['es-ES', 'es'] },
    })
    try {
      expect(
        resolveLocale({
          search: '',
          stored: null,
          preferNavigator: false,
        }),
      ).toBe(LOCALES.EN)
    } finally {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: previous,
      })
    }
  })

  it('honors an explicit stored Spanish preference', () => {
    expect(
      resolveLocale({
        search: '',
        stored: LOCALES.ES,
        preferNavigator: false,
      }),
    ).toBe(LOCALES.ES)
  })

  it('honors ?lang=es', () => {
    expect(
      resolveLocale({
        search: '?lang=es',
        stored: null,
        preferNavigator: false,
      }),
    ).toBe(LOCALES.ES)
  })
})
