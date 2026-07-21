import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { isDevGeofencesSantiago, isDevPanelEnabled } from '../../config/env.js'
import { useJourneyGeoDebugOptions } from '../../hooks/useJourneyGeoDebug.js'
import { DEV_TOOLS_CHANGED, readDevSimulateGps } from '../dev/devTools.js'
import { useAudioEngine } from '../../hooks/useAudioEngine.js'
import { useSyncedAudioControls } from '../../hooks/useSyncedAudioControls.js'
import { createWaypointAutoplayCoordinator } from '../../audio/waypointAutoplay.js'
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
import { COMPANION_MODES, isCompanionTrackingState } from '../../content/companionGuidance.js'
import { ROME_ACTS } from '../../data/romePacing.js'
import { resolveStepTranscript } from '../../content/chapterMeta.js'
import { stripDirectorCues } from '../../utils/transcriptContent.js'
import { getStepIdAtIndex, getPreviousWaypointInSequence, getWaypoint } from '../../content/manifest.js'
import { getJourneyCompleteMoment } from '../../content/launchJourneyComplete.js'
import { isVisitStop } from '../../content/tourProductTruth.js'
import {
  estimateDistanceBetweenStops,
  resolveJourneyProgressPct,
  sanitizeWalkDistanceM,
} from '../../content/journeyProgress.js'
import { isWithinApproachDistance } from '../../redesign/lib/walkingCompanionPhase.js'
import { resolveActiveMapLeg } from '../../content/mapStops.js'
import C2Walking from '../../redesign/screens/C2Walking.jsx'
import { WALKING_UI_REVISION as requiredWalkingUiRevision } from '../../content/walkingUiRevision.js'
import {
  ensureWalkingUiFresh,
  recoverLegacyWalkingDom,
} from '../../pwa/walkingUiMigration.js'
import C2Transit from '../../redesign/screens/C2Transit.jsx'
import C4ArrivalMoment from '../../redesign/screens/C4ArrivalMoment.jsx'
import C6ImmersivePlayer from '../../redesign/screens/C6ImmersivePlayer.jsx'
import C8aPathChoice from '../../redesign/screens/C8aPathChoice.jsx'
import C8bThePause from '../../redesign/screens/C8bThePause.jsx'
import C8cActComplete from '../../redesign/screens/C8cActComplete.jsx'
import C8eJourneyComplete from '../../redesign/screens/C8eJourneyComplete.jsx'
import { ACT_COLORS, T, SHELL_TAB_BAR_INSET, SHELL_SAFE_BOTTOM_INSET } from '../../redesign/tokens.js'
import RedesignJourneyWelcome from '../../redesign/ui/RedesignJourneyWelcome.jsx'
import TourOnboardingCards from '../../redesign/ui/TourOnboardingCards.jsx'
import {
  isOnFirstTourStop,
  markTourOnboardingComplete,
} from '../../utils/tourOnboarding.js'
import FloatingAudioPlayer from '../../redesign/ui/FloatingAudioPlayer.jsx'
import WalkSyncBar from '../../redesign/ui/WalkSyncBar.jsx'
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
import {
  buildImmersivePlayerProps,
  redesignWaypointShellProps,
} from '../../redesign/lib/waypointImmersiveProps.js'
import { buildTransitImmersiveProps } from '../../redesign/lib/transitImmersiveProps.js'
import JourneyInlineMap from './JourneyInlineMap.jsx'
import DevGeofenceHud from '../dev/DevGeofenceHud.jsx'

// GPS in Rome drifts, so arrival is confirmed only after a stable, continuous
// presence near the landmark — never the instant the radius is first touched.
const ARRIVAL_DWELL_MS = 5000
// When the position's radius of uncertainty is worse than this, we don't
// auto-arrive; the traveller can still tap "I'm here".
const POOR_ACCURACY_M = 60
// Indoor Santiago field tests often report 80–120 m accuracy; relax while dev geofences are on.
const DEV_GEOFENCE_ACCURACY_M = 150

// Speeds offered by the immersive player's speed pill (subset of the shared
// STORY_PLAYBACK_SPEEDS preference set).
const PLAYER_SPEEDS = [0.8, 1, 1.2]

export default function JourneyShell({ variant = 'legacy' }) {
  const navigate = useNavigate()
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

  const visitedStopCount = useMemo(() => {
    if (!manifest) return 0
    return context.completedWaypointIds.filter((id) => isVisitStop(getWaypoint(manifest, id))).length
  }, [context.completedWaypointIds, manifest])
  const audio = useAudioEngine(manifest)
  const syncAudio = useSyncedAudioControls(audio)
  const [syncStatus, setSyncStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [devSimulateGps, setDevSimulateGps] = useState(false)
  // True once the current waypoint's narration reaches its natural end.
  const [storyEnded, setStoryEnded] = useState(false)
  // Last heard narration — keeps the floating dock visible after audio ends.
  const [dockSnapshot, setDockSnapshot] = useState(null)
  const storyCompleteTrackedRef = useRef(null)
  const playedStepRef = useRef(null)
  const waypointAutoplayRef = useRef(null)
  if (!waypointAutoplayRef.current) {
    waypointAutoplayRef.current = createWaypointAutoplayCoordinator()
  }
  const storyAutoplayGestureRef = useRef(null)
  const storyPlaybackSeenRef = useRef(false)
  const audioOpsRef = useRef(audio)
  audioOpsRef.current = audio
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
  const thresholdAutoOpenedRef = useRef(null)

  useEffect(() => {
    prepareResumeCue()
  }, [prepareResumeCue])

  useEffect(() => {
    if (variant !== 'redesign') return
    void ensureWalkingUiFresh(requiredWalkingUiRevision)
  }, [variant])

  useEffect(() => {
    if (variant !== 'redesign') return
    if (
      state !== JOURNEY_STATES.WALKING &&
      state !== JOURNEY_STATES.APPROACHING
    ) {
      return undefined
    }

    const frame = requestAnimationFrame(() => {
      void recoverLegacyWalkingDom(requiredWalkingUiRevision)
    })
    return () => cancelAnimationFrame(frame)
  }, [variant, state, step?.id])

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

  const justLeftThresholdRef = useRef(false)

  useEffect(() => {
    if (prevStateRef.current === JOURNEY_STATES.THRESHOLD && state === JOURNEY_STATES.WALKING) {
      justLeftThresholdRef.current = true
      waypointAutoplayRef.current.clearStarted()
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

  const walkingDestination = useMemo(() => {
    if (geoTarget?.geofence?.lat == null || geoTarget?.geofence?.lng == null) return null
    return { lat: geoTarget.geofence.lat, lng: geoTarget.geofence.lng }
  }, [geoTarget?.geofence?.lat, geoTarget?.geofence?.lng])

  const walkingLegFallback = useMemo(() => {
    if (!manifest) return null

    const { activeLeg } = resolveActiveMapLeg(
      manifest,
      context.path,
      context.currentSequenceIndex,
      context.promotedOptionalIds,
    )
    if (!activeLeg?.fromId || !activeLeg?.toId) return null

    const fromWaypoint = getWaypoint(manifest, activeLeg.fromId)
    const toWaypoint = getWaypoint(manifest, activeLeg.toId)
    if (
      fromWaypoint?.geofence?.lat == null ||
      fromWaypoint?.geofence?.lng == null ||
      toWaypoint?.geofence?.lat == null ||
      toWaypoint?.geofence?.lng == null
    ) {
      return null
    }

    return {
      tourId: manifest.id ?? manifest.city ?? 'rome',
      fromId: activeLeg.fromId,
      toId: activeLeg.toId,
      from: { lat: fromWaypoint.geofence.lat, lng: fromWaypoint.geofence.lng },
      to: { lat: toWaypoint.geofence.lat, lng: toWaypoint.geofence.lng },
    }
  }, [
    manifest,
    context.path,
    context.currentSequenceIndex,
    context.promotedOptionalIds,
  ])

  const devGeofenceActive = isDevGeofencesSantiago()
  const arrivalAccuracyLimitM = devGeofenceActive ? DEV_GEOFENCE_ACCURACY_M : POOR_ACCURACY_M

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

  const inlineTransitAudio =
    variant === 'redesign' &&
    state === JOURNEY_STATES.WALKING &&
    step?.type === 'transit' &&
    !needsPathChoice

  const seedTransitDock = useCallback(
    (transitStep) => {
      if (!manifest || transitStep?.type !== 'transit') return
      const target = transitStep.targetWaypoint
      if (!target) return
      setDockSnapshot({
        kind: 'transit',
        id: transitStep.id,
        title: titleForWaypoint(target),
        subtitle: 'On the way',
        accent: accentForWaypoint(target, manifest),
        duration: audio.progress?.duration ?? 0,
        transcript: resolveStepTranscript(transitStep, context.path),
      })
    },
    [audio.progress?.duration, context.path, manifest]
  )

  const tryStartWaypointNarration = useCallback(
    async (waypointId) => {
      if (!manifest || !waypointId) return false

      return waypointAutoplayRef.current.ensureStarted(
        waypointId,
        {
          isPlaying: () => {
            const live = audioOpsRef.current
            return (
              live.narrationPlaying ||
              (live.progress?.itemCount ?? 0) > 0 ||
              (live.progress?.duration ?? 0) > 0
            )
          },
        },
        async () => {
          const live = audioOpsRef.current
          const unlocked = await live.unlock()
          if (unlocked) setAudioUnlocked(true)
          setActiveWaypoint(waypointId, manifest)
          return (await live.playWaypoint(waypointId)) ?? false
        },
      )
    },
    [manifest, setActiveWaypoint],
  )

  const clearStoryAutoplayGesture = useCallback(() => {
    if (!storyAutoplayGestureRef.current) return
    document.removeEventListener('pointerdown', storyAutoplayGestureRef.current, true)
    document.removeEventListener('touchstart', storyAutoplayGestureRef.current, true)
    storyAutoplayGestureRef.current = null
  }, [])

  const armStoryAutoplayGesture = useCallback(
    (waypointId) => {
      if (!waypointId || storyAutoplayGestureRef.current) return
      const onGesture = () => {
        clearStoryAutoplayGesture()
        void tryStartWaypointNarration(waypointId)
      }
      storyAutoplayGestureRef.current = onGesture
      document.addEventListener('pointerdown', onGesture, true)
      document.addEventListener('touchstart', onGesture, true)
    },
    [clearStoryAutoplayGesture, tryStartWaypointNarration]
  )

  const tryStartWaypointNarrationRef = useRef(tryStartWaypointNarration)
  tryStartWaypointNarrationRef.current = tryStartWaypointNarration

  const armStoryAutoplayGestureRef = useRef(armStoryAutoplayGesture)
  armStoryAutoplayGestureRef.current = armStoryAutoplayGesture

  // After threshold (e.g. w07), the next step is often a transit leg (t06 → Vesta).
  // Never auto-play t01 — travelers must pick Path A or B first.
  useEffect(() => {
    if (!justLeftThresholdRef.current) return
    if (state !== JOURNEY_STATES.WALKING || step?.type !== 'transit' || !step.id) return
    if (needsPathChoice) return
    if (!audioUnlocked) return

    justLeftThresholdRef.current = false
    playedStepRef.current = step.id
    seedTransitDock(step)
    void audio.playTransit(step.id)
  }, [audio, audioUnlocked, needsPathChoice, seedTransitDock, state, step?.id, step?.type])

  // Path fork is silent until the traveler confirms A or B.
  useEffect(() => {
    if (!needsPathChoice) return
    audio.stopNarration()
    playedStepRef.current = null
    setDockSnapshot(null)
  }, [audio, needsPathChoice, step?.id])

  useEffect(() => {
    if (state !== JOURNEY_STATES.PAUSED) return
    audio.stopNarration()
    setDockSnapshot(null)
    playedStepRef.current = null
  }, [audio, state])

  const handleOptionalPromote = useCallback(
    (waypointId) => {
      if (!manifest) return
      promoteOptional(waypointId, manifest)
      const inserts = getPromotionInsertSteps(manifest, waypointId, context.path)
      const transitId = inserts[0]
      if (transitId) {
        playedStepRef.current = null
        waypointAutoplayRef.current.clearStarted()
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

  // Reset story-start guard when the active story waypoint changes.
  useEffect(() => {
    if (state !== JOURNEY_STATES.STORY || step?.type !== 'waypoint') return
    const startedId = waypointAutoplayRef.current.getStartedWaypointId()
    if (startedId && startedId !== step.id) {
      waypointAutoplayRef.current.clearStarted(startedId)
    }
  }, [state, step?.id, step?.type])

  useEffect(() => {
    if (state !== JOURNEY_STATES.STORY || step?.type !== 'waypoint') {
      clearStoryAutoplayGesture()
      return undefined
    }

    const waypointId = step.id
    let cancelled = false
    let retryTimer = null

    const attempt = async () => {
      const started = await tryStartWaypointNarrationRef.current(waypointId)
      if (cancelled) return
      if (
        started ||
        waypointAutoplayRef.current.getStartedWaypointId() === waypointId ||
        audioOpsRef.current.narrationPlaying
      ) {
        return
      }

      armStoryAutoplayGestureRef.current(waypointId)

      retryTimer = window.setTimeout(() => {
        if (cancelled) return
        if (
          waypointAutoplayRef.current.getStartedWaypointId() === waypointId ||
          audioOpsRef.current.narrationPlaying
        ) {
          return
        }
        void tryStartWaypointNarrationRef.current(waypointId)
      }, 500)
    }

    void attempt()

    return () => {
      cancelled = true
      if (retryTimer != null) window.clearTimeout(retryTimer)
      clearStoryAutoplayGesture()
    }
  }, [clearStoryAutoplayGesture, state, step?.id, step?.type, audioUnlocked])

  useEffect(() => () => clearStoryAutoplayGesture(), [clearStoryAutoplayGesture])

  useEffect(() => {
    if (audio.narrationPlaying) clearStoryAutoplayGesture()
  }, [audio.narrationPlaying, clearStoryAutoplayGesture])

  // Reset the "story finished" reveal whenever we leave the story or change stop.
  useEffect(() => {
    thresholdAutoOpenedRef.current = null
    storyPlaybackSeenRef.current = false
    if (state !== JOURNEY_STATES.STORY) {
      setStoryEnded(false)
      return
    }
    storyCompleteTrackedRef.current = null
    setStoryEnded(false)
  }, [state, step?.id])

  useEffect(() => {
    if (state !== JOURNEY_STATES.STORY || step?.type !== 'waypoint') {
      storyPlaybackSeenRef.current = false
      return
    }
    if (
      audio.narrationPlaying ||
      (audio.progress?.duration ?? 0) > 0 ||
      (audio.progress?.itemCount ?? 0) > 0
    ) {
      storyPlaybackSeenRef.current = true
    }
  }, [
    audio.narrationPlaying,
    audio.progress?.duration,
    audio.progress?.itemCount,
    state,
    step?.id,
    step?.type,
  ])

  const markStoryEnded = useCallback(
    (waypointId, { fallback = false } = {}) => {
      if (!waypointId || storyCompleteTrackedRef.current === waypointId) {
        setStoryEnded(true)
        return
      }
      storyCompleteTrackedRef.current = waypointId
      track(TRACK_EVENTS.STORY_COMPLETE, {
        waypoint_id: waypointId,
        ended: true,
        ...(fallback ? { fallback: true } : {}),
      })
      setStoryEnded(true)
    },
    [],
  )

  // Natural end of a waypoint's narration → mark complete + reveal next action.
  // Scripted-rest waypoints intentionally route to PAUSED instead, so skip them.
  useEffect(() => {
    if (audio.narrationEnded.nonce === 0) return
    if (state !== JOURNEY_STATES.STORY || step?.type !== 'waypoint') return
    if (step.record?.scripted_rest) return
    if (audio.narrationEnded.kind && audio.narrationEnded.kind !== 'waypoint') return
    if (audio.narrationEnded.id && audio.narrationEnded.id !== step.id) return

    markStoryEnded(step.id)
  }, [audio.narrationEnded, markStoryEnded, state, step?.id, step?.record?.scripted_rest, step?.type])

  // Fallback when the engine ends playback but the ended event is missed (mobile
  // backgrounding, buffer edge cases, insert tails, or races with step changes).
  // Only treat "near end" on the *last* plan item — mid-stop chapters (e.g. Pantheon
  // exterior → interior) must keep playing the remaining narration.
  useEffect(() => {
    if (state !== JOURNEY_STATES.STORY || step?.type !== 'waypoint') return
    if (step.record?.scripted_rest || storyEnded) return
    if (audio.narrationPlaying) return

    const duration = audio.progress?.duration ?? 0
    const current = audio.progress?.currentTime ?? 0
    const itemIndex = audio.progress?.itemIndex ?? 0
    const itemCount = audio.progress?.itemCount ?? 0
    const onLastPlanItem = itemCount > 0 && itemIndex >= itemCount - 1
    const nearEnd =
      onLastPlanItem && duration > 0 ? current >= duration * 0.85 : false
    const sessionDrained =
      storyPlaybackSeenRef.current &&
      duration === 0 &&
      current === 0 &&
      itemCount === 0

    if (!nearEnd && !sessionDrained) return

    markStoryEnded(step.id, { fallback: true })
  }, [
    audio.narrationPlaying,
    audio.progress?.currentTime,
    audio.progress?.duration,
    audio.progress?.itemCount,
    audio.progress?.itemIndex,
    markStoryEnded,
    state,
    step?.id,
    step?.record?.scripted_rest,
    step?.type,
    storyEnded,
  ])

  // Threshold is inline on the immersive player — narration keeps playing while
  // the traveller looks through time. No separate THRESHOLD screen handoff.

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
      transcript: resolveStepTranscript(step, context.path),
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
  const beginWaypointStory = useCallback(
    (waypointId, source) => {
      arrivedWaypointRef.current = waypointId
      if (dwellTimerRef.current != null) {
        clearTimeout(dwellTimerRef.current)
        dwellTimerRef.current = null
      }

      audioOpsRef.current.stopNarration()
      audioOpsRef.current.primeForGesture()

      if (variant === 'redesign') {
        storyViewRef.current = getAppPreferences().preferTranscript ? 'transcript' : 'chapters'
        transition(JOURNEY_STATES.STORY)
        void tryStartWaypointNarration(waypointId).then((started) => {
          if (started) setAudioUnlocked(true)
          if (started && audioUnlocked) void audioOpsRef.current.playArrivalChime()
          else if (!started) armStoryAutoplayGesture(waypointId)
        })
      } else {
        transition(JOURNEY_STATES.ARRIVED)
        if (audioUnlocked) void audio.playArrivalChime()
      }
      track(TRACK_EVENTS.WAYPOINT_ARRIVED, { waypoint_id: waypointId, source })
      if (source === 'manual' || source === 'transit_manual') {
        track(TRACK_EVENTS.GPS_FALLBACK_USED, { waypoint_id: waypointId })
      }
    },
    [armStoryAutoplayGesture, audio, audioUnlocked, transition, tryStartWaypointNarration, variant]
  )

  const arriveAtWaypoint = useCallback(
    (source) => {
      if (!step?.record || step.type !== 'waypoint') return
      if (
        arrivedWaypointRef.current === step.id &&
        source === 'manual' &&
        state !== JOURNEY_STATES.STORY &&
        state !== JOURNEY_STATES.ARRIVED &&
        state !== JOURNEY_STATES.THRESHOLD
      ) {
        arrivedWaypointRef.current = null
      }
      if (arrivedWaypointRef.current === step.id) return
      if (state !== JOURNEY_STATES.WALKING && state !== JOURNEY_STATES.APPROACHING) return

      beginWaypointStory(step.id, source)
    },
    [beginWaypointStory, state, step]
  )

  const handleTransitDestinationArrival = useCallback(() => {
    if (!manifest || step?.type !== 'transit' || !step.targetWaypoint) return

    const transitId = step.id
    const waypointId = step.targetWaypoint.id

    audio.stopNarration()
    audio.endTransit()
    completeTransit(transitId)
    playedStepRef.current = null
    waypointAutoplayRef.current.clearStarted()
    setDockSnapshot(null)
    advanceSequence(manifest)
    beginWaypointStory(waypointId, 'transit_manual')
  }, [advanceSequence, audio, beginWaypointStory, completeTransit, manifest, step])

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
    const accuracyReliable = geo.accuracy == null || geo.accuracy <= arrivalAccuracyLimitM

    if (geo.insideGeofence && accuracyReliable) {
      if (variant !== 'redesign') {
        // Legacy: mature dwell before auto-arrival.
        if (dwellTimerRef.current == null) {
          dwellTimerRef.current = setTimeout(() => {
            dwellTimerRef.current = null
            arriveRef.current?.('auto')
          }, ARRIVAL_DWELL_MS)
        }
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
  }, [arrivalAccuracyLimitM, geo.insideGeofence, geo.approachingGeofence, geo.accuracy, geoTarget, state, step?.id, step?.type, transition, variant])

  useEffect(() => () => {
    if (dwellTimerRef.current != null) clearTimeout(dwellTimerRef.current)
  }, [])

  // True when the fix is too uncertain to trust for auto-arrival — used to
  // gently surface the manual "I'm here" affordance.
  const locationShy =
    geo.accuracy != null && geo.accuracy > arrivalAccuracyLimitM

  const gpsArrivalReliable =
    geo.accuracy == null || geo.accuracy <= arrivalAccuracyLimitM
  const gpsArrived = Boolean(geo.insideGeofence && gpsArrivalReliable)

  useEffect(() => {
    if (state !== JOURNEY_STATES.WALKING || step?.type !== 'transit' || needsPathChoice) return
    if (!manifest || !audioUnlocked) return
    seedTransitDock(step)
  }, [audioUnlocked, manifest, needsPathChoice, seedTransitDock, state, step?.id, step?.type])

  useEffect(() => {
    if (!manifest || !step || step.done) return
    if (!audioUnlocked) return
    if (playedStepRef.current === step.id) return

    if (state === JOURNEY_STATES.WALKING && step.type === 'transit' && !needsPathChoice) {
      playedStepRef.current = step.id
      seedTransitDock(step)
      void audio.playTransit(step.id)
    }
  }, [
    audio,
    audioUnlocked,
    manifest,
    context.path,
    needsPathChoice,
    seedTransitDock,
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
    audio.stopNarration()
    setPath(path)
    audio.setPath(path)
    playedStepRef.current = null
    setDockSnapshot(null)
    if (step?.type === 'transit') seedTransitDock(step)
    await audio.playTransit('t01')
    playedStepRef.current = 't01'
    setBusy(false)
  }

  const handleBeginStory = async () => {
    if (!step?.record) return
    audio.primeForGesture()
    storyViewRef.current = getAppPreferences().preferTranscript ? 'transcript' : 'chapters'
    setBusy(true)
    transition(JOURNEY_STATES.STORY)
    if (step.type === 'waypoint') void tryStartWaypointNarration(step.id)
    setBusy(false)
  }

  // Redesign skips ARRIVED — recover stale sessions (e.g. map tab manual arrival).
  const arrivedRecoveryRef = useRef(null)
  useEffect(() => {
    if (variant !== 'redesign') return undefined
    if (state !== JOURNEY_STATES.ARRIVED || step?.type !== 'waypoint') {
      if (state !== JOURNEY_STATES.ARRIVED) arrivedRecoveryRef.current = null
      return undefined
    }
    if (arrivedRecoveryRef.current === step.id) return undefined
    arrivedRecoveryRef.current = step.id
    storyViewRef.current = getAppPreferences().preferTranscript ? 'transcript' : 'chapters'
    transition(JOURNEY_STATES.STORY)
    void tryStartWaypointNarrationRef.current(step.id)
    return undefined
  }, [state, step?.id, step?.type, transition, variant])

  const handleTranscript = () => {
    storyViewRef.current = 'transcript'
    handleBeginStory()
  }

  const handleViewImages = () => {
    if (variant === 'redesign') return
    audio.stopNarration()
    transition(JOURNEY_STATES.THRESHOLD)
  }

  const handleStoryComplete = useCallback(() => {
    if (!step?.record || step.type !== 'waypoint') return
    if (state !== JOURNEY_STATES.STORY) return

    if (isOnFirstTourStop(context, step, manifest)) {
      markTourOnboardingComplete()
    }

    audio.stopNarration()

    // Avoid double-counting if the audio already ended and fired story_complete.
    if (storyCompleteTrackedRef.current !== step.id) {
      storyCompleteTrackedRef.current = step.id
      track(TRACK_EVENTS.STORY_COMPLETE, { waypoint_id: step.id })
    }
    waypointAutoplayRef.current.clearStarted(step.id)
    playedStepRef.current = null
    setStoryEnded(false)
    setDockSnapshot(null)

    const next = completeWaypointAndAdvance(step.id, manifest)
    if (next.state === JOURNEY_STATES.DAY_COMPLETE) {
      track(TRACK_EVENTS.DAY_COMPLETE, { waypoint_id: step.id })
    }
  }, [audio, completeWaypointAndAdvance, context, manifest, state, step])

  // Multi-chapter stops (Pantheon exterior → interior chapters) stay on the same
  // stop: the continuity control advances to the next chapter until the last one.
  const handleStoryContinue = useCallback(() => {
    if (!step?.record || step.type !== 'waypoint') return
    if (state !== JOURNEY_STATES.STORY) return

    const chapterIndex = audio.progress?.chapterIndex ?? 0
    const chapterCount = Math.max(
      audio.progress?.chapterCount ?? 0,
      step.record.chapters?.length ?? 0,
    )
    const hasMoreChapters = chapterCount > 1 && chapterIndex < chapterCount - 1

    if (!storyEnded && hasMoreChapters) {
      audio.jumpToChapter(chapterIndex + 1, { play: true })
      return
    }

    handleStoryComplete()
  }, [audio, handleStoryComplete, state, step, storyEnded])

  const handleContinueClassicDay = useCallback(() => {
    playedStepRef.current = null
    waypointAutoplayRef.current.clearStarted()
    continueFromDayComplete(manifest)
    track(TRACK_EVENTS.RESUME, { day_break: true })
  }, [continueFromDayComplete, manifest])

  const handleTransitContinue = useCallback(() => {
    const transitId = step?.type === 'transit' ? step.id : null
    if (!transitId) return

    audio.stopNarration()
    audio.endTransit()
    completeTransit(transitId)
    playedStepRef.current = null
    waypointAutoplayRef.current.clearStarted()
    arrivedWaypointRef.current = null
    setDockSnapshot(null)
    advanceSequence(manifest)
    track(TRACK_EVENTS.RESUME, { transit_id: transitId, advance: true })
  }, [advanceSequence, audio, completeTransit, manifest, step?.id, step?.type])

  const handleResumeFromRest = useCallback(() => {
    if (!step?.record?.scripted_rest || step.type !== 'waypoint') return

    completeWaypoint(step.id)
    track(TRACK_EVENTS.RESUME, { waypoint_id: step.id, scripted: true })
    waypointAutoplayRef.current.clearStarted()
    playedStepRef.current = null
    scriptedRestNarrationStartedRef.current = null
    scriptedRestEnteredRef.current = null
    advanceSequence(manifest)
  }, [advanceSequence, completeWaypoint, manifest, step])

  const handleOpenThreshold = () => {
    if (variant === 'redesign') return
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
    // Full-screen C6 owns playback during story; threshold has its own overlay.
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
      transcript: resolveStepTranscript(step, context.path),
    }
  }, [
    audio.progress?.duration,
    audio.progress?.itemCount,
    audio.progress?.paused,
    audio.narrationPlaying,
    context.path,
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
    !inlineTransitAudio &&
    !needsPathChoice &&
    state !== JOURNEY_STATES.STORY &&
    state !== JOURNEY_STATES.THRESHOLD &&
    state !== JOURNEY_STATES.PAUSED &&
    state !== JOURNEY_STATES.COMPLETE
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
      onToggle={() => {
        if (dockEnded) {
          handleDockReplay()
          return
        }
        void syncAudio.toggleSyncedPlayback().catch((err) => {
          if (err?.code === 'resume_leader_only') {
            setSyncStatus('Only the leader can resume for everyone.')
          }
        })
      }}
      onReplay={handleDockReplay}
      onSkipBack={() => audio.skipNarration(-15)}
      onSkipForward={() => audio.skipNarration(15)}
      onSeek={(seconds) => audio.seekNarration(seconds)}
      onCycleSpeed={handleCycleSpeed}
      onStop={handleDockStop}
      onDismiss={handleDockDismiss}
      transcript={resolvedDockSnapshot.transcript}
      bottomInset={dockBottomInset}
    />
  ) : null

  const withInterruptionBanner = (content) => (
    <>
      {interruptionBanner}
      {devGeofenceActive && !loading && geoTarget ? (
        <DevGeofenceHud geoTarget={geoTarget} geo={geo} />
      ) : null}
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

  if (state === JOURNEY_STATES.COMPLETE || step?.done) {
    if (variant === 'redesign') {
      const moment = getJourneyCompleteMoment(manifest)
      return withInterruptionBanner(
        <C8eJourneyComplete
          headline={moment.headline}
          subline={moment.subline}
          stopCount={visitedStopCount}
          accent={T.encore}
          onReadLetter={() => navigate('/letter')}
          onReturnTour={() => navigate('/tour')}
        />
      )
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

  const wrapWithFirstStopOnboarding = (node, { near = false, insideGeofence = false, hasReconstruction = false, bottomInset = 0 } = {}) => {
    if (variant !== 'redesign' || !isOnFirstTourStop(context, step, manifest)) return node
    return (
      <>
        {node}
        <TourOnboardingCards
          state={state}
          stepType={step?.type}
          stopTitle={step?.record ? titleForWaypoint(step.record) : 'your first stop'}
          near={near}
          insideGeofence={insideGeofence}
          hasReconstruction={hasReconstruction}
          bottomInset={bottomInset}
        />
      </>
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
    record ? redesignWaypointShellProps(record, manifest) : {}

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

  if (state === JOURNEY_STATES.STORY && step.type === 'waypoint') {
    if (variant === 'redesign') {
      const record = step.record
      const chapters = record.chapters?.length ? record.chapters : []
      const activeChapterIndex = audio.progress?.chapterCount
        ? audio.progress.chapterIndex
        : 0
      const chapterCount = audio.progress?.chapterCount || Math.max(chapters.length, 1)
      const hasMoreChapters =
        !storyEnded && chapterCount > 1 && activeChapterIndex < chapterCount - 1
      const audioAvailable =
        audio.narrationPlaying ||
        (audio.progress?.itemCount ?? 0) > 0 ||
        (audio.progress?.duration ?? 0) > 0 ||
        storyEnded

      const realTranscript = resolveStepTranscript(step, context.path)
      const playerProps = buildImmersivePlayerProps({
        waypoint: record,
        waypointId: step.id,
        manifest,
        chapterIndex: activeChapterIndex,
        storyEnded,
        initialTab: storyViewRef.current,
        transcriptOverride: realTranscript ? stripDirectorCues(realTranscript) : null,
        audio: {
          narrationPlaying: audio.narrationPlaying,
          currentTime: audio.progress?.currentTime ?? 0,
          duration: audio.progress?.duration ?? 0,
          playbackRate: audio.playbackRate,
          chapterCount,
          audioAvailable,
        },
        continueLabel: hasMoreChapters
          ? 'Next chapter →'
          : storyEnded || !audio.narrationPlaying
            ? 'Continue walking →'
            : 'Skip ahead →',
        handlers: {
          speeds: PLAYER_SPEEDS,
          onCycleSpeed: handleCycleSpeed,
          onTogglePlay: () => {
            void syncAudio.toggleSyncedPlayback().catch((err) => {
              if (err?.code === 'resume_leader_only') {
                setSyncStatus('Only the leader can resume for everyone.')
              }
            })
          },
          onSkipBack: () => audio.skipNarration(-15),
          onSkipForward: () => audio.skipNarration(15),
          onSeek: (seconds) => {
            void syncAudio.seekSynced(seconds)
          },
          onSelectChapter: (i) => audio.jumpToChapter(i),
          onOpenTranscript: () => track(TRACK_EVENTS.TRANSCRIPT_OPEN, { waypoint_id: step.id }),
          onStoryComplete: handleStoryContinue,
          onThresholdCross: () =>
            track(TRACK_EVENTS.THRESHOLD_HOLD, { waypoint_id: step.id, inline: true }),
          onBack: () => {
            audio.stopNarration()
            waypointAutoplayRef.current.clearStarted()
            playedStepRef.current = null
            transition(JOURNEY_STATES.WALKING)
          },
        },
      })

      return withInterruptionBanner(
        wrapWithFirstStopOnboarding(
          <div style={{ position: 'relative', height: '100%' }}>
            <C6ImmersivePlayer
              {...playerProps}
              suppressAutoRevealInvite={isOnFirstTourStop(context, step, manifest)}
            />
            {syncAudio.joinCode ? (
              <div
                style={{
                  position: 'absolute',
                  left: 12,
                  right: 12,
                  bottom: dockActive ? 96 : 'max(16px, env(safe-area-inset-bottom))',
                  zIndex: 30,
                }}
              >
                <WalkSyncBar
                  syncEnabled={syncAudio.syncEnabled}
                  joinCode={syncAudio.joinCode}
                  isLeader={syncAudio.isLeader}
                  resumePolicy={syncAudio.resumePolicy}
                  canResumeForAll={syncAudio.canResumeForAll}
                  narrationPlaying={audio.narrationPlaying}
                  onToggleSync={() => void syncAudio.family?.setSyncEnabled(!syncAudio.syncEnabled)}
                  onPauseAll={() => void syncAudio.pauseForEveryone()}
                  onResumeAll={() => {
                    void syncAudio.resumeForEveryone().catch((err) => {
                      if (err?.code === 'resume_leader_only') {
                        setSyncStatus('Only the leader can resume for everyone.')
                      }
                    })
                  }}
                  statusMessage={syncStatus}
                />
              </div>
            ) : null}
          </div>,
          {
            hasReconstruction: Boolean(playerProps.hasReconstruction),
            bottomInset: dockActive ? 88 : 0,
          },
        ),
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
          onBeginListening={handleBeginStory}
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
      const nearApproach =
        !gpsArrived &&
        (geo.approachingGeofence || isWithinApproachDistance(liveWalkDistanceM))
      return withInterruptionBanner(
        wrapWithFirstStopOnboarding(
          <C2Walking
            {...props}
            stopKey={step.id}
            userPosition={geo.position}
            destination={walkingDestination}
            legFallback={walkingLegFallback}
            distanceM={liveWalkDistanceM}
            estimatedDistanceM={estimatedWalkDistanceM}
            progressPct={journeyProgressPct}
            locationStatus={geo.locationStatus}
            onRetryLocation={geo.retryLocation}
            onBeginChapter={() => beginWaypointStory(step.id, 'manual')}
            onPrimeAudio={() => audio.primeForGesture()}
            insideGeofence={gpsArrived}
            near
            extraBottomInset={dockActive ? 88 : 0}
            onOpenSettings={openSettings}
            map={<JourneyInlineMap manifest={manifest} context={context} geo={geo} />}
          />,
          {
            near: nearApproach,
            insideGeofence: gpsArrived,
            bottomInset: dockActive ? 88 : 0,
          },
        ),
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
      const transitProps = buildTransitImmersiveProps({
        step,
        manifest,
        context,
        journeyProgressPct,
        audio: {
          narrationPlaying: audio.narrationPlaying,
          progress: audio.progress,
          playbackRate: audio.playbackRate,
        },
        handlers: {
          onOpenSettings: openSettings,
          onContinue: handleTransitContinue,
          continueLabel: audio.narrationPlaying ? 'Skip ahead →' : 'Continue walking →',
          destinationTitle: titleForWaypoint(step.targetWaypoint),
          onBeginChapter: handleTransitDestinationArrival,
          onToggleAudio: () => {
            void syncAudio.toggleSyncedPlayback().catch(() => {})
          },
          onSkipBack: () => audio.skipNarration(-15),
          onSkipForward: () => audio.skipNarration(15),
          onSeek: (seconds) => audio.seekNarration(seconds),
          onCycleSpeed: handleCycleSpeed,
        },
      })
      return withInterruptionBanner(
        <C2Transit
          {...transitProps}
          stopKey={step.id}
          userPosition={geo.position}
          destination={walkingDestination}
          legFallback={walkingLegFallback}
          arrived={gpsArrived}
          distanceM={liveWalkDistanceM}
          estimatedDistanceM={estimatedWalkDistanceM}
          locationStatus={geo.locationStatus}
          onRetryLocation={geo.retryLocation}
          onPrimeAudio={() => audio.primeForGesture()}
          near={
            !gpsArrived &&
            (geo.approachingGeofence || isWithinApproachDistance(liveWalkDistanceM))
          }
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
      const nearApproach =
        !gpsArrived &&
        (geo.approachingGeofence || isWithinApproachDistance(liveWalkDistanceM))
      return withInterruptionBanner(
        wrapWithFirstStopOnboarding(
          <C2Walking
            {...props}
            stopKey={step.id}
            userPosition={geo.position}
            destination={walkingDestination}
            legFallback={walkingLegFallback}
            distanceM={liveWalkDistanceM}
            estimatedDistanceM={estimatedWalkDistanceM}
            progressPct={journeyProgressPct}
            locationStatus={geo.locationStatus}
            onRetryLocation={geo.retryLocation}
            onBeginChapter={() => beginWaypointStory(step.id, 'manual')}
            onPrimeAudio={() => audio.primeForGesture()}
            insideGeofence={gpsArrived}
            near={nearApproach}
            extraBottomInset={dockActive ? 88 : 0}
            onPause={() => transition(JOURNEY_STATES.PAUSED)}
            onOpenSettings={openSettings}
            map={<JourneyInlineMap manifest={manifest} context={context} geo={geo} />}
          />,
          {
            near: nearApproach,
            insideGeofence: gpsArrived,
            bottomInset: dockActive ? 88 : 0,
          },
        ),
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
