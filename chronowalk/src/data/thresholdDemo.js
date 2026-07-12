import { getWaypoint, loadRomeManifest } from '../content/manifest.js'
import { resolveThresholdAmbienceUrls } from '../content/thresholdAmbience.js'
import { mediaUrl } from '../lib/mediaUrl'

const manifest = loadRomeManifest()
const pantheon = getWaypoint(manifest, 'w17')
const { nowAmbienceUrl, thenSoundscapeUrl } = resolveThresholdAmbienceUrls(manifest)

/** Pantheon demo pair for landing threshold (M8) and local dev testing. */
export const THRESHOLD_DEMO_WAYPOINT = {
  id: 'demo-pantheon',
  name: pantheon.title,
  reconstruction: {
    now: mediaUrl(pantheon.reconstruction.now),
    then: mediaUrl(pantheon.reconstruction.then),
    loop: mediaUrl(pantheon.reconstruction.loop),
    caption: pantheon.reconstruction.caption,
  },
  nowAmbience: nowAmbienceUrl,
  thenSoundscape: thenSoundscapeUrl,
}

export const THRESHOLD_HOLD_MS = 2400
export const THRESHOLD_HOLD_COMMIT_MS = 2000
export const THRESHOLD_RELEASE_MS = 900
export const THRESHOLD_HOLD_COMMIT_FINISH_MS = 400
