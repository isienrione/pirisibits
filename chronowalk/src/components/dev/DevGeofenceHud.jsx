import { isDevGeofencesSantiago } from '../../config/env.js'

export default function DevGeofenceHud({ geoTarget, geo }) {
  if (!isDevGeofencesSantiago()) return null

  const label =
    geoTarget?._devGeofenceOverride?.label ??
    geoTarget?.title ??
    geoTarget?.name ??
    'Test site'

  return (
    <div
      className="cw-dev-geofence-hud"
      data-testid="dev-geofence-hud"
      aria-live="polite"
    >
      <p className="cw-dev-geofence-hud__title">Santiago GPS test active</p>
      <p className="cw-dev-geofence-hud__line">{label}</p>
      <p className="cw-dev-geofence-hud__line">
        Distance {geo.distance != null ? `${Math.round(geo.distance)} m` : '—'}
        {' · '}
        Accuracy {geo.accuracy != null ? `${Math.round(geo.accuracy)} m` : '—'}
        {' · '}
        {geo.insideGeofence ? 'Inside geofence' : 'Outside geofence'}
      </p>
    </div>
  )
}
