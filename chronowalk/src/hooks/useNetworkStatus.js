import { useEffect, useState } from 'react'

export function isNavigatorOnline() {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

/**
 * Tracks browser online/offline state for graceful offline tour behavior.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => isNavigatorOnline())

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
  }
}
