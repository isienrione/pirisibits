import { JourneyLayout } from './JourneyLayout.jsx'
import LocationNotice from '../LocationNotice.jsx'
import { LOCATION_STATUS } from '../../hooks/useGeoLocation.js'
import CompanionNotice from './CompanionNotice.jsx'

export default function ApproachingScreen({
  waypointName,
  approachLine,
  distance,
  locationStatus,
  onRetryLocation,
  companionMode,
}) {
  const showLocationNotice =
    locationStatus &&
    locationStatus !== LOCATION_STATUS.GRANTED &&
    locationStatus !== LOCATION_STATUS.WAITING

  return (
    <JourneyLayout eyebrow="Approaching" title={waypointName} subtitle={approachLine}>
      {showLocationNotice ? (
        <div style={{ marginTop: 16 }}>
          <LocationNotice status={locationStatus} onRetry={onRetryLocation} compact />
        </div>
      ) : null}

      <CompanionNotice mode={companionMode} targetTitle={waypointName} />

      {distance != null ? (
        <p style={{ margin: '16px 0 0', fontSize: 'var(--fs-meta)', color: 'var(--muted-warm)' }}>
          {Math.round(distance)} m away
        </p>
      ) : null}
    </JourneyLayout>
  )
}
