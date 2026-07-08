import { useCallback, useEffect, useRef, useState } from 'react'
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
import { formatDistanceToNext } from '../../content/journeyProgress.js'
import C2Walking from '../../redesign/screens/C2Walking.jsx'
import C3Approaching from '../../redesign/screens/C3Approaching.jsx'
import C4ArrivalMoment from '../../redesign/screens/C4ArrivalMoment.jsx'
import C6ImmersivePlayer from '../../redesign/screens/C6ImmersivePlayer.jsx'
import C8aPathChoice from '../../redesign/screens/C8aPathChoice.jsx'
import C8bThePause from '../../redesign/screens/C8bThePause.jsx'
import C8cActComplete from '../../redesign/screens/C8cActComplete.jsx'
import { ACT_COLORS, T } from '../../redesign/tokens.js'
import RedesignJourneyWelcome from '../../redesign/ui/RedesignJourneyWelcome.jsx'
import {
  accentForWaypoint,
  approachCopy,
  arrivalCopy,
  photoForWaypoint,
  signatureLine,
  titleForWaypoint,
} from '../../redesign/lib/waypointPresentation.js'

export default function JourneyShell({ variant = 'legacy' }) {
  const { state, context, transition, completeWaypoint, completeTransit, advanceSequence, setPath, setActiveWaypoint, promoteOptional, prepareResumeCue, clearPendingResumeCue, completeWaypointAndAdvance, continueFromDayComplete, states } =
    useV2Journey()
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
  const storyViewRef = useRef('chapters')

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
    storyViewRef.current = 'chapters'
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

  if (state === JOURNEY_STATES.STORY && step.type === 'waypoint') {
    if (variant === 'redesign') {
      const record = step.record
      const props = redesignWaypointProps(record)
      const chapters = record.chapters?.length
        ? record.chapters
        : [{ title: signatureLine(record) }]
      const act = record.act ? manifest.acts?.find((a) => a.id === record.act) : null
      const actLabel = act ? `ACT ${act.numeral} — ${act.title?.toUpperCase()}` : `ACT ${props.actNumeral}`

      return withInterruptionBanner(
        <C6ImmersivePlayer
          accent={props.accent}
          actLabel={actLabel}
          title={props.title}
          chapterTitle={chapters[0]?.title ?? signatureLine(record)}
          chapterIndex={audio.progress?.chapterCount ? audio.progress.chapterIndex : 0}
          chapterCount={audio.progress?.chapterCount || Math.max(chapters.length, 1)}
          photo={props.photo}
          transcript={record.transcriptPreview ?? signatureLine(record)}
          narrationPlaying={audio.narrationPlaying}
          currentTime={audio.progress?.currentTime ?? 0}
          duration={audio.progress?.duration ?? 0}
          initialTab={storyViewRef.current}
          onTogglePlay={() => audio.toggleNarration()}
          onSkipBack={() => audio.skipNarration(-15)}
          onSkipForward={() => audio.skipNarration(15)}
          onSeek={(seconds) => audio.seekNarration(seconds)}
          onSelectChapter={(i) => audio.jumpToChapter(i)}
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
      const props = redesignWaypointProps(step.record)
      return withInterruptionBanner(
        <div style={{ height: '100%', background: T.obsidian }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${props.photo})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.35)',
            }}
          />
        </div>
      )
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
          subtitle={formatDistanceToNext(geo.distance) ?? 'almost there'}
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
      return withInterruptionBanner(
        <C2Walking
          {...props}
          distanceM={geo.distance}
          onSimulateArrival={null}
          onPause={() => transition(JOURNEY_STATES.PAUSED)}
          onContinue={!audio.narrationPlaying ? handleTransitContinue : null}
          continueLabel="Continue"
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
          distanceM={geo.distance}
          onSimulateArrival={handleSimulateArrival}
          onPause={() => transition(JOURNEY_STATES.PAUSED)}
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
        onSimulateArrival={handleSimulateArrival}
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
