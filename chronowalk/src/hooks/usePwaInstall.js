import { useCallback, useEffect, useState } from 'react'
import { isIosDevice, isStandaloneMode } from '../utils/pwaInstall'
import { IS_IOS } from '../lib/platform.js'

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(() => isStandaloneMode())

  useEffect(() => {
    // Native iOS app — never show Add to Home Screen.
    if (IS_IOS) return undefined

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

  const canPromptInstall = !IS_IOS && Boolean(deferredPrompt)
  const showIosInstructions = !IS_IOS && !installed && isIosDevice()
  const showInstallOption = !IS_IOS && !installed

  return {
    installed: IS_IOS ? true : installed,
    canPromptInstall,
    showIosInstructions,
    showInstallOption,
    promptInstall,
  }
}
