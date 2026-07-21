import { useCallback, useEffect, useRef, useState } from 'react'
import { getSharedAudioEngine } from '../audio/sharedAudioEngine.js'
import { useV2Journey } from './useV2Journey.js'
import { JOURNEY_STATES } from '../state/journey.js'
import {
  PREFERENCES_CHANGED_EVENT,
  readAudioSpeed,
  writeAudioSpeed,
} from '../utils/appPreferences.js'

function hydrateFromEngine(engine, setters) {
  if (!engine) return
  setters.setNarrationPlaying(engine.isNarrationPlaying())
  setters.setPlaybackInterrupted(engine.isPlaybackInterrupted())
  setters.setProgress(engine.getNarrationProgress())
  setters.setReady(Boolean(engine.context))
}

/**
 * Subscribe to the shared AudioEngine. The engine outlives this hook so
 * in-app tab changes (map / stops / journal) do not stop narration.
 */
export function useAudioEngine(manifest) {
  const engineRef = useRef(null)
  const [narrationPlaying, setNarrationPlaying] = useState(false)
  const [playbackInterrupted, setPlaybackInterrupted] = useState(false)
  const [ready, setReady] = useState(false)
  const [playbackRate, setPlaybackRateState] = useState(() => readAudioSpeed())
  // Bumps once each time a narration plan reaches its natural end.
  const [narrationEnded, setNarrationEnded] = useState({ nonce: 0, kind: null, id: null })
  const [progress, setProgress] = useState({
    currentTime: 0,
    duration: 0,
    chapterIndex: 0,
    chapterCount: 0,
    itemIndex: 0,
    itemCount: 0,
    playing: false,
    paused: false,
  })
  const { state, context } = useV2Journey()

  useEffect(() => {
    if (!manifest) return undefined

    const engine = getSharedAudioEngine(manifest, { path: context.path })
    const onEnded = (ended) =>
      setNarrationEnded((prev) => ({
        nonce: prev.nonce + 1,
        kind: ended?.kind ?? null,
        id: ended?.id ?? null,
      }))

    engine.onNarrationChange = setNarrationPlaying
    engine.onInterruptionChange = setPlaybackInterrupted
    engine.onProgress = setProgress
    engine.onNarrationEnded = onEnded
    engine.playbackRate = readAudioSpeed()
    engineRef.current = engine

    hydrateFromEngine(engine, {
      setNarrationPlaying,
      setPlaybackInterrupted,
      setProgress,
      setReady,
    })

    engine.init().then(() => {
      if (engineRef.current === engine) {
        setReady(Boolean(engine.context))
        hydrateFromEngine(engine, {
          setNarrationPlaying,
          setPlaybackInterrupted,
          setProgress,
          setReady,
        })
      }
    })

    return () => {
      // Detach React listeners only — keep the engine (and HTML audio) alive
      // while the traveler browses map / stops / journal.
      if (engine.onNarrationChange === setNarrationPlaying) {
        engine.onNarrationChange = null
      }
      if (engine.onInterruptionChange === setPlaybackInterrupted) {
        engine.onInterruptionChange = null
      }
      if (engine.onProgress === setProgress) {
        engine.onProgress = null
      }
      if (engine.onNarrationEnded === onEnded) {
        engine.onNarrationEnded = null
      }
      if (engineRef.current === engine) {
        engineRef.current = null
      }
    }
    // path is applied in the sync effect below; recreate only when manifest identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [manifest])

  // Drive a smooth scrubber/timer while narration is playing.
  useEffect(() => {
    if (!narrationPlaying) return undefined
    const id = setInterval(() => {
      const engine = engineRef.current
      if (engine) setProgress(engine.getNarrationProgress())
    }, 200)
    return () => clearInterval(id)
  }, [narrationPlaying])

  useEffect(() => {
    const engine = engineRef.current ?? (manifest ? getSharedAudioEngine(manifest) : null)
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

  // Keep the engine's rate in sync if another surface (e.g. Settings) changes it.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const sync = () => {
      const speed = readAudioSpeed()
      setPlaybackRateState(speed)
      engineRef.current?.setPlaybackRate(speed)
    }
    window.addEventListener(PREFERENCES_CHANGED_EVENT, sync)
    return () => window.removeEventListener(PREFERENCES_CHANGED_EVENT, sync)
  }, [])

  const setPlaybackRate = useCallback((rate) => {
    writeAudioSpeed(rate)
    setPlaybackRateState(rate)
    engineRef.current?.setPlaybackRate(rate)
  }, [])

  const unlock = useCallback(async () => {
    const engine = engineRef.current
    if (!engine) return false
    await engine.init()
    setReady(Boolean(engine.context))
    return Boolean(engine.context)
  }, [])

  const primeForGesture = useCallback(() => {
    engineRef.current?.primeForGesture()
  }, [])

  const playWaypoint = useCallback(async (waypointId) => {
    return (await engineRef.current?.playWaypoint(waypointId)) ?? false
  }, [])

  const playTransit = useCallback(async (transitId) => {
    await engineRef.current?.playTransit(transitId)
  }, [])

  const playResumeCue = useCallback(async (cueKey) => {
    await engineRef.current?.playResumeCue(cueKey)
  }, [])

  const playArrivalChime = useCallback(async () => {
    await engineRef.current?.playArrivalChime()
  }, [])

  const playCompletionChime = useCallback(async () => {
    await engineRef.current?.playCompletionChime()
  }, [])

  const playUiCue = useCallback(async (cueKey) => {
    await engineRef.current?.playUiCue(cueKey)
  }, [])

  const endTransit = useCallback(() => {
    engineRef.current?.clearTransitSession()
  }, [])

  const stopNarration = useCallback(() => {
    engineRef.current?.stopNarration()
  }, [])

  const resumePlayback = useCallback(async () => {
    await engineRef.current?.resumeInterruptedPlayback()
  }, [])

  const pauseNarration = useCallback(() => {
    engineRef.current?.pauseNarration()
  }, [])

  const resumeNarration = useCallback(() => {
    void engineRef.current?.resumeNarration()
  }, [])

  const toggleNarration = useCallback(() => {
    engineRef.current?.toggleNarration()
  }, [])

  const seekNarration = useCallback((seconds) => {
    void engineRef.current?.seekNarration(seconds)
  }, [])

  const skipNarration = useCallback((deltaSeconds) => {
    void engineRef.current?.skipNarration(deltaSeconds)
  }, [])

  const jumpToChapter = useCallback((chapterIndex) => {
    void engineRef.current?.jumpToChapter(chapterIndex)
  }, [])

  const setPath = useCallback((path) => {
    engineRef.current?.setPath(path)
  }, [])

  return {
    ready,
    narrationPlaying,
    playbackInterrupted,
    progress,
    playbackRate,
    setPlaybackRate,
    narrationEnded,
    unlock,
    primeForGesture,
    playWaypoint,
    playTransit,
    playResumeCue,
    playArrivalChime,
    playCompletionChime,
    playUiCue,
    endTransit,
    stopNarration,
    resumePlayback,
    pauseNarration,
    resumeNarration,
    toggleNarration,
    seekNarration,
    skipNarration,
    jumpToChapter,
    setPath,
    engine: engineRef.current,
  }
}
