import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

/**
 * Advances a named beat map over time via light timeouts (no rAF loop).
 * Returns which beats have fired.
 *
 * @param {Record<string, number>} timeline  beat → ms from start
 * @param {{ enabled?: boolean, reducedTimeline?: Record<string, number> }} [options]
 */
export function useCeremonyTimeline(timeline, { enabled = true, reducedTimeline } = {}) {
  const reducedMotion = useReducedMotion()
  const activeTimeline = reducedMotion && reducedTimeline ? reducedTimeline : timeline
  const timelineKey = useMemo(() => serializeTimeline(activeTimeline), [activeTimeline])
  const timelineRef = useRef(activeTimeline)
  timelineRef.current = activeTimeline

  const [fired, setFired] = useState(() => emptyBeats(activeTimeline))

  useEffect(() => {
    const current = timelineRef.current

    if (!enabled) {
      setFired(emptyBeats(current))
      return undefined
    }

    if (reducedMotion && reducedTimeline) {
      setFired(allBeats(reducedTimeline))
      return undefined
    }

    setFired(emptyBeats(current))
    const timers = []

    for (const [key, at] of Object.entries(current)) {
      const id = window.setTimeout(() => {
        setFired((prev) => (prev[key] ? prev : { ...prev, [key]: true }))
      }, Math.max(0, at))
      timers.push(id)
    }

    return () => {
      for (const id of timers) window.clearTimeout(id)
    }
  }, [enabled, reducedMotion, timelineKey, reducedTimeline])

  return { beats: fired, reducedMotion }
}

function serializeTimeline(timeline) {
  return Object.keys(timeline)
    .sort()
    .map((key) => `${key}:${timeline[key]}`)
    .join('|')
}

function emptyBeats(timeline) {
  const out = {}
  for (const key of Object.keys(timeline)) out[key] = false
  return out
}

function allBeats(timeline) {
  const out = {}
  for (const key of Object.keys(timeline)) out[key] = true
  return out
}
