import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  JOURNEY_PACE,
  START_MODE,
  getBeginStartModes,
  getPaceOption,
} from '../data/romePacing.js'
import {
  getEntitlementPoolPace,
  getPurchasedPackageOption,
} from '../data/purchasedPackage.js'
import { requestLocationAccess } from '../lib/locationAccess.js'
import { track, TRACK_EVENTS } from '../lib/track.js'
import { useJourneyStep } from '../hooks/useJourneyStep.js'
import { useV2Journey, useTourManifest } from '../hooks/useV2Journey.js'
import { useTourEntitlements } from '../hooks/useTourEntitlements.js'
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

export default function RedesignBeginFlow() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { begin, resume, reset, isResumable, context, setCustomWaypointIds, setJourneyPace } =
    useV2Journey()
  const { purchasedProductIds } = useTourEntitlements()
  const { manifest, loading } = useTourManifest()
  const step = useJourneyStep(
    manifest,
    context.path,
    context.currentSequenceIndex,
    context.promotedOptionalIds,
  )

  const packageOption = useMemo(
    () => getPurchasedPackageOption(purchasedProductIds),
    [purchasedProductIds],
  )
  const entitlementPace = useMemo(
    () => getEntitlementPoolPace(purchasedProductIds),
    [purchasedProductIds],
  )
  const startModes = useMemo(() => getBeginStartModes(packageOption), [packageOption])

  const [stepName, setStepName] = useState(() => initialBeginStep(isResumable))
  const [selectedStartMode, setSelectedStartMode] = useState(START_MODE.FULL)
  const [ownPaceStops, setOwnPaceStops] = useState(() => context.customWaypointIds ?? [])
  const [busy, setBusy] = useState(false)

  const selectedPace =
    selectedStartMode === START_MODE.OWN ? JOURNEY_PACE.OWN : entitlementPace

  const previewContext = useMemo(
    () => ({
      ...context,
      pace: selectedPace,
      entitlementPace,
      purchasedPace: entitlementPace,
      customWaypointIds: selectedPace === JOURNEY_PACE.OWN ? ownPaceStops : context.customWaypointIds,
    }),
    [context, selectedPace, entitlementPace, ownPaceStops],
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
    if (selectedStartMode === START_MODE.OWN) {
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
    track(TRACK_EVENTS.JOURNEY_BEGIN, {
      pace: selectedPace,
      waypoint_index: sequenceIndex,
      product_id: packageOption.productId,
      start_mode: selectedStartMode,
    })
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

  if (stepName === 'mapPreview') {
    return (
      <TourRoutePreviewScreen
        manifest={manifest}
        loading={loading}
        context={previewContext}
        continueLabel="Enable location & begin"
        footerNote="Confirm this layout, then enable location — the guided walk starts at your first stop."
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
          context={{
            ...context,
            pace: JOURNEY_PACE.OWN,
            entitlementPace,
            purchasedPace: entitlementPace,
          }}
          selectedIds={ownPaceStops}
          onChangeSelected={setOwnPaceStops}
          onBack={() => setStepName('pace')}
          onContinue={advanceAfterOwnPaceSelection}
          subtitle={`Choose from the stops included in ${packageOption.title}. Your tour roadmap builds from this list.`}
        />
      </div>
    )
  }

  if (stepName === 'location') {
    return (
      <div className="redesign-app-shell">
        <B3PermissionsPrimer
          paceTitle={
            selectedStartMode === START_MODE.OWN
              ? getPaceOption(JOURNEY_PACE.OWN)?.title
              : packageOption.title
          }
          busy={busy}
          onEnable={handleEnableLocation}
          onSkip={startJourney}
        />
      </div>
    )
  }

  return (
    <div className="redesign-app-shell">
      <B4PaceSelector
        packageOption={packageOption}
        startModes={startModes}
        selectedStartMode={selectedStartMode}
        onSelectStartMode={setSelectedStartMode}
        onContinue={handlePaceContinue}
      />
    </div>
  )
}
