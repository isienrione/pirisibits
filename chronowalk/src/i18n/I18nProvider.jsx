import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { setActiveLocale, getActiveLocale } from './activeLocale.js'
import { DEFAULT_LOCALE, LOCALES, LOCALE_LABELS, SUPPORTED_LOCALES, normalizeLocale } from './locales.js'
import { consumeLangQueryParam, resolveLocale } from './resolveLocale.js'
import {
  LOCALE_CHANGED_EVENT,
  readStoredLocale,
  resolvePersistedLocale,
  writeStoredLocale,
} from './storage.js'
import { t as translate } from './t.js'
import { clearRomeManifestCache } from '../content/manifest.js'

const I18nContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: translate,
  locales: SUPPORTED_LOCALES,
  labels: LOCALE_LABELS,
})

function applyDocumentLocale(locale) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale === LOCALES.ES ? 'es' : 'en'
}

function bootLocale() {
  const fromQuery = consumeLangQueryParam()
  if (fromQuery) {
    writeStoredLocale(fromQuery)
    setActiveLocale(fromQuery)
    applyDocumentLocale(fromQuery)
    return fromQuery
  }

  const resolved = resolveLocale({
    stored: readStoredLocale(),
    preferNavigator: !readStoredLocale(),
  })
  setActiveLocale(resolved)
  applyDocumentLocale(resolved)
  return resolved
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE
    return bootLocale()
  })

  const setLocale = useCallback((next) => {
    const normalized = normalizeLocale(next)
    writeStoredLocale(normalized)
    setActiveLocale(normalized)
    applyDocumentLocale(normalized)
    clearRomeManifestCache()
    setLocaleState(normalized)
  }, [])

  useEffect(() => {
    // Keep module-level locale + <html lang> in sync after hydration.
    setActiveLocale(locale)
    applyDocumentLocale(locale)
  }, [locale])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const onStorage = (event) => {
      if (event.key && event.key !== 'cw_locale_v1') return
      const next = resolvePersistedLocale()
      if (next === getActiveLocale()) return
      setActiveLocale(next)
      applyDocumentLocale(next)
      clearRomeManifestCache()
      setLocaleState(next)
    }

    const onLocaleEvent = (event) => {
      const next = normalizeLocale(event.detail?.locale ?? resolvePersistedLocale())
      if (next === getActiveLocale()) return
      setActiveLocale(next)
      applyDocumentLocale(next)
      clearRomeManifestCache()
      setLocaleState(next)
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener(LOCALE_CHANGED_EVENT, onLocaleEvent)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(LOCALE_CHANGED_EVENT, onLocaleEvent)
    }
  }, [])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => translate(key, vars, locale),
      locales: SUPPORTED_LOCALES,
      labels: LOCALE_LABELS,
    }),
    [locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}

export function useT() {
  return useI18n().t
}
