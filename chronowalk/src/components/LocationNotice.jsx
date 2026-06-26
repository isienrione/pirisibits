import { EmptyState, cn } from './ui'
import { LOCATION_STATUS } from '../hooks/useGeoLocation'

const PRESET_BY_STATUS = {
  [LOCATION_STATUS.DENIED]: 'noGps',
  [LOCATION_STATUS.UNAVAILABLE]: 'gpsUnavailable',
  [LOCATION_STATUS.WAITING]: 'gpsWaiting',
}

function LocationNotice({ status, onRetry, className, compact = false }) {
  if (!status || status === LOCATION_STATUS.GRANTED) return null

  const preset = PRESET_BY_STATUS[status] ?? 'gpsUnavailable'

  return (
    <EmptyState
      preset={preset}
      compact={compact}
      onAction={onRetry}
      className={cn(
        'pointer-events-auto rounded-2xl border-terracotta/25 text-left shadow-glass',
        className
      )}
    />
  )
}

export default LocationNotice
