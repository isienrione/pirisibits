/**
 * Process-wide AudioEngine so narration survives in-app tab changes
 * (/journey → /map → /stops). JourneyShell unmounts on those routes; tearing
 * the engine down with it was stopping HTML audio mid-story.
 */
import { createAudioEngine } from './AudioEngine.js'

let sharedEngine = null
let sharedManifestKey = null

function manifestKey(manifest) {
  if (!manifest) return null
  return (
    manifest.tour_id ||
    manifest.meta?.id ||
    manifest.journey?.id ||
    manifest.id ||
    'rome'
  )
}

export function getSharedAudioEngine(manifest, { path } = {}) {
  if (!manifest) return null

  const key = manifestKey(manifest)

  if (sharedEngine && sharedManifestKey === key) {
    sharedEngine.setManifest(manifest)
    if (path != null) sharedEngine.setPath(path)
    return sharedEngine
  }

  if (sharedEngine) {
    sharedEngine.detachVisibilityListener()
    sharedEngine.teardown()
  }

  sharedEngine = createAudioEngine(manifest, { path })
  sharedEngine.attachVisibilityListener()
  void sharedEngine.init()
  sharedManifestKey = key
  return sharedEngine
}

export function peekSharedAudioEngine() {
  return sharedEngine
}

export function disposeSharedAudioEngine() {
  if (!sharedEngine) return
  sharedEngine.detachVisibilityListener()
  sharedEngine.teardown()
  sharedEngine = null
  sharedManifestKey = null
}
