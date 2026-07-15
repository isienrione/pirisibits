import { useCallback, useEffect, useState } from 'react'
import { isIosDevice, isIosNonSafari, isStandaloneMode } from '../utils/pwaInstall'

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(() => isStandaloneMode())

  useEffect(() => {
    setInstalled(isStandaloneMode())

    const onBeforeInstall = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    const onAppInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    const onDisplayModeChange = () => {
      setInstalled(isStandaloneMode())
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)

    const standaloneMedia =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(display-mode: standalone)')
        : null
    standaloneMedia?.addEventListener('change', onDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onAppInstalled)
      standaloneMedia?.removeEventListener('change', onDisplayModeChange)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt?.prompt) {
      return { ok: false, reason: 'unavailable' }
    }

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)

    if (outcome === 'accepted') {
      setInstalled(true)
    }

    return { ok: outcome === 'accepted', outcome }
  }, [deferredPrompt])

  const canPromptInstall = Boolean(deferredPrompt)
  // All iOS browsers need Share → Add to Home Screen (Chrome/Firefox must open Safari first).
  const showIosInstructions = !installed && isIosDevice()
  const needsSafariForInstall = showIosInstructions && isIosNonSafari()
  const showInstallOption = !installed

  return {
    installed,
    canPromptInstall,
    showIosInstructions,
    needsSafariForInstall,
    showInstallOption,
    promptInstall,
  }
}
