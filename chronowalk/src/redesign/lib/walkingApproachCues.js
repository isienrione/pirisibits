const APPROACH_CUES = [
  'Almost there. Look up.',
  'The amphitheatre is beginning to reveal itself.',
  'Pause for a moment. The next chapter begins just ahead.',
  'You are close now. Let the city slow you down.',
  'Listen — the stones are near.',
  'The next chapter waits just ahead.',
  'Almost there. Rome opens in front of you.',
  'Slow your step. You are nearly upon it.',
]

const STORAGE_KEY = 'cw_approach_cue_index'

/** Rotate cinematic anticipation cues — never the same index twice in a row. */
export function pickApproachCue(stopKey = 'default') {
  if (typeof window === 'undefined') {
    return APPROACH_CUES[0]
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  let lastIndex = stored != null ? Number.parseInt(stored, 10) : -1
  if (!Number.isFinite(lastIndex)) lastIndex = -1

  const stopHash = [...String(stopKey)].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  let nextIndex = (lastIndex + 1 + (stopHash % 3)) % APPROACH_CUES.length
  if (nextIndex === lastIndex) {
    nextIndex = (nextIndex + 1) % APPROACH_CUES.length
  }

  window.localStorage.setItem(STORAGE_KEY, String(nextIndex))
  return APPROACH_CUES[nextIndex]
}

export { APPROACH_CUES }
