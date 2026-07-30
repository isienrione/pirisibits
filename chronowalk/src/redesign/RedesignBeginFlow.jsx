import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { JOURNEY_PACE, getPaceOption, getDefaultPace } from '../data/romePacing.js'
import {
  getPaceOptionsForPurchasedTier,
  paceIdForPurchaseTier,
  readPurchasedTier,
  shouldShowPaceModePicker,
} from '../lib/pendingPurchase.js'
import { clearAppEntryComplete, isAppEntryComplete } from '../lib/appEntry.js'
import { requestLocationAccess } from '../lib/locationAccess.js'
import { track, TRACK_EVENTS } from '../lib/track.js'
import { useJourneyStep } from '../hooks/useJourneyStep.js'
import { useV2Journey, useTourManifest } from '../hooks/useV2Journey.js'
import { titleForWaypoint } from './lib/waypointPresentation.js'
import { findSequenceIndexForWaypoint, getTourWaypointIds } from '../content/myTourPlan.js'
import { applyReplayOnboardingFromSearch, shouldShowTourRoutePreview } from '../utils/tourOnboarding.js'
import TourRoutePreviewScreen from './ui/TourRoutePreviewScreen.jsx'
import B3PermissionsPrimer from './screens/B3PermissionsPrimer.jsx'
import B4PaceSelector from './screens/B4PaceSelector.jsx'
import B5OwnPaceStopPicker from './screens/B5OwnPaceStopPicker.jsx'
import C8dResume from './screens/C8dResume.jsx'

const ETERNA_MODE_SUBTITLE =
  'Roma Eterna includes every route mode. Start with the full walk, just the centro storico, just the Colosseum and Forum, or hand-pick stops to match your day. Colored dots show which acts sit in each tour - choose one to continue.'

const ETERNA_MODE_FOOTER =
  'You can change your mind later. Nothing expires.'

function initialBeginStep(isResumable, showModePicker, showRoutePreview) {
  if (isResumable) return 'resume'
  if (showModePicker) return 'pace'
  // Single-pack buyers skip the mode picker and go straight to map / location.
  return showRoutePreview ? 'mapPreview' : 'location'
}

function resolveInitialPace(contextPace) {
  const purchasedPace = paceIdForPurchaseTier(readPurchasedTier())
  if (purchasedPace) return purchasedPace
  return contextPace ?? getDefaultPace()
}

export default function RedesignBeginFlow() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { begin, resume, reset, isResumable, context, setCustomWaypointIds, setJourneyPace } =
    useV2Journey()
  const { manifest, loading } = useTourManifest()
  const step = useJourneyStep(
    manifest,
    context.path,
    context.currentSequenceIndex,
    context.promotedOptionalIds,
  )
  const purchasedTier = useMemo(() => readPurchasedTier(), [])
  const showModePicker = shouldShowPaceModePicker(purchasedTier)
  const paceOptions = useMemo(
    () => getPaceOptionsForPurchasedTier(purchasedTier),
    [purchasedTier],
  )
  const needsAppEntry = !isAppEntryComplete() && !isResumable
  const showRoutePreview = shouldShowTourRoutePreview(context)
  const [stepName, setStepName] = useState(() =>
    initialBeginStep(isResumable, showModePicker, showRoutePreview),
  )
  const [selectedPace, setSelectedPace] = useState(() => resolveInitialPace(context.pace))
  const [ownPaceStops, setOwnPaceStops] = useState(() => context.customWaypointIds ?? [])
  const [busy, setBusy] = useState(false)

  const previewContext = useMemo(
    () => ({
      ...context,
      pace: selectedPace,
      customWaypointIds: selectedPace === JOURNEY_PACE.OWN ? ownPaceStops : context.customWaypointIds,
    }),
    [context, selectedPace, ownPaceStops],
  )

  // Single-pack / non-Eterna: lock the purchased route and skip the picker.
  useEffect(() => {
    if (showModePicker || isResumable) return
    setJourneyPace(selectedPace)
  }, [showModePicker, isResumable, selectedPace, setJourneyPace])

  // If we landed on 'pace' without Eterna (e.g. start fresh from resume), skip ahead.
  useEffect(() => {
    if (stepName !== 'pace' || showModePicker) return
    setJourneyPace(selectedPace)
    setStepName(showRoutePreview ? 'mapPreview' : 'location')
  }, [stepName, showModePicker, selectedPace, showRoutePreview, setJourneyPace])

  useEffect(() => {
    const { replay, fresh } = applyReplayOnboardingFromSearch(searchParams.toString())
    if (!replay) return

    if (fresh) {
      reset()
      setStepName(showModePicker ? 'pace' : showRoutePreview ? 'mapPreview' : 'location')
    } else if (isResumable) {
      setStepName('resume')
    } else {
      setStepName(showModePicker ? 'pace' : showRoutePreview ? 'mapPreview' : 'location')
    }

    if (searchParams.has('replayOnboarding') || searchParams.has('fresh')) {
      const next = new URLSearchParams(searchParams)
      next.delete('replayOnboarding')
      next.delete('fresh')
      setSearchParams(next, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  const advanceAfterPaceSelection = () => {
    if (selectedPace === JOURNEY_PACE.OWN) {
      setStepName('pickStops')
      return
    }
    setStepName(showRoutePreview ? 'mapPreview' : 'location')
  }

  const advanceAfterOwnPaceSelection = () => {
    setCustomWaypointIds(ownPaceStops)
    setStepName(showRoutePreview ? 'mapPreview' : 'location')
  }

  const startJourney = () => {
    const tourIds = manifest ? getTourWaypointIds(manifest, previewContext) : []
    const firstId = tourIds[0]
    const sequenceIndex =
      manifest && firstId
        ? Math.max(
            0,
            findSequenceIndexForWaypoint(manifest, firstId, context.path, context.promotedOptionalIds),
          )
        : 0

    begin({
      pace: selectedPace,
      path: context.path,
      sequenceIndex,
      customWaypointIds: selectedPace === JOURNEY_PACE.OWN ? ownPaceStops : null,
    })
    track(TRACK_EVENTS.JOURNEY_BEGIN, { pace: selectedPace, waypoint_index: sequenceIndex })
    navigate('/journey', { replace: true })
  }

  const handleEnableLocation = async () => {
    setBusy(true)
    const result = await requestLocationAccess()
    setBusy(false)
    if (result === 'granted') {
      startJourney()
      return
    }
    track(TRACK_EVENTS.GPS_FALLBACK_USED, { source: 'begin_flow', result })
    startJourney()
  }

  const handlePaceContinue = () => {
    setJourneyPace(selectedPace)
    advanceAfterPaceSelection()
  }

  if (needsAppEntry) {
    return <Navigate to="/setup" replace />
  }

  if (stepName === 'mapPreview') {
    return (
      <TourRoutePreviewScreen
        manifest={manifest}
        loading={loading}
        context={previewContext}
        continueLabel="Enable location & begin"
        footerNote="Next you'll enable location - then the guided tutorial begins at your first stop."
        onContinue={() => setStepName('location')}
      />
    )
  }

  if (stepName === 'resume') {
    const resumeLabel = step?.type === 'waypoint' && step.record
      ? `Pick up at ${titleForWaypoint(step.record)}`
      : 'Continue your walk'
    return (
      <div className="redesign-app-shell">
        <C8dResume
          resumeLabel={resumeLabel}
          onContinue={() => {
            resume()
            track(TRACK_EVENTS.RESUME, { source: 'begin_flow' })
            navigate('/journey', { replace: true })
          }}
          onStartFresh={() => {
            reset()
            // Fresh walkers should see offline + Home Screen prepare before GPS.
            clearAppEntryComplete()
            navigate('/setup', { replace: true })
          }}
        />
      </div>
    )
  }

  if (stepName === 'pickStops') {
    return (
      <div className="redesign-app-shell">
        <B5OwnPaceStopPicker
          manifest={manifest}
          context={{ ...context, pace: JOURNEY_PACE.OWN }}
          selectedIds={ownPaceStops}
          onChangeSelected={setOwnPaceStops}
          onBack={() => setStepName('pace')}
          onContinue={advanceAfterOwnPaceSelection}
        />
      </div>
    )
  }

  if (stepName === 'location') {
    return (
      <div className="redesign-app-shell">
        <B3PermissionsPrimer
          paceTitle={getPaceOption(selectedPace)?.title}
          busy={busy}
          onEnable={handleEnableLocation}
          onSkip={startJourney}
        />
      </div>
    )
  }

  return (
    <div className="redesign-app-shell" data-testid="app-begin-home">
      <B4PaceSelector
        options={paceOptions}
        selectedPace={selectedPace}
        onSelectPace={setSelectedPace}
        onContinue={handlePaceContinue}
        showPrices={false}
        eyebrow="YOUR WALK"
        title={
          <>
            Choose how
            <br />
            you walk Rome.
          </>
        }
        subtitle={ETERNA_MODE_SUBTITLE}
        footerNote={ETERNA_MODE_FOOTER}
      />
    </div>
  )
}
