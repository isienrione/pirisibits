import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { isDevPanelEnabled } from '../../config/env.js'
import { DEV_TOOLS_CHANGED, readDevSimulateGps } from '../dev/devTools.js'
import { useAudioEngine } from '../../hooks/useAudioEngine.js'
import { useJourney, useTourManifest } from '../../hooks/useJourney.js'
import { useJourneyGeo } from '../../hooks/useJourneyGeo.js'
import { useWalkingCompanion } from '../../hooks/useWalkingCompanion.js'
import { useJourneyStep } from '../../hooks/useJourneyStep.js'
import { useOptionalPromotion } from '../../hooks/useOptionalPromotion.js'
import { getPromotionInsertSteps } from '../../content/optionalPromotion.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { JOURNEY_STATES } from '../../state/journey.js'
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

export default function JourneyShell() {
  const { state, context, transition, completeWaypoint, completeTransit, advanceSequence, setPath, setActiveWaypoint, promoteOptional, prepareResumeCue, clearPendingResumeCue, completeWaypointAndAdvance, continueFromDayComplete, states } =
    useJourney()
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
  const playedStepRef = useRef(null)
  const storyStartedRef = useRef(null)
  const playedResumeRef = useRef(false)
  const playedCompletionRef = useRef(false)
  const scriptedRestNarrationStartedRef = useRef(null)
  const scriptedRestEnteredRef = useRef(null)
  const prevStateRef = useRef(state)
  const prevCompanionModeRef = useRef(COMPANION_MODES.NORMAL)

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
    if (prevStateRef.current === JOURNEY_STATES.THRESHOLD && state === JOURNEY_STATES.WALKING) {
      storyStartedRef.current = null
      playedStepRef.current = null
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
  const geo = useJourneyGeo(geoTarget, {
    debugMode: import.meta.env.DEV,
    simulateAtTarget: devSimulateGps,
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

  useEffect(() => {
    if (!geoTarget || step?.type !== 'waypoint') return
    if (state !== JOURNEY_STATES.WALKING && state !== JOURNEY_STATES.APPROACHING) return

    if (geo.insideGeofence) {
      if (state !== JOURNEY_STATES.ARRIVED) {
        transition(JOURNEY_STATES.ARRIVED)
        if (audioUnlocked) void audio.playArrivalChime()
        track(TRACK_EVENTS.WAYPOINT_ARRIVED, { waypoint_id: step.id })
      }
      return
    }

    if (geo.approachingGeofence && state === JOURNEY_STATES.WALKING) {
      transition(JOURNEY_STATES.APPROACHING)
    }
  }, [geo.insideGeofence, geo.approachingGeofence, geoTarget, state, step?.id, step?.type, transition, audio, audioUnlocked])

  useEffect(() => {
    if (!manifest || !step || step.done) return
    if (!audioUnlocked) return
    if (playedStepRef.current === step.id) return

    if (state === JOURNEY_STATES.WALKING && step.type === 'transit' && !needsPathChoice) {
      playedStepRef.current = step.id
      audio.playTransit(step.id)
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
    setBusy(true)
    transition(JOURNEY_STATES.STORY)
    setBusy(false)
  }

  const handleStoryComplete = useCallback(() => {
    if (!step?.record || step.type !== 'waypoint') return

    track(TRACK_EVENTS.STORY_COMPLETE, { waypoint_id: step.id })
    storyStartedRef.current = null
    playedStepRef.current = null

    const next = completeWaypointAndAdvance(step.id)
    if (next.state === JOURNEY_STATES.DAY_COMPLETE) {
      track(TRACK_EVENTS.DAY_COMPLETE, { waypoint_id: step.id })
    }
  }, [completeWaypointAndAdvance, step])

  const handleContinueClassicDay = useCallback(() => {
    playedStepRef.current = null
    storyStartedRef.current = null
    continueFromDayComplete()
    track(TRACK_EVENTS.RESUME, { day_break: true })
  }, [continueFromDayComplete])

  const handleTransitContinue = useCallback(() => {
    if (!step?.record || step.type !== 'transit') return

    audio.endTransit()
    completeTransit(step.id)
    playedStepRef.current = null
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

  const handleSimulateArrival = () => {
    if (!step?.record || step.type !== 'waypoint') return
    transition(JOURNEY_STATES.ARRIVED)
    if (audioUnlocked) void audio.playArrivalChime()
    track(TRACK_EVENTS.WAYPOINT_ARRIVED, { waypoint_id: step.id, simulated: true })
  }

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

  const withInterruptionBanner = (content) => (
    <>
      {interruptionBanner}
      {content}
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
    return withInterruptionBanner(<PathChoiceScreen onChoose={handlePathChoice} busy={busy} />)
  }

  if (state === JOURNEY_STATES.STORY && step.type === 'waypoint') {
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
    return withInterruptionBanner(
      <WalkingScreen
        title={step.record.title ?? step.record.name}
        subtitle={step.record.approachLine}
        distance={geo.distance}
        locationStatus={geo.locationStatus}
        onRetryLocation={geo.retryLocation}
        companionMode={companion.mode}
        onSimulateArrival={handleSimulateArrival}
        busy={busy}
      />
    )
  }

  if (state === JOURNEY_STATES.DAY_COMPLETE) {
    const act4 = ROME_ACTS.find((act) => act.id === 'act4')
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
