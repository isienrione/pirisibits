import { useCallback, useEffect, useState } from 'react'
import { canOfferPwaInstall } from '../platform/runtime/index.js'
import { isIosDevice, isStandaloneMode, shouldOfferPwaInstall } from '../utils/pwaInstall'

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(() => isStandaloneMode())

  useEffect(() => {
    // Native shell already is the app — never surface web install prompts.
    if (!canOfferPwaInstall()) {
      setInstalled(true)
      setDeferredPrompt(null)
      return undefined
    }

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

  const offerInstall = shouldOfferPwaInstall()
  const canPromptInstall = offerInstall && Boolean(deferredPrompt)
  const showIosInstructions = offerInstall && !installed && isIosDevice()
  const showInstallOption = offerInstall && !installed

  return {
    installed,
    canPromptInstall,
    showIosInstructions,
    showInstallOption,
    promptInstall,
  }
}
