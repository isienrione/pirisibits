/**
 * Minimal hook surface for future download UI.
 * Not wired into production screens in this PR.
 */

import { useCallback, useEffect, useState } from 'react'
import { getDownloadService } from './downloadService.js'

/**
 * @param {string} productId
 * @param {{ locale?: string, service?: ReturnType<typeof getDownloadService> }} [options]
 */
export function useProductDownload(productId, options = {}) {
  const service = options.service ?? getDownloadService()
  const locale = options.locale || 'en'
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!productId) {
      setStatus(null)
      return null
    }
    const next = await service.getDownloadStatus(productId, locale)
    setStatus(next)
    return next
  }, [service, productId, locale])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const download = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const result = await service.downloadProduct(productId, { locale })
      setStatus(result.record)
      if (!result.ok) setError(result.code)
      return result
    } finally {
      setBusy(false)
    }
  }, [service, productId, locale])

  const remove = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const result = await service.removeDownload(productId, locale)
      await refresh()
      return result
    } finally {
      setBusy(false)
    }
  }, [service, productId, locale, refresh])

  return {
    status,
    busy,
    error,
    refresh,
    download,
    remove,
    pause: () => service.pauseDownload(productId, locale),
    resume: () => service.resumeDownload(productId, { locale }),
  }
}
