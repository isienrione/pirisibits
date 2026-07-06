import { useMemo, useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
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
import { ShellWalkCard } from '../../shell'

function ConfidenceChip({ label, active }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 999,
        border: `1px solid color-mix(in srgb, var(--warm-white) ${active ? '22%' : '10%'}, transparent)`,
        background: active
          ? 'color-mix(in srgb, var(--verdigris) 18%, var(--ink))'
          : 'color-mix(in srgb, var(--ink) 72%, transparent)',
        color: active ? 'var(--warm-white)' : 'var(--muted-warm)',
        fontSize: 'var(--fs-meta)',
        fontWeight: 600,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: active ? 'var(--verdigris)' : 'color-mix(in srgb, var(--muted-warm) 70%, transparent)',
        }}
      />
      {label}
    </span>
  )
}

export default function MapScreen() {
  const navigate = useNavigate()
  const { state, context } = useV2Journey()
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

  useEffect(() => {
    if (!isDevPanelEnabled()) return undefined
    const syncDevGps = () => setDevSimulateGps(readDevSimulateGps())
    syncDevGps()
    window.addEventListener(DEV_TOOLS_CHANGED, syncDevGps)
    return () => window.removeEventListener(DEV_TOOLS_CHANGED, syncDevGps)
  }, [])

  useEffect(() => {
    if (activeTargetId) setSelectedStopId(activeTargetId)
  }, [activeTargetId])

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

  const activeStop = stops.find((stop) => stop.id === activeTargetId) ?? null
  const selectedStop = stops.find((stop) => stop.id === selectedStopId) ?? activeStop
  const walkCard = manifest && selectedStop ? toWalkCardModel(manifest, selectedStop, geo.distance) : null

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

  if (state === JOURNEY_STATES.IDLE && import.meta.env.VITE_FIGMA_REDESIGN === 'false') {
    return <Navigate to="/begin" replace />
  }

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

  const handleRecenter = () => {
    geo.retryLocation?.()
    setRecenterKey((key) => key + 1)
  }

  return (
    <div style={{ position: 'relative', minHeight: '100dvh', background: 'var(--obsidian)' }}>
      <TourMap
        tour={tour}
        stops={stops}
        activeTargetId={activeTargetId}
        activeLeg={activeLeg}
        transitLegActive={transitLegActive}
        geofenceThresholdM={activeStop?.arrivalRadiusM ?? 40}
        userPos={geo.position}
        state={geo.state}
        distance={geo.distance}
        arrivalPulseActive={geo.insideGeofence}
        debugMapEnabled={isDebugMap()}
        directionsModeActive={directionsOpen}
        directionsGeometry={directions?.geometry ?? null}
        focusTarget={focusTarget}
        onStopSelect={(stopId) => setSelectedStopId(stopId)}
      />

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
          {confidenceLayers.map((layer) => (
            <ConfidenceChip key={layer.id} label={layer.label} active={layer.active} />
          ))}
        </div>
      </div>

      {!directionsOpen && walkCard ? (
        <div
          className="absolute inset-x-3 z-40"
          style={{ bottom: 'max(5.5rem, calc(env(safe-area-inset-bottom) + 4.5rem))' }}
        >
          <ShellWalkCard
            title={walkCard.title}
            distanceM={walkCard.distanceM}
            imageUrl={walkCard.imageUrl}
            eyebrow={selectedStop?.id === activeTargetId ? 'Next stop' : 'Selected stop'}
            onContinue={() => navigate(`/journal/${selectedStop.id}`)}
            continueLabel="Open stop card"
          />
        </div>
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
