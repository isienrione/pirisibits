import { useGeoLocation, LOCATION_STATUS } from '../../hooks/useGeoLocation.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { isDebugGeo } from '../../config/env.js'

function SettingRow({ title, description, value, action }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        padding: '16px 0',
        borderBottom: '1px solid color-mix(in srgb, var(--ink) 8%, var(--bone))',
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 'var(--fs-body)', fontWeight: 600, color: 'var(--ink)' }}>{title}</p>
        {description ? (
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 'var(--fs-secondary)',
              lineHeight: 1.5,
              color: 'color-mix(in srgb, var(--ink) 62%, var(--bone))',
            }}
          >
            {description}
          </p>
        ) : null}
        {action}
      </div>
      {value ? (
        <span
          style={{
            flexShrink: 0,
            padding: '6px 10px',
            borderRadius: 999,
            background: 'color-mix(in srgb, var(--ink) 6%, var(--bone))',
            fontSize: 'var(--fs-meta)',
            fontWeight: 600,
            color: 'color-mix(in srgb, var(--ink) 72%, var(--bone))',
          }}
        >
          {value}
        </span>
      ) : null}
    </div>
  )
}

function locationLabel(status, distance) {
  if (status === LOCATION_STATUS.GRANTED) {
    return distance != null ? `${Math.round(distance)} m tracked` : 'Live'
  }
  if (status === LOCATION_STATUS.DENIED) return 'Denied'
  if (status === LOCATION_STATUS.UNAVAILABLE) return 'Unavailable'
  return 'Waiting'
}

export default function SettingsGuidancePanel() {
  const reducedMotion = useReducedMotion()
  const debugGeo = isDebugGeo()
  const { locationStatus, distance, retryLocation } = useGeoLocation({
    debugMode: debugGeo,
    target: { lat: 41.8902, lng: 12.4922 },
    geofenceThresholdM: 5000,
  })

  const showRetry =
    !debugGeo &&
    (locationStatus === LOCATION_STATUS.DENIED || locationStatus === LOCATION_STATUS.UNAVAILABLE)

  return (
    <section
      style={{
        marginTop: 28,
        padding: '4px 18px 8px',
        borderRadius: 'var(--r-card)',
        border: '1px solid color-mix(in srgb, var(--ink) 10%, var(--bone))',
        background: 'color-mix(in srgb, var(--ink) 2%, var(--bone))',
      }}
    >
      <p
        style={{
          margin: '14px 0 0',
          fontSize: 'var(--fs-caption)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'color-mix(in srgb, var(--ink) 50%, var(--bone))',
        }}
      >
        Guidance
      </p>

      <SettingRow
        title="Location"
        description={
          debugGeo
            ? 'Debug GPS is simulating your position for testing.'
            : 'Required for arrival detection and walking guidance between stops.'
        }
        value={locationLabel(locationStatus, distance)}
        action={
          showRetry ? (
            <button
              type="button"
              onClick={retryLocation}
              style={{
                marginTop: 10,
                padding: 0,
                border: 'none',
                background: 'none',
                color: 'var(--accent)',
                fontSize: 'var(--fs-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry GPS
            </button>
          ) : null
        }
      />

      <SettingRow
        title="Reduced motion"
        description={
          reducedMotion
            ? 'Your device prefers reduced motion · animations are softened.'
            : 'Full motion is enabled for arrivals and transitions.'
        }
        value={reducedMotion ? 'On' : 'Off'}
      />
    </section>
  )
}
