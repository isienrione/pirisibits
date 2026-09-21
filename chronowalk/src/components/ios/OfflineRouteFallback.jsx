import { useEffect, useState } from 'react'
import { IS_IOS } from '../lib/platform.js'

/**
 * Offline map fallback — static route image + note when Network is offline on iOS.
 */
export default function OfflineRouteFallback({
  imageSrc = '/landing/rome-pricing-basemap-complete.jpg',
  note = "You're offline — the full tour still works.",
}) {
  return (
    <div
      data-testid="offline-route-fallback"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 180,
        overflow: 'hidden',
        borderRadius: 16,
        background: '#1A1612',
      }}
    >
      <img
        src={imageSrc}
        alt="Rome walking route"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.88,
        }}
      />
      <p
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          margin: 0,
          padding: '10px 12px',
          borderRadius: 10,
          background: 'rgba(22, 19, 15, 0.82)',
          color: '#F5F0E8',
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.35,
          textAlign: 'center',
        }}
      >
        {note}
      </p>
    </div>
  )
}

/** Subscribe to Capacitor Network (iOS) or navigator.onLine (web). */
export function useNetworkOnline() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine !== false,
  )

  useEffect(() => {
    let handle = null
    let cancelled = false

    async function bind() {
      if (IS_IOS) {
        try {
          const { Network } = await import('@capacitor/network')
          const status = await Network.getStatus()
          if (!cancelled) setOnline(Boolean(status.connected))
          handle = await Network.addListener('networkStatusChange', (s) => {
            setOnline(Boolean(s.connected))
          })
          return
        } catch {
          /* fall through */
        }
      }

      const sync = () => setOnline(navigator.onLine !== false)
      window.addEventListener('online', sync)
      window.addEventListener('offline', sync)
      sync()
      handle = {
        remove: () => {
          window.removeEventListener('online', sync)
          window.removeEventListener('offline', sync)
        },
      }
    }

    void bind()
    return () => {
      cancelled = true
      handle?.remove?.()
    }
  }, [])

  return online
}
