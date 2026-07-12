import { Button, cn } from './ui'
import { LOCATION_STATUS } from '../hooks/useGeoLocation'

const COPY = {
  [LOCATION_STATUS.DENIED]: {
    title: 'Location access is off',
    body: 'ChronoWalk needs your location to detect arrivals and guide you between landmarks. Enable location for this site in your browser settings, then try again.',
    action: 'Try location again',
  },
  [LOCATION_STATUS.UNAVAILABLE]: {
    title: 'GPS signal unavailable',
    body: 'We could not read your position. Move to an open area, check that location services are on, or try again in a moment.',
    action: 'Retry GPS',
  },
  [LOCATION_STATUS.WAITING]: {
    title: 'Finding your location',
    body: 'Waiting for a GPS fix. This usually takes a few seconds outdoors.',
    action: null,
  },
}

function LocationNotice({ status, onRetry, className, compact = false }) {
  if (!status || status === LOCATION_STATUS.GRANTED) return null

  const copy = COPY[status] ?? COPY[LOCATION_STATUS.UNAVAILABLE]

  return (
    <div
      role="status"
      className={cn("bg-ink900 rounded-card", 
        'pointer-events-auto rounded-2xl border-ember/25 bg-ink900/95 px-4 py-3 ',
        className
      )}
    >
      <p className="text-sm font-semibold text-ink900">{copy.title}</p>
      {!compact ? (
        <p className="mt-1 text-sm leading-relaxed text-muted">{copy.body}</p>
      ) : null}
      {copy.action && onRetry ? (
        <Button
          variant="quiet"
          size="sm"
          className="mt-3"
          onClick={onRetry}
        >
          {copy.action}
        </Button>
      ) : null}
    </div>
  )
}

export default LocationNotice
