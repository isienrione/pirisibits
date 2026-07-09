import { useMemo } from 'react'
import TourMap from '../TourMap.jsx'
import {
  buildManifestTour,
  buildMapStopsFromManifest,
  resolveActiveMapLeg,
} from '../../content/mapStops.js'
import { isDebugMap } from '../../config/env.js'

/**
 * Minimal Mapbox embed for in-journey screens (transit).
 * Parent must provide a bounded height (flex: 1 or explicit px).
 */
export default function JourneyInlineMap({ manifest, context, geo }) {
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

  if (!tour || !stops.length) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--bone, #F7F1E6)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--muted-warm, #706C65)',
          fontSize: 13,
        }}
      >
        Map loading…
      </div>
    )
  }

  return (
    <TourMap
      tour={tour}
      stops={stops}
      activeTargetId={activeTargetId}
      selectedStopId={activeTargetId}
      activeLeg={activeLeg}
      transitLegActive={transitLegActive}
      geofenceThresholdM={activeStop?.arrivalRadiusM ?? 40}
      userPos={geo.position}
      state={geo.state}
      distance={geo.distance}
      debugMapEnabled={isDebugMap()}
      minimalUI
      fillContainer
    />
  )
}
