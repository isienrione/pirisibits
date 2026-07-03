import { useNetworkStatus } from '../hooks/useNetworkStatus.js'
import { useJourney } from '../hooks/useJourney.js'
import { JOURNEY_STATES } from '../state/journey.js'

export default function NetworkStatusBanner() {
  const { isOffline } = useNetworkStatus()
  const { state } = useJourney()

  if (!isOffline || state === JOURNEY_STATES.IDLE) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Offline mode"
      style={{
        position: 'fixed',
        top: 'max(10px, env(safe-area-inset-top))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 65,
        padding: '8px 14px',
        borderRadius: 999,
        background: 'color-mix(in srgb, var(--ink) 88%, transparent)',
        border: '1px solid color-mix(in srgb, var(--warm-white) 14%, transparent)',
        color: 'var(--warm-white)',
        fontSize: 'var(--fs-meta)',
        fontWeight: 600,
        backdropFilter: 'blur(8px)',
      }}
    >
      Offline — cached audio and maps still work
    </div>
  )
}
