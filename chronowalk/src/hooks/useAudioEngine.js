import { useCallback, useEffect, useRef, useState } from 'react'
import { createAudioEngine } from '../audio/AudioEngine.js'
import { useJourney } from './useJourney.js'
import { JOURNEY_STATES } from '../state/journey.js'

export function useAudioEngine(manifest) {
  const engineRef = useRef(null)
  const [narrationPlaying, setNarrationPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const { state, context } = useJourney()

  useEffect(() => {
    if (!manifest) return undefined

    const engine = createAudioEngine(manifest, { path: context.path })
    engine.onNarrationChange = setNarrationPlaying
    engineRef.current = engine

    engine.init().then(() => {
      setReady(Boolean(engine.context))
    })

    return () => {
      engine.onNarrationChange = null
      engine.teardown()
      engineRef.current = null
      setReady(false)
      setNarrationPlaying(false)
    }
  }, [manifest])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine || !manifest) return

    engine.setManifest(manifest)
    engine.setPath(context.path)
    engine.setCompletedWaypointIds(context.completedWaypointIds)
    engine.setCompletedTransitIds(context.completedTransitIds)
    engine.setJourneyState(state === JOURNEY_STATES.WALKING ? 'walking' : 'idle')
  }, [
    manifest,
    context.path,
    context.completedWaypointIds,
    context.completedTransitIds,
    state,
  ])

  const unlock = useCallback(async () => {
    const engine = engineRef.current
    if (!engine) return false
    await engine.init()
    setReady(Boolean(engine.context))
    return Boolean(engine.context)
  }, [])

  const playWaypoint = useCallback(async (waypointId, options) => {
    await engineRef.current?.playWaypoint(waypointId, options)
  }, [])

  const playTransit = useCallback(async (transitId) => {
    await engineRef.current?.playTransit(transitId)
  }, [])

  const playResumeCue = useCallback(async (cueKey) => {
    await engineRef.current?.playResumeCue(cueKey)
  }, [])

  const stopNarration = useCallback(() => {
    engineRef.current?.stopNarration()
  }, [])

  const setPath = useCallback((path) => {
    engineRef.current?.setPath(path)
  }, [])

  return {
    ready,
    narrationPlaying,
    unlock,
    playWaypoint,
    playTransit,
    playResumeCue,
    stopNarration,
    setPath,
    engine: engineRef.current,
  }
}
