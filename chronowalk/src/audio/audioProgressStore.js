/**
 * Shared audio progress store — scrubber subscribers can update without
 * forcing every useAudioEngine consumer to re-render on each tick.
 */
const IDLE = Object.freeze({
  currentTime: 0,
  duration: 0,
  chapterIndex: 0,
  chapterCount: 0,
  itemIndex: 0,
  itemCount: 0,
  playing: false,
  paused: false,
})

let snapshot = IDLE
const listeners = new Set()

function shallowProgressEqual(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  // Quarter-second quantize keeps the scrubber smooth while skipping no-op ticks.
  return (
    Math.floor(a.currentTime * 4) === Math.floor(b.currentTime * 4) &&
    a.duration === b.duration &&
    a.chapterIndex === b.chapterIndex &&
    a.chapterCount === b.chapterCount &&
    a.itemIndex === b.itemIndex &&
    a.itemCount === b.itemCount &&
    a.playing === b.playing &&
    a.paused === b.paused
  )
}

export function getAudioProgressSnapshot() {
  return snapshot
}

export function subscribeAudioProgress(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function publishAudioProgress(next) {
  const value = next ?? IDLE
  if (shallowProgressEqual(snapshot, value)) return false
  snapshot = value
  listeners.forEach((listener) => {
    try {
      listener()
    } catch {
      /* ignore subscriber errors */
    }
  })
  return true
}

export function resetAudioProgressStore() {
  snapshot = IDLE
  listeners.forEach((listener) => {
    try {
      listener()
    } catch {
      /* ignore */
    }
  })
}
