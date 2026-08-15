import { describe, expect, it, afterEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useTourManifest } from '../useV2Journey.js'
import { clearRomeManifestCache } from '../../content/manifest.js'
import { setActiveLocale } from '../../i18n/activeLocale.js'
import { LOCALES } from '../../i18n/locales.js'
import { LOCALE_CHANGED_EVENT, writeStoredLocale } from '../../i18n/storage.js'

describe('useTourManifest locale reload', () => {
  afterEach(() => {
    clearRomeManifestCache()
    setActiveLocale(LOCALES.EN)
    writeStoredLocale(LOCALES.EN)
  })

  it('reloads Spanish waypoint titles when the locale changes mid-session', async () => {
    setActiveLocale(LOCALES.EN)
    clearRomeManifestCache()

    const { result } = renderHook(() => useTourManifest())

    await waitFor(() => {
      expect(result.current.manifest?.waypointsById?.w08?.title).toBe('Temple of Vesta')
    })

    act(() => {
      setActiveLocale(LOCALES.ES)
      clearRomeManifestCache()
      window.dispatchEvent(
        new CustomEvent(LOCALE_CHANGED_EVENT, { detail: { locale: LOCALES.ES } }),
      )
    })

    await waitFor(() => {
      expect(result.current.manifest?.waypointsById?.w08?.title).toBe('Templo de Vesta')
    })
  })
})
