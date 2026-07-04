import { useCallback } from 'react'
import { LOCATION_STATUS } from '../../hooks/useGeoLocation'
import { Button, GlassPanel, cn } from '../ui'

const COPY = {
  prompt: {
    title: 'Enable location for guided walking',
    body: 'ChronoWalk uses your position only while you walk between landmarks — never in the background.',
    action: 'Allow location',
  },
  [LOCATION_STATUS.WAITING]: {
    title: 'Finding your location',
    body: 'This usually takes a few seconds outdoors.',
    action: null,
  },
  [LOCATION_STATUS.DENIED]: {
    title: 'Location access is off',
    body: 'Enable location for this site in your browser settings, then try again.',
    action: 'Try again',
  },
  [LOCATION_STATUS.UNAVAILABLE]: {
    title: 'GPS signal unavailable',
    body: 'Move to an open area or try again in a moment.',
    action: 'Retry GPS',
  },
}

/**
 * Inline location prompt for the Begin Journey screen.
 */
export default function LocationRequestPanel({
  status,
  onRequest,
  onRetry,
  className,
}) {
  const granted = status === LOCATION_STATUS.GRANTED
  const copy = granted ? null : (status ? COPY[status] : COPY.prompt)

  const handleAction = useCallback(() => {
    if (status === LOCATION_STATUS.WAITING) return
    if (status === LOCATION_STATUS.DENIED || status === LOCATION_STATUS.UNAVAILABLE) {
      onRetry?.()
      return
    }
    onRequest?.()
  }, [onRequest, onRetry, status])

  if (granted) {
    return (
      <GlassPanel
        role="status"
        className={cn('rounded-2xl border-olive/30 bg-olive/10 px-4 py-3', className)}
      >
        <p className="text-sm font-semibold text-deep-slate">Location ready</p>
        <p className="mt-1 text-sm text-soft-slate">
          We&apos;ll guide you between landmarks as you walk.
        </p>
      </GlassPanel>
    )
  }

  return (
    <GlassPanel
      role="status"
      className={cn('rounded-2xl border-bronze/25 bg-ivory/95 px-4 py-4 shadow-plaque', className)}
      data-testid="location-request-panel"
    >
      <p className="text-sm font-semibold text-deep-slate">{copy.title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-soft-slate">{copy.body}</p>
      {copy.action ? (
        <Button variant="secondary" size="sm" className="mt-3" onClick={handleAction}>
          {copy.action}
        </Button>
      ) : null}
    </GlassPanel>
  )
}
