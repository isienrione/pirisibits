import { isDevGeofencesSantiago } from '../../config/env.js'

const POOR_ACCURACY_M = 60
const DEV_GEOFENCE_ACCURACY_M = 150

export default function DevGeofenceHud({ geoTarget, geo, arrivalAccuracyLimitM = DEV_GEOFENCE_ACCURACY_M }) {
  if (!isDevGeofencesSantiago()) return null

  const label =
    geoTarget?._devGeofenceOverride?.label ??
    geoTarget?.title ??
    geoTarget?.name ??
    'Test site'

  const accuracy = geo.accuracy
  const accuracyReliable = accuracy == null || accuracy <= arrivalAccuracyLimitM
  const inside = Boolean(geo.insideGeofence)

  let autoStatus = 'Outside — keep walking'
  if (inside && !accuracyReliable) {
    autoStatus = `Inside, but accuracy too low for auto-arrive (need ≤${arrivalAccuracyLimitM} m) — use I'm here`
  } else if (inside && accuracyReliable) {
    autoStatus = 'Inside + accuracy OK — arrival card auto-opens after ~5 s'
  }

  return (
    <div
      className="cw-dev-geofence-hud"
      data-testid="dev-geofence-hud"
      aria-live="polite"
    >
      <p className="cw-dev-geofence-hud__title">Santiago GPS test active</p>
      <p className="cw-dev-geofence-hud__line">{label}</p>
      <p className="cw-dev-geofence-hud__line">
        Distance {geo.distance != null ? `${Math.round(geo.distance)} m` : '-'}
        {' · '}
        Accuracy {accuracy != null ? `${Math.round(accuracy)} m` : '-'}
        {' · '}
        {inside ? 'Inside geofence' : 'Outside geofence'}
      </p>
      <p className="cw-dev-geofence-hud__line" data-testid="dev-geofence-auto-status">
        {autoStatus}
      </p>
      {arrivalAccuracyLimitM !== POOR_ACCURACY_M ? (
        <p className="cw-dev-geofence-hud__line">
          Accuracy limit relaxed to {arrivalAccuracyLimitM} m for this field test
        </p>
      ) : null}
    </div>
  )
}
