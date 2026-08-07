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
import { enableLocationForTourBounded, LOCATION_PERMISSION } from '../lib/locationAccess.js'
import { track, TRACK_EVENTS } from '../lib/track.js'
import { useJourneyStep } from '../hooks/useJourneyStep.js'
import { useV2Journey, useTourManifest } from '../hooks/useV2Journey.js'
import { titleForWaypoint } from './lib/waypointPresentation.js'
import { findSequenceIndexForWaypoint, getTourWaypointIds } from '../content/myTourPlan.js'
import { applyReplayOnboardingFromSearch, shouldShowTourRoutePreview } from '../utils/tourOnboarding.js'
import { BEGIN_CHOOSE_ROUTE_PARAM } from './beginFlowParams.js'
import TourRoutePreviewScreen from './ui/TourRoutePreviewScreen.jsx'
import B3PermissionsPrimer from './screens/B3PermissionsPrimer.jsx'
import B4PaceSelector from './screens/B4PaceSelector.jsx'
import B5OwnPaceStopPicker from './screens/B5OwnPaceStopPicker.jsx'
import C8dResume from './screens/C8dResume.jsx'

const ETERNA_MODE_SUBTITLE =
  'Roma Eterna includes every route mode. Start with the full walk, just the centro storico, just the Colosseum and Forum, or hand-pick stops to match your day. Colored dots show which acts sit in each tour - choose one to continue.'

const ETERNA_MODE_FOOTER =
  'You can change your mind later. Nothing expires.'

function wantsChooseRoute(searchParams) {
  const value = searchParams?.get?.(BEGIN_CHOOSE_ROUTE_PARAM)
  return value === '1' || value === 'true'
}

function initialBeginStep(isResumable, showModePicker, showRoutePreview, forceChooseRoute) {
  // Explicit Settings entry: open the mode picker even when a walk is in progress.
  if (forceChooseRoute && showModePicker) return 'pace'
  if (isResumable) return 'resume'
  // Default begin flow skips the pace picker - Eterna buyers start on Roma Eterna.
  // Route customization lives in Settings → Change or customize route.
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
  const forceChooseRoute = wantsChooseRoute(searchParams)
  const paceOptions = useMemo(
    () => getPaceOptionsForPurchasedTier(purchasedTier),
    [purchasedTier],
  )
  const needsAppEntry = !isAppEntryComplete() && !isResumable
  const showRoutePreview = shouldShowTourRoutePreview(context)
  const [stepName, setStepName] = useState(() =>
    initialBeginStep(isResumable, showModePicker, showRoutePreview, forceChooseRoute),
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

  // Lock the purchased / selected route whenever we are not actively customizing it.
  useEffect(() => {
    if (isResumable) return
    if (stepName === 'pace' || stepName === 'pickStops') return
    setJourneyPace(selectedPace)
  }, [isResumable, stepName, selectedPace, setJourneyPace])

  // If we landed on 'pace' without unlocked modes (e.g. stale URL), skip ahead.
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
      setStepName(showRoutePreview ? 'mapPreview' : 'location')
    } else if (isResumable) {
      setStepName('resume')
    } else {
      setStepName(showRoutePreview ? 'mapPreview' : 'location')
    }

    if (searchParams.has('replayOnboarding') || searchParams.has('fresh')) {
      const next = new URLSearchParams(searchParams)
      next.delete('replayOnboarding')
      next.delete('fresh')
      setSearchParams(next, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  const clearChooseRouteParam = () => {
    if (!searchParams.has(BEGIN_CHOOSE_ROUTE_PARAM)) return
    const next = new URLSearchParams(searchParams)
    next.delete(BEGIN_CHOOSE_ROUTE_PARAM)
    setSearchParams(next, { replace: true })
  }

  const advanceAfterPaceSelection = () => {
    clearChooseRouteParam()
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
    try {
      const result = await enableLocationForTourBounded({
        waitForFix: false,
        skipIfDeniedAlready: false,
      })
      if (result.permission !== LOCATION_PERMISSION.GRANTED) {
        track(TRACK_EVENTS.GPS_FALLBACK_USED, {
          source: 'begin_flow',
          result: result.access,
        })
      }
      // Always enter the tour after the permission attempt resolves —
      // granted without a fix is OK; denied / slow uses manual / deferred GPS.
      startJourney()
    } finally {
      setBusy(false)
    }
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
