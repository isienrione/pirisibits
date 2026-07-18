import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { JOURNEY_PACE, getPaceOption, getDefaultPace } from '../data/romePacing.js'
import {
  getPaceOptionsForPurchasedTier,
  paceIdForPurchaseTier,
  readPurchasedTier,
} from '../lib/pendingPurchase.js'
import { isAppEntryComplete, packTitleForPurchasedTier } from '../lib/appEntry.js'
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

function initialBeginStep(isResumable) {
  if (isResumable) return 'resume'
  return 'pace'
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
  const packTitle = useMemo(() => packTitleForPurchasedTier(purchasedTier), [purchasedTier])
  const paceOptions = useMemo(
    () => getPaceOptionsForPurchasedTier(purchasedTier),
    [purchasedTier],
  )
  const singlePack = paceOptions.length === 1
  const needsAppEntry = !isAppEntryComplete() && !isResumable
  const [stepName, setStepName] = useState(() => initialBeginStep(isResumable))
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

  const showRoutePreview = shouldShowTourRoutePreview(context)

  useEffect(() => {
    const { replay, fresh } = applyReplayOnboardingFromSearch(searchParams.toString())
    if (!replay) return

    if (fresh) {
      reset()
      setStepName('pace')
    } else if (isResumable) {
      setStepName('resume')
    } else {
      setStepName('pace')
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
        footerNote="Next you'll enable location — then the guided tutorial begins at your first stop."
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
            setStepName('pace')
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
        eyebrow="YOUR WALK"
        title={
          singlePack ? (
            <>
              {packTitle}
              <br />
              starts here.
            </>
          ) : (
            <>
              Choose how
              <br />
              you walk Rome.
            </>
          )
        }
        subtitle={
          singlePack
            ? 'You left the website. This is ChronoWalk — pick up your unlocked route.'
            : 'You left the website. ChronoWalk is unlocked on this phone.'
        }
      />
    </div>
  )
}
