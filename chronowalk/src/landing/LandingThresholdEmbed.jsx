import Threshold from '../components/Threshold.jsx'
import { THRESHOLD_DEMO_WAYPOINT } from '../data/thresholdDemo.js'

export default function LandingThresholdEmbed({ onFullyRevealed }) {
  return (
    <Threshold
      waypoint={THRESHOLD_DEMO_WAYPOINT}
      nowAmbienceUrl={THRESHOLD_DEMO_WAYPOINT.nowAmbience}
      thenSoundscapeUrl={THRESHOLD_DEMO_WAYPOINT.thenSoundscape}
      embedded
      active
      onFullyRevealed={onFullyRevealed}
    />
  )
}
