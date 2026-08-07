import { Button, cn } from './ui'
import { LOCATION_STATUS } from '../hooks/useGeoLocation'

const COPY = {
  [LOCATION_STATUS.DENIED]: {
    title: 'Location isn’t enabled',
    body: 'You can still use the map and choose stops manually. Enable location for this app in Settings when you want GPS arrivals.',
    action: 'Try location again',
  },
  [LOCATION_STATUS.UNAVAILABLE]: {
    title: 'GPS signal unavailable',
    body: 'Location is enabled, but we could not read your position yet. Move to an open area, or continue — the map will catch up when a fix arrives.',
    action: 'Retry GPS',
  },
  [LOCATION_STATUS.WAITING]: {
    title: 'Location is enabled. Finding your position…',
    body: 'You can keep walking. The map may start on the route until GPS is ready.',
    action: 'Continue anyway',
  },
  [LOCATION_STATUS.SEARCHING]: {
    title: 'Location is enabled. Finding your position…',
    body: 'You can keep walking. The map may start on the route until GPS is ready.',
    action: 'Continue anyway',
  },
}

function LocationNotice({ status, onRetry, onContinue, className, compact = false }) {
  if (!status || status === LOCATION_STATUS.GRANTED) return null

  const copy = COPY[status] ?? COPY[LOCATION_STATUS.UNAVAILABLE]
  const actionHandler =
    status === LOCATION_STATUS.WAITING || status === LOCATION_STATUS.SEARCHING
      ? onContinue ?? onRetry
      : onRetry

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
      {copy.action && actionHandler ? (
        <Button
          variant="quiet"
          size="sm"
          className="mt-3"
          onClick={actionHandler}
        >
          {copy.action}
        </Button>
      ) : null}
    </div>
  )
}

export default LocationNotice
