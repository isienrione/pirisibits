import { useMemo, useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TourMap from '../TourMap.jsx'
import DirectionsNavHud from '../DirectionsNavHud.jsx'
import {
  buildManifestTour,
  buildMapStopsFromManifest,
  getMapConfidenceLayers,
  resolveActiveMapLeg,
} from '../../content/mapStops.js'
import { isCompanionTrackingState } from '../../content/companionGuidance.js'
import { JOURNEY_STATES } from '../../state/journey.js'
import { isDevPanelEnabled, isDebugMap } from '../../config/env.js'
import { useJourneyGeoDebugOptions } from '../../hooks/useJourneyGeoDebug.js'
import { DEV_TOOLS_CHANGED, readDevSimulateGps } from '../dev/devTools.js'
import { useV2Journey, useTourManifest } from '../../hooks/useV2Journey.js'
import { useJourneyGeo } from '../../hooks/useJourneyGeo.js'
import { useWalkingCompanion } from '../../hooks/useWalkingCompanion.js'
import { useJourneyStep } from '../../hooks/useJourneyStep.js'
import { useWalkingDirections } from '../../hooks/useWalkingDirections.js'
import { resolveWalkingStepProgress } from '../../utils/walkingStepProgress.js'
import { toWalkCardModel } from '../../content/stopPresentation.js'
import { resolveMapBottomCard, MAP_BOTTOM_CTA } from '../../content/mapBottomCard.js'
import MapBottomCard from '../../redesign/ui/MapBottomCard.jsx'
import { ShellWalkCard } from '../../shell'

function ConfidenceChip({ label, active, compact = false }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: compact ? '5px 9px' : '6px 10px',
        borderRadius: 999,
        border: `1px solid color-mix(in srgb, var(--warm-white) ${active ? '22%' : '10%'}, transparent)`,
        background: active
          ? 'color-mix(in srgb, var(--verdigris) 18%, var(--ink))'
          : 'color-mix(in srgb, var(--ink) 72%, transparent)',
        color: active ? 'var(--warm-white)' : 'var(--muted-warm)',
        fontSize: compact ? '0.68rem' : 'var(--fs-meta)',
        fontWeight: 600,
      }}
    >
      {!compact ? (
        <span
          aria-hidden="true"
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: active ? 'var(--verdigris)' : 'color-mix(in srgb, var(--muted-warm) 70%, transparent)',
          }}
        />
      ) : null}
      {label}
    </span>
  )
}

export default function MapScreen({ variant = 'legacy' }) {
  const navigate = useNavigate()
  const { state, context, transition } = useV2Journey()
  const { manifest, loading, error } = useTourManifest()
  const step = useJourneyStep(
    manifest,
    context.path,
    context.currentSequenceIndex,
    context.promotedOptionalIds
  )
  const [directionsOpen, setDirectionsOpen] = useState(false)
  const [recenterKey, setRecenterKey] = useState(0)
  const [devSimulateGps, setDevSimulateGps] = useState(false)
  const [selectedStopId, setSelectedStopId] = useState(null)
  const isRedesign = variant === 'redesign'

  useEffect(() => {
    if (!isDevPanelEnabled()) return undefined
    const syncDevGps = () => setDevSimulateGps(readDevSimulateGps())
    syncDevGps()
    window.addEventListener(DEV_TOOLS_CHANGED, syncDevGps)
    return () => window.removeEventListener(DEV_TOOLS_CHANGED, syncDevGps)
  }, [])

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

  const tour = useMemo(
    () => (manifest ? buildManifestTour(manifest, context.path) : null),
    [manifest, context.path]
  )

  const stops = useMemo(
    () =>
      manifest
        ? buildMapStopsFromManifest(manifest, {
            path: context.path,
            sequenceIndex: context.currentSequenceIndex,
            completedWaypointIds: context.completedWaypointIds,
            promotedOptionalIds: context.promotedOptionalIds,
          })
        : [],
    [
      manifest,
      context.path,
      context.currentSequenceIndex,
      context.completedWaypointIds,
      context.promotedOptionalIds,
    ]
  )

  const { activeTargetId, activeLeg, transitLegActive } = useMemo(
    () =>
      manifest
        ? resolveActiveMapLeg(
            manifest,
            context.path,
            context.currentSequenceIndex,
            context.promotedOptionalIds
          )
        : { activeTargetId: null, activeLeg: null, transitLegActive: false },
    [manifest, context.path, context.currentSequenceIndex, context.promotedOptionalIds]
  )

  useEffect(() => {
    if (activeTargetId) setSelectedStopId(activeTargetId)
  }, [activeTargetId])

  const activeStop = stops.find((stop) => stop.id === activeTargetId) ?? null
  const selectedStop = stops.find((stop) => stop.id === selectedStopId) ?? activeStop
  const walkCard = manifest && activeStop ? toWalkCardModel(manifest, activeStop, geo.distance) : null

  const bottomCard = resolveMapBottomCard({
    journeyState: state,
    step,
    activeStop,
    distanceM: geo.distance,
    companionMode: companion.mode,
    sequenceIndex: context.currentSequenceIndex,
    completedWaypointIds: context.completedWaypointIds,
    directionsOpen,
  })

  const handleManualArrival = useCallback(() => {
    if (!step?.record || step.type !== 'waypoint') return
    if (state !== JOURNEY_STATES.WALKING && state !== JOURNEY_STATES.APPROACHING) return
    if (isRedesign) {
      transition(JOURNEY_STATES.STORY)
      navigate('/journey')
      return
    }
    transition(JOURNEY_STATES.ARRIVED)
  }, [isRedesign, navigate, state, step, transition])

  const handleRecenter = useCallback(() => {
    geo.retryLocation?.()
    setRecenterKey((key) => key + 1)
  }, [geo])

  const handleBottomCardCta = useCallback(() => {
    if (!bottomCard) return

    switch (bottomCard.ctaAction) {
      case MAP_BOTTOM_CTA.GET_DIRECTIONS:
      case MAP_BOTTOM_CTA.OPEN_DIRECTIONS:
        setDirectionsOpen(true)
        break
      case MAP_BOTTOM_CTA.MANUAL_ARRIVAL:
        handleManualArrival()
        break
      case MAP_BOTTOM_CTA.OPEN_STORY:
        transition(JOURNEY_STATES.STORY)
        navigate('/journey')
        break
      case MAP_BOTTOM_CTA.WALK_TO_NEXT:
        if (step?.targetWaypoint?.id) {
          setSelectedStopId(step.targetWaypoint.id)
        } else if (activeTargetId) {
          setSelectedStopId(activeTargetId)
        }
        transition(JOURNEY_STATES.WALKING)
        setDirectionsOpen(true)
        break
      case MAP_BOTTOM_CTA.BACK_TO_ROUTE:
        if (activeTargetId) setSelectedStopId(activeTargetId)
        handleRecenter()
        setDirectionsOpen(true)
        break
      default:
        break
    }
  }, [
    activeTargetId,
    bottomCard,
    handleManualArrival,
    handleRecenter,
    navigate,
    step?.targetWaypoint?.id,
    transition,
  ])

  const directionsDestination = directionsOpen ? selectedStop?.landmark ?? null : null

  const {
    directions,
    loading: directionsLoading,
    error: directionsError,
    routingOrigin,
    routingDestination,
  } = useWalkingDirections({
    origin: geo.position,
    destination: directionsDestination,
    enabled: directionsOpen && Boolean(selectedStop),
  })

  const walkingStepProgress = useMemo(
    () =>
      resolveWalkingStepProgress({
        userPos: geo.position,
        steps: directions?.steps ?? [],
        geometry: directions?.geometry,
        totalDistanceM: directions?.distanceM ?? 0,
      }),
    [geo.position, directions?.steps, directions?.geometry, directions?.distanceM]
  )

  const focusTarget = useMemo(() => {
    if (!geo.position?.lat || !geo.position?.lng) return null
    return {
      lat: geo.position.lat,
      lng: geo.position.lng,
      key: recenterKey,
    }
  }, [geo.position?.lat, geo.position?.lng, recenterKey])

  const confidenceLayers = getMapConfidenceLayers({
    locationStatus: geo.locationStatus,
    activeStop,
    distance: geo.distance,
    transitLegActive,
    companionMode: companion.mode,
  })

  const alertLayers = confidenceLayers.filter(
    (layer) => layer.id === 'route_drift' || layer.id === 'observing',
  )
  const visibleConfidenceLayers = isRedesign ? alertLayers : confidenceLayers

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--obsidian)',
          color: 'var(--warm-white)',
        }}
      >
        Preparing map…
      </main>
    )
  }

  if (error || !manifest || !tour) {
    return (
      <main
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: 'var(--edge)',
          background: 'var(--obsidian)',
          color: 'var(--warm-white)',
        }}
      >
        {error?.message ?? 'Map unavailable'}
      </main>
    )
  }

  const handleOpenDirections = () => {
    setDirectionsOpen(true)
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: isRedesign ? '100%' : '100dvh',
        height: isRedesign ? '100%' : undefined,
        background: 'var(--obsidian)',
      }}
    >
      <TourMap
        tour={tour}
        stops={stops}
        activeTargetId={activeTargetId}
        selectedStopId={selectedStopId}
        activeLeg={activeLeg}
        transitLegActive={transitLegActive}
        geofenceThresholdM={activeStop?.arrivalRadiusM ?? 40}
        userPos={geo.position}
        state={geo.state}
        distance={geo.distance}
        arrivalPulseActive={geo.insideGeofence}
        debugMapEnabled={isDebugMap()}
        minimalUI={isRedesign}
        directionsModeActive={directionsOpen}
        directionsGeometry={directions?.geometry ?? null}
        focusTarget={focusTarget}
        onStopSelect={(stopId) => setSelectedStopId(stopId)}
      />

      {isRedesign ? (
        <>
          <div
            style={{
              position: 'absolute',
              top: 'max(10px, env(safe-area-inset-top))',
              left: 12,
              right: 12,
              zIndex: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              pointerEvents: 'none',
            }}
          >
            <Link
              to="/journey"
              style={{
                pointerEvents: 'auto',
                padding: '9px 14px',
                borderRadius: 999,
                background: 'color-mix(in srgb, var(--ink) 82%, transparent)',
                color: 'var(--warm-white)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid color-mix(in srgb, var(--warm-white) 10%, transparent)',
                backdropFilter: 'blur(8px)',
              }}
            >
              ← Walk
            </Link>
            <button
              type="button"
              onClick={handleRecenter}
              aria-label="Recenter map"
              style={{
                pointerEvents: 'auto',
                width: 38,
                height: 38,
                borderRadius: 19,
                border: '1px solid color-mix(in srgb, var(--warm-white) 10%, transparent)',
                background: 'color-mix(in srgb, var(--ink) 82%, transparent)',
                color: 'var(--warm-white)',
                fontSize: 18,
                lineHeight: 1,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}
            >
              ◎
            </button>
          </div>

          {visibleConfidenceLayers.length > 0 ? (
            <div
              style={{
                position: 'absolute',
                top: 'max(56px, calc(env(safe-area-inset-top) + 46px))',
                left: 12,
                right: 12,
                zIndex: 40,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                pointerEvents: 'none',
              }}
            >
              {visibleConfidenceLayers.map((layer) => (
                <ConfidenceChip key={layer.id} label={layer.label} active={layer.active} compact />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 'max(12px, env(safe-area-inset-top))',
            left: 12,
            right: 12,
            zIndex: 40,
            display: 'grid',
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <Link
              to="/stops"
              style={{
                padding: '10px 14px',
                borderRadius: 999,
                background: 'color-mix(in srgb, var(--ink) 88%, transparent)',
                color: 'var(--warm-white)',
                textDecoration: 'none',
                fontSize: 'var(--fs-secondary)',
                fontWeight: 600,
                border: '1px solid color-mix(in srgb, var(--warm-white) 12%, transparent)',
              }}
            >
              All stops
            </Link>

            <Link
              to="/journey"
              style={{
                padding: '10px 14px',
                borderRadius: 999,
                background: 'color-mix(in srgb, var(--ink) 88%, transparent)',
                color: 'var(--warm-white)',
                textDecoration: 'none',
                fontSize: 'var(--fs-secondary)',
                fontWeight: 600,
                border: '1px solid color-mix(in srgb, var(--warm-white) 12%, transparent)',
              }}
            >
              Back to walk
            </Link>

            {selectedStop && !directionsOpen ? (
              <button
                type="button"
                onClick={handleOpenDirections}
                style={{
                  padding: '10px 14px',
                  borderRadius: 999,
                  border: 'none',
                  background: 'var(--accent)',
                  color: 'var(--bone)',
                  fontSize: 'var(--fs-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Walk there
              </button>
            ) : null}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {visibleConfidenceLayers.map((layer) => (
              <ConfidenceChip key={layer.id} label={layer.label} active={layer.active} />
            ))}
          </div>
        </div>
      )}

      {!directionsOpen && bottomCard ? (
        isRedesign ? (
          <div
            style={{
              position: 'absolute',
              left: 12,
              right: 12,
              zIndex: 40,
              bottom: 'max(4.75rem, calc(env(safe-area-inset-bottom) + 3.75rem))',
            }}
          >
            <MapBottomCard
              title={bottomCard.title}
              meta={bottomCard.meta}
              ctaLabel={bottomCard.ctaLabel}
              imageUrl={walkCard?.imageUrl ?? null}
              onCta={handleBottomCardCta}
            />
          </div>
        ) : (
          <div
            className="absolute inset-x-3 z-40"
            style={{ bottom: 'max(5.5rem, calc(env(safe-area-inset-bottom) + 4.5rem))' }}
          >
            <ShellWalkCard
              title={bottomCard.title}
              subtitle={bottomCard.meta}
              imageUrl={walkCard?.imageUrl ?? null}
              eyebrow=""
              onContinue={handleBottomCardCta}
              continueLabel={bottomCard.ctaLabel}
            />
          </div>
        )
      ) : null}

      {directionsOpen ? (
        <DirectionsNavHud
          destinationTitle={activeStop?.title ?? 'Destination'}
          directions={directions}
          loading={directionsLoading}
          error={directionsError}
          currentStepIndex={walkingStepProgress.currentStepIndex}
          routeProgress={walkingStepProgress.routeProgress}
          locationStatus={geo.locationStatus}
          routingOrigin={routingOrigin}
          routingDestination={routingDestination}
          onClose={() => setDirectionsOpen(false)}
          onRecenter={handleRecenter}
          hasBottomNav={false}
        />
      ) : null}
    </div>
  )
}
