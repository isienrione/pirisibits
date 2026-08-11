import { useCallback, useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { isDevGeofencesSantiago, isDevPanelEnabled } from '../../config/env.js'
import { INCLUDE_DEBUG_PANEL } from '../debug/includeDebugPanel.js'
import ChronoWalkLogo from '../ui/ChronoWalkLogo.jsx'
import { useJourneyGeoDebugOptions } from '../../hooks/useJourneyGeoDebug.js'
import { DEV_TOOLS_CHANGED, readDevSimulateGps } from '../dev/devTools.js'
import { useAudioEngine } from '../../hooks/useAudioEngine.js'
import { useSyncedAudioControls } from '../../hooks/useSyncedAudioControls.js'
import { useSharedWalkGuard } from '../../redesign/context/SharedWalkGuardContext.jsx'
import { createWaypointAutoplayCoordinator } from '../../audio/waypointAutoplay.js'
import { useV2Journey, useTourManifest } from '../../hooks/useV2Journey.js'
import { t } from '../../i18n/t.js'
import { useJourneyGeo } from '../../hooks/useJourneyGeo.js'
import { useWalkingCompanion } from '../../hooks/useWalkingCompanion.js'
import { useJourneyStep } from '../../hooks/useJourneyStep.js'
import { useOptionalPromotion } from '../../hooks/useOptionalPromotion.js'
import { getPromotionInsertSteps } from '../../content/optionalPromotion.js'
import { consumeStoryViewIntent } from '../../lib/jumpToWaypoint.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { JOURNEY_STATES, isImmersiveJourneyState } from '../../state/journey.js'
import { HAPTIC_KIND, triggerHaptic } from '../../utils/haptics.js'
import { STORY_PLAYBACK_SPEEDS, cycleAudioSpeed, readAudioSpeed } from '../../utils/appPreferences.js'
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
import ReviewPrompt from '../ReviewPrompt.jsx'
import { ACT_COLORS, T, SHELL_TAB_BAR_INSET, SHELL_SAFE_BOTTOM_INSET } from '../../redesign/tokens.js'
import RedesignJourneyWelcome from '../../redesign/ui/RedesignJourneyWelcome.jsx'
import TourOnboardingCards from '../../redesign/ui/TourOnboardingCards.jsx'
import {
  isOnFirstTourStop,
  markTourOnboardingComplete,
  shouldShowTourOnboarding,
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
// presence near the landmark - never the instant the radius is first touched.
const ARRIVAL_DWELL_MS = 5000
// When the position's radius of uncertainty is worse than this, we don't
// auto-arrive; the traveller can still tap "I'm here".
const POOR_ACCURACY_M = 60
// Indoor Santiago field tests often report 80–120 m accuracy; relax while dev geofences are on.
const DEV_GEOFENCE_ACCURACY_M = 150

// Speeds offered by the immersive player's speed pill - same set as Settings.
const PLAYER_SPEEDS = STORY_PLAYBACK_SPEEDS

const DebugPanelHost = INCLUDE_DEBUG_PANEL
  ? lazy(() => import('../debug/DebugPanelHost.jsx'))
  : null

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
    const completed = Array.isArray(context.completedWaypointIds)
      ? context.completedWaypointIds
      : []
    return completed.filter((id) => isVisitStop(getWaypoint(manifest, id))).length
  }, [context.completedWaypointIds, manifest])
  const audio = useAudioEngine(manifest)
  const beginWaypointStoryRef = useRef(null)
  const syncAudio = useSyncedAudioControls(audio, {
    currentWaypointId: step?.id ?? null,
    onRemoteWaypoint: (waypointId) => {
      if (!waypointId) return
      beginWaypointStoryRef.current?.(waypointId, 'family_sync')
    },
  })
  const { requestAdvanceToWaypoint } = useSharedWalkGuard()
  const [syncStatus, setSyncStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [devSimulateGps, setDevSimulateGps] = useState(false)
  /** First-stop tip cards block Colosseum narration until dismissed. */
  const [storyTutorialBlocking, setStoryTutorialBlocking] = useState(false)
  // Bumped when tips release blocking so autoplay re-runs even if blocking was already false.
  const [tourTipsReleaseNonce, setTourTipsReleaseNonce] = useState(0)
  const handleTourTutorialBlockingChange = useCallback((blocking) => {
    setStoryTutorialBlocking(Boolean(blocking))
    if (!blocking) {
      setTourTipsReleaseNonce((n) => n + 1)
    }
  }, [])
  // True once the current waypoint's narration reaches its natural end.
  const [storyEnded, setStoryEnded] = useState(false)
  // Last heard narration - keeps the floating dock visible after audio ends.
  const [dockSnapshot, setDockSnapshot] = useState(null)
  // Visual “Waypoint unlocked” banner on You've Arrived (synced with the chime).
  const [arrivalUnlockBanner, setArrivalUnlockBanner] = useState(null)
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
  // Ensures chime + “Waypoint unlocked!” fire once per stop (GPS or manual).
  const arrivalAlertPlayedRef = useRef(null)
  const arrivalAlertInFlightRef = useRef(null)
  const arrivalHapticPlayedRef = useRef(null)
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
    // Jumping away from STORY/ARRIVED back to WALKING (e.g. "Walk here" to a
    // new stop) - stop the previous story narration, clear the autoplay guard
    // so the new stop can start fresh, and release any stale dock snapshot.
    if (
      (prevStateRef.current === JOURNEY_STATES.STORY ||
        prevStateRef.current === JOURNEY_STATES.ARRIVED) &&
      state === JOURNEY_STATES.WALKING
    ) {
      audioOpsRef.current.stopNarration()
      waypointAutoplayRef.current.clearStarted()
      playedStepRef.current = null
      setDockSnapshot(null)
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
      // Hold Colosseum exterior (first-stop) narration until floating tips finish/close.
      // Check both the tip callback and persisted onboarding so we do not race the
      // first tip mount (blocking starts false before TourOnboardingCards effects).
      const holdForFirstStopTips =
        storyTutorialBlocking ||
        (variant === 'redesign' &&
          step?.type === 'waypoint' &&
          step?.id === waypointId &&
          isOnFirstTourStop(context, step, manifest) &&
          shouldShowTourOnboarding(context))
      if (holdForFirstStopTips) return false

      return waypointAutoplayRef.current.ensureStarted(
        waypointId,
        {
          // Only adopt an actively playing session for THIS waypoint.
          // A paused tip-hold must resume/start, not be treated as already begun.
          isPlaying: () => {
            const live = audioOpsRef.current
            const activeId = live.getActiveStopId?.() ?? null
            return activeId === waypointId && Boolean(live.narrationPlaying)
          },
        },
        async () => {
          const live = audioOpsRef.current
          const unlocked = await live.unlock()
          if (unlocked) setAudioUnlocked(true)
          setActiveWaypoint(waypointId, manifest)

          const activeId = live.getActiveStopId?.() ?? null
          const hasPausedSession =
            activeId === waypointId &&
            !live.narrationPlaying &&
            ((live.progress?.itemCount ?? 0) > 0 || (live.progress?.duration ?? 0) > 0)
          if (hasPausedSession) {
            return (await live.resumeNarration()) !== false
          }
          return (await live.playWaypoint(waypointId)) ?? false
        },
      )
    },
    [
      context,
      manifest,
      setActiveWaypoint,
      step,
      storyTutorialBlocking,
      variant,
    ],
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
  // Never auto-play t01 - travelers must pick Path A or B first.
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
      if (!manifest || !waypointId) return

      const runPromote = () => {
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
        return true
      }

      void requestAdvanceToWaypoint(waypointId, runPromote)
    },
    [audio, context.path, manifest, promoteOptional, requestAdvanceToWaypoint],
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

    // Keep the first-stop tip quiet until the traveler finishes or closes it.
    // Also gate on pending onboarding so we do not start under tips before the
    // tip component's blocking effect has run.
    const tipsPending =
      storyTutorialBlocking ||
      (variant === 'redesign' &&
        isOnFirstTourStop(context, step, manifest) &&
        shouldShowTourOnboarding(context))
    if (tipsPending) {
      clearStoryAutoplayGesture()
      if (audioOpsRef.current.narrationPlaying) {
        audioOpsRef.current.pauseNarration()
      }
      return undefined
    }

    const waypointId = step.id
    let cancelled = false
    let retryTimer = null

    const isThisWaypointLive = () => {
      const live = audioOpsRef.current
      const activeId = live.getActiveStopId?.() ?? null
      return activeId === waypointId && Boolean(live.narrationPlaying)
    }

    const attempt = async () => {
      const started = await tryStartWaypointNarrationRef.current(waypointId)
      if (cancelled) return
      if (
        started ||
        waypointAutoplayRef.current.getStartedWaypointId() === waypointId ||
        isThisWaypointLive()
      ) {
        return
      }

      armStoryAutoplayGestureRef.current(waypointId)

      retryTimer = window.setTimeout(() => {
        if (cancelled) return
        if (
          waypointAutoplayRef.current.getStartedWaypointId() === waypointId ||
          isThisWaypointLive()
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
  }, [
    clearStoryAutoplayGesture,
    context,
    manifest,
    state,
    step,
    audioUnlocked,
    storyTutorialBlocking,
    tourTipsReleaseNonce,
    variant,
  ])

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
  // Only treat "near end" on the *last* plan item - mid-stop chapters (e.g. Pantheon
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

  // Threshold is inline on the immersive player - narration keeps playing while
  // the traveller looks through time. No separate THRESHOLD screen handoff.

  const handleCycleSpeed = useCallback(() => {
    const current = audio.playbackRate ?? readAudioSpeed()
    const next = cycleAudioSpeed(current)
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

  // Pocket haptic when GPS confirms you're in the radius - full chime+VO wait
  // for the You've Arrived screen so the unlock never fires five seconds early.
  const pulseArrivalHaptic = useCallback((waypointId) => {
    if (!waypointId) return
    if (arrivalHapticPlayedRef.current === waypointId) return
    arrivalHapticPlayedRef.current = waypointId
    triggerHaptic(HAPTIC_KIND.ARRIVAL_PULSE)
    triggerHaptic(HAPTIC_KIND.ARRIVAL_UNLOCK)
  }, [])

  // Full arrival alert: chime → “Waypoint unlocked!” - once per stop, on Arrived.
  // Do not mark the cue “played” until the sequence finishes (or the walker
  // starts the story). That way a blocked unlock can retry, and a cancelled
  // mid-sequence never leaves a lone “unlocked” VO over narration.
  const notifyArrivalUnlock = useCallback(
    (waypointId, { requireUnlock = true, showBanner = true } = {}) => {
      if (!waypointId) return

      pulseArrivalHaptic(waypointId)

      if (arrivalAlertPlayedRef.current === waypointId) return
      if (arrivalAlertInFlightRef.current === waypointId) return
      // Manual "I'm here" has a user gesture - play even before the global
      // unlock flag flips, otherwise the chime was silently skipped forever.
      if (requireUnlock && !audioUnlocked) return

      arrivalAlertInFlightRef.current = waypointId
      if (showBanner) setArrivalUnlockBanner(waypointId)
      void audioOpsRef.current.playArrivalChime().then((completed) => {
        if (arrivalAlertInFlightRef.current === waypointId) {
          arrivalAlertInFlightRef.current = null
        }
        if (completed) {
          arrivalAlertPlayedRef.current = waypointId
        }
      })
    },
    [audioUnlocked, pulseArrivalHaptic]
  )

  const suppressArrivalUnlockForStory = useCallback((waypointId) => {
    if (!waypointId) return
    audioOpsRef.current.cancelArrivalChime?.()
    arrivalAlertInFlightRef.current = null
    arrivalAlertPlayedRef.current = waypointId
    setArrivalUnlockBanner((current) => (current === waypointId ? null : current))
  }, [])

  // Confirmed arrival - auto (after 5s dwell) or manual ("I'm here"). Guarded so
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
      const fromGesture = source === 'manual' || source === 'transit_manual'
      // Chime + unlock VO belong on You've Arrived - not while still walking.
      notifyArrivalUnlock(waypointId, { requireUnlock: !fromGesture, showBanner: true })
      transition(JOURNEY_STATES.ARRIVED)
      track(TRACK_EVENTS.WAYPOINT_ARRIVED, { waypoint_id: waypointId, source })
      if (fromGesture) {
        track(TRACK_EVENTS.GPS_FALLBACK_USED, { waypoint_id: waypointId })
      }
    },
    [notifyArrivalUnlock, transition]
  )

  useEffect(() => {
    beginWaypointStoryRef.current = beginWaypointStory
  }, [beginWaypointStory])

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

  const handleTransitDestinationArrival = useCallback(
    (source = 'transit_manual') => {
      if (!manifest || step?.type !== 'transit' || !step.targetWaypoint) return

      const transitId = step.id
      const waypointId = step.targetWaypoint.id
      if (arrivedWaypointRef.current === waypointId) return
      // Claim immediately so a dwell timer cannot double-fire while the shared
      // walk guard dialog / advance is in flight.
      arrivedWaypointRef.current = waypointId

      const arrivalSource = source === 'auto' ? 'auto' : 'transit_manual'

      const runArrival = () => {
        audio.stopNarration()
        audio.endTransit()
        completeTransit(transitId)
        playedStepRef.current = null
        waypointAutoplayRef.current.clearStarted()
        setDockSnapshot(null)
        advanceSequence(manifest)
        beginWaypointStory(waypointId, arrivalSource)
        return true
      }

      void requestAdvanceToWaypoint(waypointId, runArrival)
    },
    [
      advanceSequence,
      audio,
      beginWaypointStory,
      completeTransit,
      manifest,
      requestAdvanceToWaypoint,
      step,
    ]
  )

  // Auto GPS dwell + manual "I'm here" both land here for waypoint and transit.
  const confirmGpsArrival = useCallback(
    (source) => {
      if (step?.type === 'transit') {
        handleTransitDestinationArrival(source)
        return
      }
      arriveAtWaypoint(source)
    },
    [arriveAtWaypoint, handleTransitDestinationArrival, step?.type]
  )

  useEffect(() => {
    arriveRef.current = confirmGpsArrival
  }, [confirmGpsArrival])

  // Reset arrival guards when the target changes - but never cancel a chime we
  // just started for the waypoint we are arriving at (transit advance flips
  // step.id in the same turn as beginWaypointStory).
  useEffect(() => {
    if (arrivedWaypointRef.current === step?.id) return
    if (
      step?.type === 'transit' &&
      arrivedWaypointRef.current === step?.targetWaypoint?.id
    ) {
      return
    }
    arrivedWaypointRef.current = null
    arrivalAlertPlayedRef.current = null
    arrivalAlertInFlightRef.current = null
    arrivalHapticPlayedRef.current = null
    setArrivalUnlockBanner(null)
    audioOpsRef.current.cancelArrivalChime?.()
    if (dwellTimerRef.current != null) {
      clearTimeout(dwellTimerRef.current)
      dwellTimerRef.current = null
    }
  }, [step?.id, step?.type, step?.targetWaypoint?.id])

  useEffect(() => {
    if (!geoTarget) return
    // Most of the tour walks on a transit leg toward the next stop - auto-arrive
    // must work there too, not only while the sequence step is already a waypoint.
    if (step?.type !== 'waypoint' && step?.type !== 'transit') return
    if (step?.type === 'transit' && needsPathChoice) return
    if (state !== JOURNEY_STATES.WALKING && state !== JOURNEY_STATES.APPROACHING) return

    const targetArrivalId =
      step?.type === 'waypoint' ? step.id : step?.targetWaypoint?.id
    if (!targetArrivalId || arrivedWaypointRef.current === targetArrivalId) return

    // Reject drift: a wildly uncertain fix can flicker "inside" the radius, so
    // we never auto-arrive on it (the "I'm here" button still works).
    const accuracyReliable = geo.accuracy == null || geo.accuracy <= arrivalAccuracyLimitM

    if (geo.insideGeofence && accuracyReliable) {
      // Pocket pulse only - chime + “Waypoint unlocked!” play on You've Arrived.
      pulseArrivalHaptic(targetArrivalId)

      // Mature dwell, then land on ARRIVED (never skip straight into story).
      if (dwellTimerRef.current == null) {
        dwellTimerRef.current = setTimeout(() => {
          dwellTimerRef.current = null
          arriveRef.current?.('auto')
        }, ARRIVAL_DWELL_MS)
      }
      return
    }

    // Left the radius (or accuracy went bad) before dwell matured - cancel.
    if (dwellTimerRef.current != null) {
      clearTimeout(dwellTimerRef.current)
      dwellTimerRef.current = null
    }

    if (
      geo.approachingGeofence &&
      state === JOURNEY_STATES.WALKING &&
      step?.type === 'waypoint'
    ) {
      transition(JOURNEY_STATES.APPROACHING)
    }
  }, [
    arrivalAccuracyLimitM,
    geo.insideGeofence,
    geo.approachingGeofence,
    geo.accuracy,
    geoTarget,
    needsPathChoice,
    pulseArrivalHaptic,
    state,
    step?.id,
    step?.type,
    step?.targetWaypoint?.id,
    transition,
  ])

  useEffect(() => () => {
    if (dwellTimerRef.current != null) clearTimeout(dwellTimerRef.current)
  }, [])

  // Auto-dismiss the Arrived unlock banner after the VO has had time to play.
  useEffect(() => {
    if (!arrivalUnlockBanner) return undefined
    const timer = window.setTimeout(() => {
      setArrivalUnlockBanner((current) => (current === arrivalUnlockBanner ? null : current))
    }, 4200)
    return () => window.clearTimeout(timer)
  }, [arrivalUnlockBanner])

  // True when the fix is too uncertain to trust for auto-arrival - used to
  // gently surface the manual "I'm here" affordance.
  const locationShy =
    geo.accuracy != null && geo.accuracy > arrivalAccuracyLimitM

  const gpsArrivalReliable =
    geo.accuracy == null || geo.accuracy <= arrivalAccuracyLimitM
  const gpsArrived = Boolean(geo.insideGeofence && gpsArrivalReliable)

  // If Arrived before audio unlock, play the full chime as soon as audio is ready.
  // Do NOT replay on WALKING/APPROACHING - that was the early-fire bug.
  useEffect(() => {
    if (!audioUnlocked) return
    if (step?.type !== 'waypoint') return
    if (state !== JOURNEY_STATES.ARRIVED) return
    notifyArrivalUnlock(step.id, { showBanner: true })
  }, [audioUnlocked, notifyArrivalUnlock, state, step?.id, step?.type])

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
    // Never let a late “unlocked” VO land mid-chapter.
    if (step.type === 'waypoint') suppressArrivalUnlockForStory(step.id)
    storyViewRef.current = getAppPreferences().preferTranscript ? 'transcript' : 'chapters'
    setBusy(true)
    transition(JOURNEY_STATES.STORY)
    // First-stop tips own the moment - narration waits until they finish/close.
    const holdForTutorial =
      step.type === 'waypoint' &&
      isOnFirstTourStop(context, step, manifest) &&
      shouldShowTourOnboarding(context)
    if (step.type === 'waypoint' && !holdForTutorial) {
      void tryStartWaypointNarration(step.id)
    }
    setBusy(false)
  }


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

    const runComplete = () => {
      if (isOnFirstTourStop(context, step, manifest)) {
        markTourOnboardingComplete()
      }

      audio.stopNarration()

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
      return true
    }

    const nextStepId =
      (manifest &&
        getStepIdAtIndex(
          manifest,
          context.path,
          context.currentSequenceIndex + 1,
          context.promotedOptionalIds,
        )) ||
      `after:${step.id}`
    void requestAdvanceToWaypoint(nextStepId, runComplete)
  }, [
    audio,
    completeWaypointAndAdvance,
    context,
    manifest,
    requestAdvanceToWaypoint,
    state,
    step,
  ])

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
    const nextStepId =
      (manifest &&
        getStepIdAtIndex(
          manifest,
          context.path,
          context.currentSequenceIndex + 1,
          context.promotedOptionalIds,
        )) ||
      'day-break-next'

    const runDayContinue = () => {
      playedStepRef.current = null
      waypointAutoplayRef.current.clearStarted()
      continueFromDayComplete(manifest)
      track(TRACK_EVENTS.RESUME, { day_break: true })
      return true
    }

    void requestAdvanceToWaypoint(nextStepId, runDayContinue)
  }, [
    continueFromDayComplete,
    context.currentSequenceIndex,
    context.path,
    context.promotedOptionalIds,
    manifest,
    requestAdvanceToWaypoint,
  ])

  const handleTransitContinue = useCallback(() => {
    const transitId = step?.type === 'transit' ? step.id : null
    if (!transitId) return

    const runAdvance = () => {
      audio.stopNarration()
      audio.endTransit()
      completeTransit(transitId)
      playedStepRef.current = null
      waypointAutoplayRef.current.clearStarted()
      arrivedWaypointRef.current = null
      setDockSnapshot(null)
      advanceSequence(manifest)
      track(TRACK_EVENTS.RESUME, { transit_id: transitId, advance: true })
      return true
    }

    const nextStepId =
      (manifest &&
        getStepIdAtIndex(
          manifest,
          context.path,
          context.currentSequenceIndex + 1,
          context.promotedOptionalIds,
        )) ||
      `after:${transitId}`
    void requestAdvanceToWaypoint(nextStepId, runAdvance)
  }, [
    advanceSequence,
    audio,
    completeTransit,
    context,
    manifest,
    requestAdvanceToWaypoint,
    step?.id,
    step?.type,
  ])

  const handleResumeFromRest = useCallback(() => {
    if (!step?.record?.scripted_rest || step.type !== 'waypoint') return

    const runResume = () => {
      completeWaypoint(step.id)
      track(TRACK_EVENTS.RESUME, { waypoint_id: step.id, scripted: true })
      waypointAutoplayRef.current.clearStarted()
      playedStepRef.current = null
      scriptedRestNarrationStartedRef.current = null
      scriptedRestEnteredRef.current = null
      advanceSequence(manifest)
      return true
    }

    const nextStepId =
      (manifest &&
        getStepIdAtIndex(
          manifest,
          context.path,
          context.currentSequenceIndex + 1,
          context.promotedOptionalIds,
        )) ||
      `after:${step.id}`
    void requestAdvanceToWaypoint(nextStepId, runResume)
  }, [
    advanceSequence,
    completeWaypoint,
    context,
    manifest,
    requestAdvanceToWaypoint,
    step,
  ])

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

  // Persistent narration dock - visible during walking/transit narration and briefly after.
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
    state !== JOURNEY_STATES.ARRIVED &&
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
    <div className="cw-journey-shell-root">
      {interruptionBanner}
      {devGeofenceActive && !loading && geoTarget ? (
        <DevGeofenceHud
          geoTarget={geoTarget}
          geo={geo}
          arrivalAccuracyLimitM={arrivalAccuracyLimitM}
        />
      ) : null}
      {/* Subtle logo for 5-tap debug gesture (panel also opens via ?debug=1). */}
      {INCLUDE_DEBUG_PANEL ? (
        <div
          data-testid="cw-journey-debug-logo"
          style={{
            position: 'fixed',
            top: 8,
            left: 8,
            zIndex: 40,
            opacity: 0.22,
            pointerEvents: 'auto',
          }}
        >
          <ChronoWalkLogo size={26} variant="dark" />
        </div>
      ) : null}
      {content}
      {floatingPlayer}
      {DebugPanelHost ? (
        <Suspense fallback={null}>
          <DebugPanelHost />
        </Suspense>
      ) : null}
    </div>
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
        <>
          <C8eJourneyComplete
            headline={moment.headline}
            subline={moment.subline}
            stopCount={visitedStopCount}
            accent={T.encore}
            onReadLetter={() => navigate('/letter')}
            onReturnTour={() => navigate('/tour')}
          />
          <ReviewPrompt active />
        </>
      )
    }
    return withInterruptionBanner(
      <>
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
        <ReviewPrompt active />
      </>
    )
  }

  const wrapWithFirstStopOnboarding = (node, { near = false, insideGeofence = false, hasReconstruction = false, bottomInset = 0 } = {}) => {
    if (
      variant !== 'redesign' ||
      !isOnFirstTourStop(context, step, manifest) ||
      !shouldShowTourOnboarding(context)
    ) {
      return node
    }
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
          onBlockingChange={handleTourTutorialBlockingChange}
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
        subtitle="Tap once to wake the soundscape - narration, ambience, and the city between stops."
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
      const sessionForThisStop = audio.getActiveStopId?.() === step.id
      const activeChapterIndex =
        sessionForThisStop && audio.progress?.chapterCount
          ? audio.progress.chapterIndex
          : 0
      // Prefer manifest chapter count when a prior stop's session still reports a smaller count.
      const chapterCount = Math.max(
        sessionForThisStop ? audio.progress?.chapterCount ?? 0 : 0,
        chapters.length,
        1,
      )
      const hasMoreChapters =
        !storyEnded && chapterCount > 1 && activeChapterIndex < chapterCount - 1
      const hasLoadedSession =
        sessionForThisStop &&
        (audio.narrationPlaying ||
          (audio.progress?.itemCount ?? 0) > 0 ||
          (audio.progress?.duration ?? 0) > 0)
      // Keep play enabled so a cold / wrong-stop session can still be started.
      const audioAvailable = hasLoadedSession || storyEnded || chapters.length > 0

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
          narrationPlaying: sessionForThisStop ? audio.narrationPlaying : false,
          currentTime: sessionForThisStop ? audio.progress?.currentTime ?? 0 : 0,
          duration: sessionForThisStop ? audio.progress?.duration ?? 0 : 0,
          playbackRate: audio.playbackRate,
          chapterCount,
          audioAvailable,
        },
        continueLabel: hasMoreChapters
          ? 'Next chapter →'
          : storyEnded || !(sessionForThisStop && audio.narrationPlaying)
            ? 'Continue walking →'
            : 'Skip ahead →',
        handlers: {
          speeds: PLAYER_SPEEDS,
          onCycleSpeed: handleCycleSpeed,
          onTogglePlay: () => {
            void (async () => {
              // Do not let play start Colosseum exterior under floating tips.
              if (
                storyTutorialBlocking ||
                (isOnFirstTourStop(context, step, manifest) &&
                  shouldShowTourOnboarding(context))
              ) {
                return
              }
              if (!hasLoadedSession) {
                const started = await tryStartWaypointNarration(step.id)
                if (started) return
              }
              try {
                await syncAudio.toggleSyncedPlayback()
              } catch (err) {
                if (err?.code === 'resume_leader_only') {
                  setSyncStatus('Only the leader can resume for everyone.')
                }
              }
            })()
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
          <div style={{ position: 'relative', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <C6ImmersivePlayer
              {...playerProps}
              onOpenSettings={openSettings}
              suppressAutoRevealInvite={
                isOnFirstTourStop(context, step, manifest) &&
                shouldShowTourOnboarding(context)
              }
              syncSlot={
                syncAudio.joinCode ? (
                  <WalkSyncBar
                    syncEnabled={syncAudio.syncEnabled}
                    joinCode={syncAudio.joinCode}
                    isLeader={syncAudio.isLeader}
                    resumePolicy={syncAudio.resumePolicy}
                    canResumeForAll={syncAudio.canResumeForAll}
                    narrationPlaying={audio.narrationPlaying}
                    pendingGroupResume={syncAudio.pendingGroupResume}
                    walkingIndependently={Boolean(syncAudio.family?.isWalkingIndependently)}
                    onToggleSync={() =>
                      void syncAudio.family?.setSyncEnabled(!syncAudio.family?.session?.syncEnabled)
                    }
                    onPauseAll={() => void syncAudio.pauseForEveryone()}
                    onResumeAll={() => {
                      void syncAudio.resumeForEveryone().catch((err) => {
                        if (err?.code === 'resume_leader_only') {
                          setSyncStatus('Only the leader can resume for everyone.')
                        }
                      })
                    }}
                    onResumeWithGroup={() => void syncAudio.resumeWithGroup()}
                    statusMessage={syncStatus}
                  />
                ) : null
              }
            />
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
          unlockNotice={arrivalUnlockBanner === step.id}
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
            isFirstStop={isOnFirstTourStop(context, step, manifest)}
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
            isFirstStop={isOnFirstTourStop(context, step, manifest)}
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
          actTitle={
            act4
              ? t('actComplete.actTitle', {
                  numeral: act4.numeral,
                  title: String(act4.title ?? '').toUpperCase(),
                })
              : t('actComplete.defaultAct')
          }
          closingLine={act4?.promise ?? t('actComplete.defaultClosing')}
          stats={[
            t('actComplete.stops', { count: context.completedWaypointIds.length }),
            t('actComplete.distance'),
            t('actComplete.centuries'),
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
