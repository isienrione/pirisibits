import WalkingCompanionScreen from './WalkingCompanionScreen.jsx'

/** Baked into this chunk — must bump when layout changes (see walkingUiRevision.js). */
export const WALKING_UI_REVISION = 15

/** Walking toward a waypoint — delegates to the unified walking companion layout. */
export default function C2Walking({
  onSimulateArrival: _onSimulateArrival,
  onBeginChapter,
  insideGeofence = false,
  locationShy: _locationShy,
  near = false,
  stopKey,
  bearingDeg: _bearingDeg,
  bearingIsLive: _bearingIsLive,
  direction: _direction,
  signatureLine: _signatureLine,
  companionLine: _companionLine,
  embedded: _embedded,
  photo,
  actNumeral,
  ...rest
}) {
  return (
    <WalkingCompanionScreen
      {...rest}
      photo={photo}
      actNumeral={actNumeral}
      stopKey={stopKey}
      walkingUiRev={WALKING_UI_REVISION}
      mode="waypoint"
      testId="walking-companion-screen"
      onBeginChapter={onBeginChapter}
      // JourneyShell owns ceremonial arrived (C4). Companion stays in walking until then.
      arrived={false}
      near={near || insideGeofence}
    />
  )
}
