import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { isDevPanelEnabled } from '../../config/env.js'
import { useJourneyGeoDebugOptions } from '../../hooks/useJourneyGeoDebug.js'
import { DEV_TOOLS_CHANGED, readDevSimulateGps } from '../dev/devTools.js'
import { useAudioEngine } from '../../hooks/useAudioEngine.js'
import { useV2Journey, useTourManifest } from '../../hooks/useV2Journey.js'
import { useJourneyGeo } from '../../hooks/useJourneyGeo.js'
import { useWalkingCompanion } from '../../hooks/useWalkingCompanion.js'
import { useJourneyStep } from '../../hooks/useJourneyStep.js'
import { useOptionalPromotion } from '../../hooks/useOptionalPromotion.js'
import { getPromotionInsertSteps } from '../../content/optionalPromotion.js'
import { consumeStoryViewIntent } from '../../lib/jumpToWaypoint.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { JOURNEY_STATES, isImmersiveJourneyState } from '../../state/journey.js'
import ApproachingScreen from './ApproachingScreen.jsx'
import ArrivalScreen from './ArrivalScreen.jsx'
import PathChoiceScreen from './PathChoiceScreen.jsx'
import StoryScreen from './StoryScreen.jsx'
import WalkingScreen from './WalkingScreen.jsx'
import RestScreen from './RestScreen.jsx'
import DayCompleteScreen from './DayCompleteScreen.jsx'
import AudioInterruptionBanner from './AudioInterruptionBanner.jsx'
import { JourneyLayout, JourneyPrimaryButton } from './JourneyLayout.jsx'
import { COMPANION_MODES, companionCopy, isCompanionTrackingState } from '../../content/companionGuidance.js'
import { ROME_ACTS } from '../../data/romePacing.js'
import { chapterAtIndex, chapterTitle, combinedChapterTranscript } from '../../content/chapterMeta.js'
import { getStepIdAtIndex, getPreviousWaypointInSequence } from '../../content/manifest.js'
import { formatDistanceToNext, resolveJourneyProgressPct, estimateDistanceBetweenStops, sanitizeWalkDistanceM } from '../../content/journeyProgress.js'
import { LOCATION_STATUS } from '../../hooks/useGeoLocation.js'
import C2Walking from '../../redesign/screens/C2Walking.jsx'
import C2Transit from '../../redesign/screens/C2Transit.jsx'
import C3Approaching from '../../redesign/screens/C3Approaching.jsx'
import C4ArrivalMoment from '../../redesign/screens/C4ArrivalMoment.jsx'
import C6ImmersivePlayer from '../../redesign/screens/C6ImmersivePlayer.jsx'
import C8aPathChoice from '../../redesign/screens/C8aPathChoice.jsx'
import C8bThePause from '../../redesign/screens/C8bThePause.jsx'
import C8cActComplete from '../../redesign/screens/C8cActComplete.jsx'
import { ACT_COLORS, T, SHELL_TAB_BAR_INSET, SHELL_SAFE_BOTTOM_INSET } from '../../redesign/tokens.js'
import RedesignJourneyWelcome from '../../redesign/ui/RedesignJourneyWelcome.jsx'
import FloatingAudioPlayer from '../../redesign/ui/FloatingAudioPlayer.jsx'
import { useSettingsSheet } from '../../redesign/context/SettingsSheetContext.jsx'
import { getAppPreferences } from '../../hooks/useAppPreferences.js'
import {
  accentForWaypoint,
  approachCopy,
  arrivalCopy,
  photoForWaypoint,
  signatureLine,
  titleForWaypoint,
} from '../../redesign/lib/waypointPresentation.js'
import JourneyInlineMap from './JourneyInlineMap.jsx'
import { bearingDegrees } from '../../utils/bearing.js'

// GPS in Rome drifts, so arrival is confirmed only after a stable, continuous
// presence near the landmark — never the instant the radius is first touched.
const ARRIVAL_DWELL_MS = 5000
// When the position's radius of uncertainty is worse than this, we don't
// auto-arrive; the traveller can still tap "I'm here".
const POOR_ACCURACY_M = 60

// Speeds offered by the immersive player's speed pill (subset of the shared
// STORY_PLAYBACK_SPEEDS preference set).
const PLAYER_SPEEDS = [0.8, 1, 1.2]

export default function JourneyShell({ variant = 'legacy' }) {
  const { state, context, transition, completeWaypoint, completeTransit, advanceSequence, setPath, setActiveWaypoint, promoteOptional, prepareResumeCue, clearPendingResumeCue, completeWaypointAndAdvance, continueFromDayComplete, states } =
    useV2Journey()
  const { openSettings } = useSettingsSheet()
  const { manifest, loading, error } = useTourManifest()
  const step = useJourneyStep(
    manifest,
    context.path,
    context.currentSequenceIndex,
    context.promotedOptionalIds
  )
  const audio = useAudioEngine(manifest)
  const [busy, setBusy] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [devSimulateGps, setDevSimulateGps] = useState(false)
  // True once the current waypoint's narration reaches its natural end.
  const [storyEnded, setStoryEnded] = useState(false)
  // Last heard narration — keeps the floating dock visible after audio ends.
  const [dockSnapshot, setDockSnapshot] = useState(null)
  const storyCompleteTrackedRef = useRef(null)
  const playedStepRef = useRef(null)
  const storyStartedRef = useRef(null)
  const playedResumeRef = useRef(false)
  const playedCompletionRef = useRef(false)
  const scriptedRestNarrationStartedRef = useRef(null)
  const scriptedRestEnteredRef = useRef(null)
  const prevStateRef = useRef(state)
  const prevCompanionModeRef = useRef(COMPANION_MODES.NORMAL)
  const storyViewRef = useRef('chapters')
  // Guards a waypoint from arriving twice (dwell timer + manual tap can race).
  const arrivedWaypointRef = useRef(null)
  // Handle for the 5s continuous-presence timer; null when not counting.
  const dwellTimerRef = useRef(null)
  // Always points at the latest arriveAtWaypoint so the timer closure is fresh.
  const arriveRef = useRef(null)

  useEffect(() => {
    prepareResumeCue()
  }, [prepareResumeCue])

  useEffect(() => {
    if (!isDevPanelEnabled()) return undefined
    const syncDevGps = () => setDevSimulateGps(readDevSimulateGps())
    syncDevGps()
    window.addEventListener(DEV_TOOLS_CHANGED, syncDevGps)
    return () => window.removeEventListener(DEV_TOOLS_CHANGED, syncDevGps)
  }, [])

  useEffect(() => {
    if (!context.pendingResumeCue || !audioUnlocked || playedResumeRef.current) return

    playedResumeRef.current = true
    void audio.playResumeCue(context.pendingResumeCue)
    track(TRACK_EVENTS.RESUME, { cue: context.pendingResumeCue })
    clearPendingResumeCue()
  }, [audio, audioUnlocked, clearPendingResumeCue, context.pendingResumeCue])

  useEffect(() => {
    if (state !== JOURNEY_STATES.STORY || step?.type !== 'waypoint') return
    const intent = consumeStoryViewIntent()
    if (intent) storyViewRef.current = intent
  }, [state, step?.id, step?.type])

  useEffect(() => {
    if (prevStateRef.current === JOURNEY_STATES.THRESHOLD && state === JOURNEY_STATES.WALKING) {
      storyStartedRef.current = null
      playedStepRef.current = null
      setDockSnapshot(null)
    }
    if (prevStateRef.current === JOURNEY_STATES.PAUSED && state === JOURNEY_STATES.WALKING) {
      scriptedRestNarrationStartedRef.current = null
      scriptedRestEnteredRef.current = null
    }
    prevStateRef.current = state
  }, [state])

  useEffect(() => {
    if (state !== JOURNEY_STATES.STORY || step?.type !== 'waypoint' || !step.record?.scripted_rest) return
    if (!audio.narrationPlaying) return
    scriptedRestNarrationStartedRef.current = step.id
  }, [audio.narrationPlaying, state, step?.id, step?.record?.scripted_rest, step?.type])

  useEffect(() => {
    if (state !== JOURNEY_STATES.STORY || step?.type !== 'waypoint' || !step.record?.scripted_rest) return
    if (audio.narrationPlaying) return
    if (scriptedRestNarrationStartedRef.current !== step.id) return
    if (scriptedRestEnteredRef.current === step.id) return

    scriptedRestEnteredRef.current = step.id
    transition(JOURNEY_STATES.PAUSED)
    track(TRACK_EVENTS.PAUSE, { waypoint_id: step.id, scripted: true })
  }, [audio.narrationPlaying, state, step?.id, step?.record?.scripted_rest, step?.type, transition])

  const geoTarget = step?.type === 'waypoint' ? step.record : step?.targetWaypoint
  const geoDebug = useJourneyGeoDebugOptions(
    geoTarget?.geofence
      ? { lat: geoTarget.geofence.lat, lng: geoTarget.geofence.lng }
      : null,
    { geofenceRadiusM: geoTarget?.geofence?.radius_m ?? 40 },
  )
  const geo = useJourneyGeo(geoTarget, {
    debugMode: geoDebug.debugMode,
    simulateAtTarget: geoDebug.simulateAtTarget || devSimulateGps,
    debugPosition: geoDebug.debugPosition,
  })

  const companion = useWalkingCompanion({
    position: geo.position,
    distance: geo.distance,
    geofenceRadiusM: geoTarget?.geofence?.radius_m ?? 40,
    locationStatus: geo.locationStatus,
    enabled: isCompanionTrackingState(state),
  })

  useEffect(() => {
    if (!isCompanionTrackingState(state)) {
      prevCompanionModeRef.current = COMPANION_MODES.NORMAL
      return
    }

    if (
      companion.mode !== prevCompanionModeRef.current &&
      companion.mode !== COMPANION_MODES.NORMAL
    ) {
      track(
        companion.mode === COMPANION_MODES.OFF_ROUTE
          ? TRACK_EVENTS.OFF_ROUTE
          : TRACK_EVENTS.OBSERVATION,
        {
          waypoint_id: step?.type === 'waypoint' ? step.id : step?.targetWaypoint?.id,
          distance_m: geo.distance != null ? Math.round(geo.distance) : null,
        }
      )
    }

    prevCompanionModeRef.current = companion.mode
  }, [companion.mode, geo.distance, state, step?.id, step?.targetWaypoint?.id, step?.type])

  const needsPathChoice =
    step?.type === 'transit' && step?.needsPathChoice && !context.pathLocked && step.id === 't01'

  const handleOptionalPromote = useCallback(
    (waypointId) => {
      if (!manifest) return
      promoteOptional(waypointId, manifest)
      const inserts = getPromotionInsertSteps(manifest, waypointId, context.path)
      const transitId = inserts[0]
      if (transitId) {
        playedStepRef.current = null
        storyStartedRef.current = null
        audio.playTransit(transitId)
        playedStepRef.current = transitId
      }
      track(TRACK_EVENTS.OPTIONAL_WAYPOINT_PROMOTED, { waypoint_id: waypointId })
    },
    [audio, context.path, manifest, promoteOptional]
  )

  useOptionalPromotion(manifest, context, {
    onPromote: handleOptionalPromote,
    enabled: state === JOURNEY_STATES.WALKING || state === JOURNEY_STATES.APPROACHING,
  })

  useEffect(() => {
    if (audio.ready) setAudioUnlocked(true)
  }, [audio.ready])

  // Reset the "story finished" reveal whenever we leave the story or change stop.
  useEffect(() => {
    if (state !== JOURNEY_STATES.STORY) {
      setStoryEnded(false)
      return
    }
    storyCompleteTrackedRef.current = null
    setStoryEnded(false)
  }, [state, step?.id])

  // Natural end of a waypoint's narration → mark complete + reveal next action.
  // Scripted-rest waypoints intentionally route to PAUSED instead, so skip them.
  useEffect(() => {
    if (audio.narrationEnded.nonce === 0) return
    if (state !== JOURNEY_STATES.STORY || step?.type !== 'waypoint') return
    if (step.record?.scripted_rest) return
    if (audio.narrationEnded.id && audio.narrationEnded.id !== step.id) return
    if (storyCompleteTrackedRef.current === step.id) return

    storyCompleteTrackedRef.current = step.id
    track(TRACK_EVENTS.STORY_COMPLETE, { waypoint_id: step.id, ended: true })
    setStoryEnded(true)
  }, [audio.narrationEnded, state, step?.id, step?.type, step?.record?.scripted_rest])

  const handleCycleSpeed = useCallback(() => {
    const current = audio.playbackRate ?? 1
    const idx = PLAYER_SPEEDS.indexOf(current)
    const next = PLAYER_SPEEDS[(idx + 1) % PLAYER_SPEEDS.length]
    audio.setPlaybackRate(next)
  }, [audio])

  // Remember what's playing so the dock can linger (with replay) after audio ends.
  useEffect(() => {
    if (!manifest || !step || state === JOURNEY_STATES.STORY) return
    const sessionLive = (audio.progress?.itemCount ?? 0) > 0 || audio.narrationPlaying
    if (!sessionLive) return

    const record = step.type === 'waypoint' ? step.record : step.targetWaypoint
    setDockSnapshot((prev) => ({
      kind: step.type === 'transit' ? 'transit' : 'waypoint',
      id: step.id,
      title: titleForWaypoint(record),
      subtitle: step.type === 'transit' ? 'On the way' : 'Now playing',
      accent: accentForWaypoint(record, manifest),
      duration: audio.progress?.duration || prev?.duration || 0,
    }))
  }, [
    audio.narrationPlaying,
    audio.progress?.duration,
    audio.progress?.itemCount,
    manifest,
    state,
    step?.id,
    step?.record,
    step?.targetWaypoint,
    step?.type,
  ])

  const handleDockReplay = useCallback(() => {
    if (!dockSnapshot) return
    if (dockSnapshot.kind === 'transit') void audio.playTransit(dockSnapshot.id)
    else void audio.playWaypoint(dockSnapshot.id)
  }, [audio, dockSnapshot])

  const handleDockStop = useCallback(() => {
    audio.stopNarration()
  }, [audio])

  const handleDockDismiss = useCallback(() => {
    audio.stopNarration()
    setDockSnapshot(null)
  }, [audio])

  // Confirmed arrival — auto (after 5s dwell) or manual ("I'm here"). Guarded so
  // the dwell timer and a manual tap can never fire arrival for the same
  // waypoint twice.
  const arriveAtWaypoint = useCallback(
    (source) => {
      if (!step?.record || step.type !== 'waypoint') return
      if (arrivedWaypointRef.current === step.id) return
      if (state !== JOURNEY_STATES.WALKING && state !== JOURNEY_STATES.APPROACHING) return

      arrivedWaypointRef.current = step.id
      if (dwellTimerRef.current != null) {
        clearTimeout(dwellTimerRef.current)
        dwellTimerRef.current = null
      }

      transition(JOURNEY_STATES.ARRIVED)
      if (audioUnlocked) void audio.playArrivalChime()
      track(TRACK_EVENTS.WAYPOINT_ARRIVED, { waypoint_id: step.id, source })
      if (source === 'manual') {
        track(TRACK_EVENTS.GPS_FALLBACK_USED, { waypoint_id: step.id })
      }
    },
    [audio, audioUnlocked, state, step, transition]
  )

  useEffect(() => {
    arriveRef.current = arriveAtWaypoint
  }, [arriveAtWaypoint])

  // Reset the arrival guard and any pending dwell whenever the target changes.
  useEffect(() => {
    arrivedWaypointRef.current = null
    if (dwellTimerRef.current != null) {
      clearTimeout(dwellTimerRef.current)
      dwellTimerRef.current = null
    }
  }, [step?.id])

  useEffect(() => {
    if (!geoTarget || step?.type !== 'waypoint') return
    if (state !== JOURNEY_STATES.WALKING && state !== JOURNEY_STATES.APPROACHING) return
    if (arrivedWaypointRef.current === step.id) return

    // Reject drift: a wildly uncertain fix can flicker "inside" the radius, so
    // we never auto-arrive on it (the "I'm here" button still works).
    const accuracyReliable = geo.accuracy == null || geo.accuracy <= POOR_ACCURACY_M

    if (geo.insideGeofence && accuracyReliable) {
      // Start counting continuous presence; keep any timer already running so a
      // steady position matures to arrival even without further GPS updates.
      if (dwellTimerRef.current == null) {
        dwellTimerRef.current = setTimeout(() => {
          dwellTimerRef.current = null
          arriveRef.current?.('auto')
        }, ARRIVAL_DWELL_MS)
      }
      return
    }

    // Left the radius (or accuracy went bad) before dwell matured — cancel.
    if (dwellTimerRef.current != null) {
      clearTimeout(dwellTimerRef.current)
      dwellTimerRef.current = null
    }

    if (geo.approachingGeofence && state === JOURNEY_STATES.WALKING) {
      transition(JOURNEY_STATES.APPROACHING)
    }
  }, [geo.insideGeofence, geo.approachingGeofence, geo.accuracy, geoTarget, state, step?.id, step?.type, transition])

  useEffect(() => () => {
    if (dwellTimerRef.current != null) clearTimeout(dwellTimerRef.current)
  }, [])

  // True when the fix is too uncertain to trust for auto-arrival — used to
  // gently surface the manual "I'm here" affordance.
  const locationShy =
    geo.accuracy != null && geo.accuracy > POOR_ACCURACY_M

  useEffect(() => {
    if (!manifest || !step || step.done) return
    if (!audioUnlocked) return
    if (playedStepRef.current === step.id) return

    if (state === JOURNEY_STATES.WALKING && step.type === 'transit' && !needsPathChoice) {
      playedStepRef.current = step.id
      const target = step.targetWaypoint
      if (target) {
        setDockSnapshot({
          kind: 'transit',
          id: step.id,
          title: titleForWaypoint(target),
          subtitle: 'On the way',
          accent: accentForWaypoint(target, manifest),
          duration: audio.progress?.duration ?? 0,
        })
      }
      void audio.playTransit(step.id)
      return
    }

    if (state === JOURNEY_STATES.STORY && step.type === 'waypoint' && storyStartedRef.current !== step.id) {
      storyStartedRef.current = step.id
      setActiveWaypoint(step.id, manifest)
      audio.playWaypoint(step.id)
    }
  }, [
    audio,
    audioUnlocked,
    manifest,
    needsPathChoice,
    setActiveWaypoint,
    state,
    step,
  ])

  const handleUnlockAudio = async () => {
    setBusy(true)
    const unlocked = await audio.unlock()
    setAudioUnlocked(unlocked || audio.ready)
    setBusy(false)
  }

  const handlePathChoice = async (path) => {
    setBusy(true)
    setPath(path)
    audio.setPath(path)
    playedStepRef.current = null
    await audio.playTransit('t01')
    playedStepRef.current = 't01'
    setBusy(false)
  }

  const handleBeginStory = async () => {
    if (!step?.record) return
    storyViewRef.current = getAppPreferences().preferTranscript ? 'transcript' : 'chapters'
    setBusy(true)
    transition(JOURNEY_STATES.STORY)
    setBusy(false)
  }

  const handleStepThroughTime = () => {
    if (!step?.record) return
    transition(JOURNEY_STATES.THRESHOLD)
  }

  const handleViewImages = () => {
    audio.stopNarration()
    transition(JOURNEY_STATES.ARRIVED)
  }

  const handleAudioOnly = () => {
    storyViewRef.current = 'chapters'
    handleBeginStory()
  }

  const handleTranscript = () => {
    storyViewRef.current = 'transcript'
    handleBeginStory()
  }

  const handleStoryComplete = useCallback(() => {
    if (!step?.record || step.type !== 'waypoint') return
    if (state !== JOURNEY_STATES.STORY) return

    audio.stopNarration()

    // Avoid double-counting if the audio already ended and fired story_complete.
    if (storyCompleteTrackedRef.current !== step.id) {
      storyCompleteTrackedRef.current = step.id
      track(TRACK_EVENTS.STORY_COMPLETE, { waypoint_id: step.id })
    }
    storyStartedRef.current = null
    playedStepRef.current = null
    setStoryEnded(false)
    setDockSnapshot(null)

    const next = completeWaypointAndAdvance(step.id)
    if (next.state === JOURNEY_STATES.DAY_COMPLETE) {
      track(TRACK_EVENTS.DAY_COMPLETE, { waypoint_id: step.id })
    }
  }, [audio, completeWaypointAndAdvance, state, step])

  const handleContinueClassicDay = useCallback(() => {
    playedStepRef.current = null
    storyStartedRef.current = null
    continueFromDayComplete()
    track(TRACK_EVENTS.RESUME, { day_break: true })
  }, [continueFromDayComplete])

  const handleTransitContinue = useCallback(() => {
    if (!step?.record || step.type !== 'transit') return

    audio.stopNarration()
    audio.endTransit()
    completeTransit(step.id)
    playedStepRef.current = null
    setDockSnapshot(null)
    advanceSequence()
  }, [advanceSequence, audio, completeTransit, step])

  const handleResumeFromRest = useCallback(() => {
    if (!step?.record?.scripted_rest || step.type !== 'waypoint') return

    completeWaypoint(step.id)
    track(TRACK_EVENTS.RESUME, { waypoint_id: step.id, scripted: true })
    storyStartedRef.current = null
    playedStepRef.current = null
    scriptedRestNarrationStartedRef.current = null
    scriptedRestEnteredRef.current = null
    advanceSequence()
  }, [advanceSequence, completeWaypoint, step])

  const handleOpenThreshold = () => {
    audio.stopNarration()
    transition(JOURNEY_STATES.THRESHOLD)
  }

  const handleManualArrival = () => arriveAtWaypoint('manual')

  useEffect(() => {
    if (!audioUnlocked || playedCompletionRef.current) return
    if (!step?.done && state !== JOURNEY_STATES.COMPLETE) return

    playedCompletionRef.current = true
    void audio.playCompletionChime()
  }, [audio, audioUnlocked, state, step?.done])

  if (state === JOURNEY_STATES.IDLE) {
    return <Navigate to="/begin" replace />
  }

  const interruptionBanner =
    audioUnlocked && audio.playbackInterrupted ? (
      <AudioInterruptionBanner
        busy={busy}
        onResume={() => {
          setBusy(true)
          void audio.resumePlayback().finally(() => setBusy(false))
        }}
      />
    ) : null

  // Persistent narration dock — visible during walking/transit narration and briefly after.
  const narrationSessionLive =
    audio.narrationPlaying ||
    (audio.progress?.itemCount ?? 0) > 0 ||
    Boolean(audio.progress?.paused)

  const resolvedDockSnapshot = useMemo(() => {
    if (state === JOURNEY_STATES.STORY || state === JOURNEY_STATES.THRESHOLD) return null
    if (dockSnapshot) return dockSnapshot
    if (!manifest || !step || !narrationSessionLive) return null

    const record = step.type === 'transit' ? step.targetWaypoint : step.record
    if (!record) return null

    return {
      kind: step.type === 'transit' ? 'transit' : 'waypoint',
      id: step.id,
      title: titleForWaypoint(record),
      subtitle: step.type === 'transit' ? 'On the way' : 'Now playing',
      accent: accentForWaypoint(record, manifest),
      duration: audio.progress?.duration ?? 0,
    }
  }, [
    audio.progress?.duration,
    audio.progress?.itemCount,
    audio.progress?.paused,
    audio.narrationPlaying,
    dockSnapshot,
    manifest,
    narrationSessionLive,
    state,
    step?.id,
    step?.record,
    step?.targetWaypoint,
    step?.type,
  ])

  const dockEnded = Boolean(resolvedDockSnapshot) && !narrationSessionLive
  const dockActive =
    variant === 'redesign' &&
    audioUnlocked &&
    Boolean(resolvedDockSnapshot) &&
    state !== JOURNEY_STATES.STORY &&
    state !== JOURNEY_STATES.THRESHOLD
  const dockBottomInset = isImmersiveJourneyState(state)
    ? SHELL_SAFE_BOTTOM_INSET
    : SHELL_TAB_BAR_INSET
  const floatingPlayer = dockActive ? (
    <FloatingAudioPlayer
      accent={resolvedDockSnapshot.accent}
      title={resolvedDockSnapshot.title}
      subtitle={dockEnded ? 'Just heard' : resolvedDockSnapshot.subtitle}
      narrationPlaying={audio.narrationPlaying}
      ended={dockEnded}
      currentTime={
        dockEnded
          ? resolvedDockSnapshot.duration
          : (audio.progress?.currentTime ?? 0)
      }
      duration={dockEnded ? resolvedDockSnapshot.duration : (audio.progress?.duration ?? 0)}
      playbackRate={audio.playbackRate}
      onToggle={() => (dockEnded ? handleDockReplay() : audio.toggleNarration())}
      onReplay={handleDockReplay}
      onSkipBack={() => audio.skipNarration(-15)}
      onSkipForward={() => audio.skipNarration(15)}
      onSeek={(seconds) => audio.seekNarration(seconds)}
      onCycleSpeed={handleCycleSpeed}
      onStop={handleDockStop}
      onDismiss={handleDockDismiss}
      bottomInset={dockBottomInset}
    />
  ) : null

  const withInterruptionBanner = (content) => (
    <>
      {interruptionBanner}
      {content}
      {floatingPlayer}
    </>
  )

  if (loading) {
    return withInterruptionBanner(
      <JourneyLayout eyebrow="Journey" title="Loading Rome…" subtitle="Preparing your path through the city." />
    )
  }

  if (error) {
    return withInterruptionBanner(
      <JourneyLayout eyebrow="Journey" title="Could not load tour" subtitle={error.message} />
    )
  }

  if (!manifest || !step) {
    return withInterruptionBanner(
      <JourneyLayout eyebrow="Journey" title="Tour unavailable" subtitle="Manifest did not load." />
    )
  }

  if (step.done || state === JOURNEY_STATES.COMPLETE) {
    if (variant === 'redesign') {
      return withInterruptionBanner(<Navigate to="/tour" replace />)
    }
    return withInterruptionBanner(
      <JourneyLayout
        eyebrow="Journey complete"
        title="You walked Rome"
        subtitle="Your letter and journal gathered what you heard along the way."
        footer={
          <Link
            to="/letter"
            style={{
              display: 'block',
              width: '100%',
              padding: '16px 20px',
              borderRadius: 999,
              background: 'var(--accent)',
              color: 'var(--bone)',
              fontSize: 'var(--fs-body)',
              fontWeight: 600,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Read your letter
          </Link>
        }
      />
    )
  }

  if (!audioUnlocked && !audio.ready) {
    if (variant === 'redesign') {
      return withInterruptionBanner(
        <RedesignJourneyWelcome onUnlock={handleUnlockAudio} busy={busy} />
      )
    }
    return withInterruptionBanner(
      <JourneyLayout
        eyebrow="Journey"
        title="Ready when you are"
        subtitle="Tap once to wake the soundscape — narration, ambience, and the city between stops."
      >
        <JourneyPrimaryButton onClick={handleUnlockAudio} disabled={busy}>
          {busy ? 'Starting audio…' : 'Begin sound'}
        </JourneyPrimaryButton>
      </JourneyLayout>
    )
  }

  if (needsPathChoice) {
    if (variant === 'redesign') {
      return withInterruptionBanner(
        <C8aPathChoice
          busy={busy}
          onChoose={(path) => handlePathChoice(path === 'B' ? 'b' : 'a')}
        />
      )
    }
    return withInterruptionBanner(<PathChoiceScreen onChoose={handlePathChoice} busy={busy} />)
  }

  const redesignWaypointProps = (record) =>
    record
      ? {
          accent: accentForWaypoint(record, manifest),
          title: titleForWaypoint(record),
          photo: photoForWaypoint(record),
          direction: approachCopy(record),
          arrivalLine: arrivalCopy(record),
          signatureLine: signatureLine(record),
          actNumeral: record.act?.replace('act', '').toUpperCase() ?? 'I',
        }
      : {}

  const journeyProgressPct = resolveJourneyProgressPct(
    manifest,
    context.path,
    context.currentSequenceIndex,
    context.promotedOptionalIds
  )

  const previousWaypoint = getPreviousWaypointInSequence(
    manifest,
    context.path,
    context.currentSequenceIndex,
    context.promotedOptionalIds
  )

  const liveWalkDistanceM = sanitizeWalkDistanceM(geo.distance)

  const estimatedWalkDistanceM =
    liveWalkDistanceM == null && geoTarget
      ? estimateDistanceBetweenStops(previousWaypoint, geoTarget)
      : null

  const walkingBearingDeg = (() => {
    const target = geoTarget?.geofence
    if (!target?.lat || !target?.lng) return { deg: null, live: false }

    if (geo.position?.lat != null && geo.position?.lng != null) {
      return {
        deg: bearingDegrees(geo.position.lat, geo.position.lng, target.lat, target.lng),
        live: true,
      }
    }

    const origin = previousWaypoint?.geofence
    if (origin?.lat != null && origin?.lng != null) {
      return {
        deg: bearingDegrees(origin.lat, origin.lng, target.lat, target.lng),
        live: false,
      }
    }

    return { deg: null, live: false }
  })()

  const walkingCompanion = companionCopy(companion.mode, {
    targetTitle: geoTarget ? titleForWaypoint(geoTarget) : null,
  })

  if (state === JOURNEY_STATES.STORY && step.type === 'waypoint') {
    if (variant === 'redesign') {
      const record = step.record
      const props = redesignWaypointProps(record)
      const chapters = record.chapters?.length ? record.chapters : []
      const activeChapter = chapterAtIndex(
        chapters,
        audio.progress?.chapterIndex ?? 0,
        signatureLine(record)
      )
      const act = record.act ? manifest.acts?.find((a) => a.id === record.act) : null
      const actLabel = act ? `ACT ${act.numeral} — ${act.title?.toUpperCase()}` : `ACT ${props.actNumeral}`
      const realTranscript = record.transcript ?? combinedChapterTranscript(record.chapters)
      // In dev, only trust "audio available" once the engine confirms items or a
      // duration; in prod the deployed media is present, so never gate controls.
      const audioAvailable =
        !import.meta.env.DEV ||
        audio.narrationPlaying ||
        (audio.progress?.itemCount ?? 0) > 0 ||
        (audio.progress?.duration ?? 0) > 0

      return withInterruptionBanner(
        <C6ImmersivePlayer
          accent={props.accent}
          actLabel={actLabel}
          title={props.title}
          chapterTitle={activeChapter.title}
          chapterIndex={audio.progress?.chapterCount ? audio.progress.chapterIndex : 0}
          chapterCount={audio.progress?.chapterCount || Math.max(chapters.length, 1)}
          chapterTitles={chapters.map((chapter, index) =>
            chapterTitle(chapter, `Chapter ${index + 1}`)
          )}
          photo={props.photo}
          transcript={realTranscript}
          transcriptAvailable={Boolean(realTranscript)}
          narrationPlaying={audio.narrationPlaying}
          currentTime={audio.progress?.currentTime ?? 0}
          duration={audio.progress?.duration ?? 0}
          playbackRate={audio.playbackRate}
          speeds={PLAYER_SPEEDS}
          onCycleSpeed={handleCycleSpeed}
          audioAvailable={audioAvailable}
          storyEnded={storyEnded}
          hasReconstruction={Boolean(record.reconstruction)}
          initialTab={storyViewRef.current}
          onTogglePlay={() => audio.toggleNarration()}
          onSkipBack={() => audio.skipNarration(-15)}
          onSkipForward={() => audio.skipNarration(15)}
          onSeek={(seconds) => audio.seekNarration(seconds)}
          onSelectChapter={(i) => audio.jumpToChapter(i)}
          onOpenTranscript={() => track(TRACK_EVENTS.TRANSCRIPT_OPEN, { waypoint_id: step.id })}
          onStoryComplete={handleStoryComplete}
          onBack={() => transition(JOURNEY_STATES.ARRIVED)}
          onOpenThreshold={handleOpenThreshold}
          onViewImages={handleViewImages}
        />
      )
    }
    return withInterruptionBanner(
      <StoryScreen
        waypointName={step.record.title ?? step.record.name}
        narrationPlaying={audio.narrationPlaying}
        hasReconstruction={Boolean(step.record.reconstruction)}
        scriptedRest={Boolean(step.record.scripted_rest)}
        onOpenThreshold={handleOpenThreshold}
        onStoryComplete={handleStoryComplete}
        busy={busy}
      />
    )
  }

  if (state === JOURNEY_STATES.THRESHOLD && step.type === 'waypoint') {
    if (variant === 'redesign') {
      // Full-screen threshold is rendered by JourneyThresholdLayer in AppRouter.
      return null
    }
    return withInterruptionBanner(
      <StoryScreen
        waypointName={step.record.title ?? step.record.name}
        narrationPlaying={false}
        hasReconstruction={Boolean(step.record.reconstruction)}
        onOpenThreshold={handleOpenThreshold}
        onStoryComplete={handleStoryComplete}
        busy={busy}
      />
    )
  }

  if (state === JOURNEY_STATES.ARRIVED && step.type === 'waypoint') {
    if (variant === 'redesign') {
      const props = redesignWaypointProps(step.record)
      return withInterruptionBanner(
        <C4ArrivalMoment
          {...props}
          description={signatureLine(step.record)}
          onStepThroughTime={handleStepThroughTime}
          onAudioOnly={handleAudioOnly}
          onTranscript={handleTranscript}
          busy={busy}
        />
      )
    }
    return withInterruptionBanner(
      <ArrivalScreen
        waypointName={step.record.title ?? step.record.name}
        arrivalLine={step.record.arrivalLine}
        beginLabel={step.record.scripted_rest ? 'Begin rest' : 'Begin story'}
        onBeginStory={handleBeginStory}
        busy={busy}
      />
    )
  }

  if (state === JOURNEY_STATES.APPROACHING && step.type === 'waypoint') {
    if (variant === 'redesign') {
      const props = redesignWaypointProps(step.record)
      return withInterruptionBanner(
        <C3Approaching
          {...props}
          approachLine={props.direction}
          progressPct={journeyProgressPct}
          subtitle={formatDistanceToNext(liveWalkDistanceM ?? estimatedWalkDistanceM) ?? 'almost there'}
          onArrive={handleManualArrival}
          locationShy={locationShy}
          companionEyebrow={walkingCompanion?.eyebrow ?? null}
          companionTitle={walkingCompanion?.title ?? null}
          companionSubtitle={walkingCompanion?.subtitle ?? null}
        />
      )
    }
    return withInterruptionBanner(
      <ApproachingScreen
        waypointName={step.record.title ?? step.record.name}
        approachLine={step.record.approachLine}
        distance={geo.distance}
        locationStatus={geo.locationStatus}
        onRetryLocation={geo.retryLocation}
        companionMode={companion.mode}
      />
    )
  }

  if (state === JOURNEY_STATES.WALKING && step.type === 'transit') {
    if (variant === 'redesign') {
      const target = step.targetWaypoint
      const props = redesignWaypointProps(target)
      const transitNote =
        step.record?.note ??
        'The city between stops has its own stories — listen while Rome rolls past.'
      return withInterruptionBanner(
        <C2Transit
          {...props}
          note={transitNote}
          progressPct={journeyProgressPct}
          extraBottomInset={dockActive ? 88 : 0}
          onOpenSettings={openSettings}
          onContinue={handleTransitContinue}
          continueLabel={audio.narrationPlaying ? 'Skip ahead →' : 'Continue'}
          narrationPlaying={audio.narrationPlaying}
          map={<JourneyInlineMap manifest={manifest} context={context} geo={geo} />}
        />
      )
    }
    return withInterruptionBanner(
      <WalkingScreen
        title={step.targetWaypoint?.title ?? 'On the way'}
        subtitle={step.record.note ?? 'Follow the route between stops.'}
        distance={geo.distance}
        locationStatus={geo.locationStatus}
        onRetryLocation={geo.retryLocation}
        companionMode={companion.mode}
        showContinue={!audio.narrationPlaying}
        continueLabel="Continue"
        onContinue={handleTransitContinue}
        busy={busy}
      />
    )
  }

  if (state === JOURNEY_STATES.WALKING && step.type === 'waypoint') {
    if (variant === 'redesign') {
      const props = redesignWaypointProps(step.record)
      return withInterruptionBanner(
        <C2Walking
          {...props}
          distanceM={liveWalkDistanceM}
          estimatedDistanceM={estimatedWalkDistanceM}
          bearingDeg={walkingBearingDeg.deg}
          bearingIsLive={walkingBearingDeg.live}
          progressPct={journeyProgressPct}
          locationStatus={geo.locationStatus}
          onRetryLocation={geo.retryLocation}
          companionLine={
            companion.mode === COMPANION_MODES.NORMAL
              ? null
              : walkingCompanion?.subtitle ?? walkingCompanion?.title
          }
          onSimulateArrival={handleManualArrival}
          locationShy={locationShy}
          extraBottomInset={dockActive ? 88 : 0}
          onPause={() => transition(JOURNEY_STATES.PAUSED)}
          onOpenSettings={openSettings}
          map={<JourneyInlineMap manifest={manifest} context={context} geo={geo} />}
        />
      )
    }
    return withInterruptionBanner(
      <WalkingScreen
        title={step.record.title ?? step.record.name}
        subtitle={step.record.approachLine}
        distance={geo.distance}
        locationStatus={geo.locationStatus}
        onRetryLocation={geo.retryLocation}
        companionMode={companion.mode}
        onSimulateArrival={handleManualArrival}
        busy={busy}
      />
    )
  }

  if (state === JOURNEY_STATES.DAY_COMPLETE) {
    const act4 = ROME_ACTS.find((act) => act.id === 'act4')
    if (variant === 'redesign') {
      return withInterruptionBanner(
        <C8cActComplete
          actTitle={act4 ? `ACT ${act4.numeral} · ${act4.title.toUpperCase()}` : 'ACT IV · THE MARKET'}
          closingLine={act4?.promise ?? 'The ancient city, complete.'}
          stats={[
            `${context.completedWaypointIds.length} stops`,
            '4.1 km',
            '21 centuries',
          ]}
          accent={ACT_COLORS.IV ?? T.actIV}
          onContinue={handleContinueClassicDay}
          onSavePlace={() => transition(JOURNEY_STATES.PAUSED)}
          busy={busy}
        />
      )
    }
    return withInterruptionBanner(
      <DayCompleteScreen
        actTitle={act4 ? `Act ${act4.numeral} · ${act4.title}` : null}
        actPromise={act4?.promise}
        onContinue={handleContinueClassicDay}
        busy={busy}
      />
    )
  }

  if (state === JOURNEY_STATES.PAUSED && step.type === 'waypoint' && step.record?.scripted_rest) {
    if (variant === 'redesign') {
      return withInterruptionBanner(
        <C8bThePause onResume={handleResumeFromRest} busy={busy} />
      )
    }
    return withInterruptionBanner(
      <RestScreen
        title={step.record.title ?? step.record.name}
        subtitle={step.record.arrivalLine}
        onResume={handleResumeFromRest}
        busy={busy}
      />
    )
  }

  if (state === JOURNEY_STATES.PAUSED) {
    if (variant === 'redesign') {
      return withInterruptionBanner(
        <C8bThePause onResume={() => transition(JOURNEY_STATES.WALKING)} busy={busy} />
      )
    }
    return withInterruptionBanner(
      <JourneyLayout
        eyebrow="Paused"
        title="Journey paused"
        subtitle="Take a breath. Rome will wait."
      >
        <JourneyPrimaryButton onClick={() => transition(JOURNEY_STATES.WALKING)} disabled={busy}>
          Resume walking
        </JourneyPrimaryButton>
      </JourneyLayout>
    )
  }

  return withInterruptionBanner(
    <JourneyLayout
      eyebrow="Journey"
      title={step.record?.title ?? step.id}
      subtitle={`State: ${state}`}
    >
      <JourneyPrimaryButton onClick={() => transition(states.WALKING)} disabled={busy}>
        Return to walking
      </JourneyPrimaryButton>
    </JourneyLayout>
  )
}
