import { Suspense, useMemo } from 'react'
import { lazyWithRecovery } from '../../utils/lazyWithRecovery.js'
import { buildManifestTour, buildMapStopsFromManifest } from '../../content/mapStops.js'

const TourMap = lazyWithRecovery(() => import('../../components/TourMap.jsx'), 'map')

function MapFallback() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#16130F',
        display: 'grid',
        placeItems: 'center',
        color: '#706C65',
        fontSize: 13,
      }}
    >
      Map loading…
    </div>
  )
}

/**
 * Full-route map preview - all stops visible, fit to Rome bounds.
 * Used in first-tour onboarding before the walk begins.
 */
export default function TourRouteOverviewMap({ manifest, context }) {
  const tour = useMemo(
    () => (manifest ? buildManifestTour(manifest, context.path) : null),
    [manifest, context.path],
  )

  const stops = useMemo(
    () =>
      manifest
        ? buildMapStopsFromManifest(manifest, {
            path: context.path,
            sequenceIndex: 0,
            completedWaypointIds: [],
            promotedOptionalIds: context.promotedOptionalIds,
          })
        : [],
    [manifest, context.path, context.promotedOptionalIds],
  )

  if (!tour || !stops.length) {
    return <MapFallback />
  }

  return (
    <Suspense fallback={<MapFallback />}>
      <TourMap
        tour={tour}
        stops={stops}
        activeTargetId={stops[0]?.id ?? null}
        selectedStopId={null}
        activeLeg={null}
        transitLegActive={false}
        geofenceThresholdM={40}
        userPos={null}
        state="OVERVIEW"
        distance={null}
        minimalUI={false}
        walkingCompanionUI={false}
        fillContainer
      />
    </Suspense>
  )
}
