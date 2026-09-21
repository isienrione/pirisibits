import { useEffect, useState } from 'react'
import { IS_IOS } from '../lib/platform.js'

export function isNavigatorOnline() {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

/**
 * Tracks online/offline state for graceful offline tour behavior.
 * On iOS Capacitor uses @capacitor/network; web uses navigator.onLine.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => isNavigatorOnline())

  useEffect(() => {
    let handle = null
    let cancelled = false

    async function bind() {
      if (IS_IOS) {
        try {
          const { Network } = await import('@capacitor/network')
          const status = await Network.getStatus()
          if (!cancelled) setIsOnline(Boolean(status.connected))
          handle = await Network.addListener('networkStatusChange', (s) => {
            setIsOnline(Boolean(s.connected))
          })
          return
        } catch {
          /* fall through to browser events */
        }
      }

      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      handle = {
        remove: () => {
          window.removeEventListener('online', handleOnline)
          window.removeEventListener('offline', handleOffline)
        },
      }
    }

    void bind()
    return () => {
      cancelled = true
      handle?.remove?.()
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
  }
}
