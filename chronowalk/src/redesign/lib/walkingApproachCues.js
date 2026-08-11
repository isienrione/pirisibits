import { t } from '../../i18n/t.js'

const APPROACH_CUE_KEYS = [
  'approach.cue.0',
  'approach.cue.1',
  'approach.cue.2',
  'approach.cue.3',
  'approach.cue.4',
  'approach.cue.5',
  'approach.cue.6',
  'approach.cue.7',
]

const STORAGE_KEY = 'cw_approach_cue_index'

/** Rotate cinematic anticipation cues - never the same index twice in a row. */
export function pickApproachCue(stopKey = 'default') {
  if (typeof window === 'undefined') {
    return t(APPROACH_CUE_KEYS[0])
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  let lastIndex = stored != null ? Number.parseInt(stored, 10) : -1
  if (!Number.isFinite(lastIndex)) lastIndex = -1

  const stopHash = [...String(stopKey)].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  let nextIndex = (lastIndex + 1 + (stopHash % 3)) % APPROACH_CUE_KEYS.length
  if (nextIndex === lastIndex) {
    nextIndex = (nextIndex + 1) % APPROACH_CUE_KEYS.length
  }

  window.localStorage.setItem(STORAGE_KEY, String(nextIndex))
  return t(APPROACH_CUE_KEYS[nextIndex])
}

export function getApproachCues() {
  return APPROACH_CUE_KEYS.map((key) => t(key))
}

/** @deprecated Prefer getApproachCues() so locale changes are reflected. */
export const APPROACH_CUES = getApproachCues()
export { APPROACH_CUE_KEYS }
