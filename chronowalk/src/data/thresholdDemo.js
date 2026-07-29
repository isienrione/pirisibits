import { getWaypoint, loadRomeManifest } from '../content/manifest.js'
import { resolveThresholdAmbienceUrls } from '../content/thresholdAmbience.js'
import { mediaUrl } from '../lib/mediaUrl'

export {
  THRESHOLD_HOLD_MS,
  THRESHOLD_HOLD_COMMIT_MS,
  THRESHOLD_HOLD_COMMIT_FINISH_MS,
  THRESHOLD_RELEASE_MS,
} from './thresholdTiming.js'

function buildThresholdDemoWaypoint() {
  try {
    const manifest = loadRomeManifest()
    const pantheon = getWaypoint(manifest, 'w17')
    if (!pantheon?.reconstruction) return null
    const { nowAmbienceUrl, thenSoundscapeUrl } = resolveThresholdAmbienceUrls(manifest)
    return {
      id: 'demo-pantheon',
      name: pantheon.title ?? 'Pantheon',
      reconstruction: {
        now: mediaUrl(pantheon.reconstruction.now),
        then: mediaUrl(pantheon.reconstruction.then),
        loop: mediaUrl(pantheon.reconstruction.loop),
        caption: pantheon.reconstruction.caption,
      },
      nowAmbience: nowAmbienceUrl,
      thenSoundscape: thenSoundscapeUrl,
    }
  } catch (error) {
    console.error('thresholdDemo: failed to build Pantheon demo waypoint', error)
    return null
  }
}

/** Pantheon demo pair for landing threshold (M8) and local dev testing. */
export const THRESHOLD_DEMO_WAYPOINT = buildThresholdDemoWaypoint()
