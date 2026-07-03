import { Link } from 'react-router-dom'
import LocationNotice from '../LocationNotice.jsx'
import { LOCATION_STATUS } from '../../hooks/useGeoLocation.js'
import CompanionNotice from './CompanionNotice.jsx'
import { JourneyLayout, JourneyPrimaryButton, JourneySecondaryButton } from './JourneyLayout.jsx'

export default function WalkingScreen({
  title,
  subtitle,
  distance,
  locationStatus,
  onRetryLocation,
  companionMode,
  onSimulateArrival,
  onContinue,
  continueLabel = 'Continue',
  showContinue = false,
  busy = false,
}) {
  const distanceLabel =
    distance != null ? `${Math.round(distance)} m away` : 'Finding your position…'

  const showLocationNotice =
    locationStatus &&
    locationStatus !== LOCATION_STATUS.GRANTED &&
    locationStatus !== LOCATION_STATUS.WAITING

  return (
    <JourneyLayout eyebrow="Walking" title={title} subtitle={subtitle}>
      {showLocationNotice ? (
        <div style={{ marginTop: 16 }}>
          <LocationNotice status={locationStatus} onRetry={onRetryLocation} compact />
        </div>
      ) : null}

      <CompanionNotice mode={companionMode} targetTitle={title} />

      <p style={{ margin: '16px 0 0', fontSize: 'var(--fs-meta)', color: 'var(--muted-warm)' }}>
        {distanceLabel}
      </p>

      {showContinue ? (
        <div style={{ marginTop: 28 }}>
          <JourneyPrimaryButton onClick={onContinue} disabled={busy}>
            {continueLabel}
          </JourneyPrimaryButton>
        </div>
      ) : null}

      {onSimulateArrival ? (
        <JourneySecondaryButton onClick={onSimulateArrival} disabled={busy}>
          I&apos;ve arrived
        </JourneySecondaryButton>
      ) : null}

      <Link
        to="/map"
        style={{
          display: 'inline-block',
          marginTop: 16,
          color: 'var(--ember)',
          fontSize: 'var(--fs-secondary)',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Open map
      </Link>
    </JourneyLayout>
  )
}
