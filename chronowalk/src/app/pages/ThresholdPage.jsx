import { useJourney, useTourManifest } from '../hooks/useJourney'
import { JOURNEY_STATES } from '../state/journey'
import { resolveWaypointMedia } from '../lib/tour'
import { THRESHOLD_DEMO_WAYPOINT } from '../data/thresholdDemo'
import Threshold from '../components/Threshold'

export function ThresholdDemoPage() {
  const waypoint = THRESHOLD_DEMO_WAYPOINT

  return (
    <Threshold
      waypoint={waypoint}
      nowAmbienceUrl={waypoint.nowAmbience}
      thenSoundscapeUrl={waypoint.thenSoundscape}
      active
    />
  )
}

export function JourneyThresholdLayer() {
  const { state, context } = useJourney()
  const { manifest } = useTourManifest()

  if (state !== JOURNEY_STATES.THRESHOLD || !manifest) return null

  const waypoint = manifest.waypoints[context.currentWaypointIndex]
  if (!waypoint?.reconstruction) return null

  const resolved = resolveWaypointMedia(waypoint)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
      }}
    >
      <Threshold
        waypoint={resolved}
        nowAmbienceUrl={THRESHOLD_DEMO_WAYPOINT.nowAmbience}
        thenSoundscapeUrl={THRESHOLD_DEMO_WAYPOINT.thenSoundscape}
        active
      />
    </div>
  )
}
