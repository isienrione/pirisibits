import { Suspense, useEffect, useMemo, useState } from 'react'
import { lazyWithRecovery } from '../../utils/lazyWithRecovery.js'
import {
  buildManifestTour,
  buildMapStopsFromManifest,
  resolveActiveMapLeg,
} from '../../content/mapStops.js'
import { resolveCurrentPosition } from '../../lib/startFromNearestStop.js'
import { T, F } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'

const TourMap = lazyWithRecovery(() => import('../../components/TourMap.jsx'), 'map')

function MapFallback({ label }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: T.charcoal,
        display: 'grid',
        placeItems: 'center',
        color: T.muted,
        fontFamily: F.body,
        fontSize: 13,
      }}
    >
      {label}
    </div>
  )
}

/**
 * Compact route peek for Home — highlights the active stop and, when available,
 * the traveler's GPS pin.
 */
export default function HomeMapPeek({ manifest, context }) {
  const t = useT()
  const [userPos, setUserPos] = useState(null)

  useEffect(() => {
    let cancelled = false
    void resolveCurrentPosition({ timeoutMs: 8000 }).then((pos) => {
      if (!cancelled) setUserPos(pos)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const tour = useMemo(
    () => (manifest ? buildManifestTour(manifest, context.path) : null),
    [manifest, context.path],
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
    ],
  )

  const { activeTargetId, activeLeg, transitLegActive } = useMemo(
    () =>
      manifest
        ? resolveActiveMapLeg(
            manifest,
            context.path,
            context.currentSequenceIndex,
            context.promotedOptionalIds,
          )
        : { activeTargetId: null, activeLeg: null, transitLegActive: false },
    [manifest, context.path, context.currentSequenceIndex, context.promotedOptionalIds],
  )

  if (!tour || !stops.length) {
    return <MapFallback label={t('home.map.loading')} />
  }

  return (
    <Suspense fallback={<MapFallback label={t('home.map.loading')} />}>
      <TourMap
        tour={tour}
        stops={stops}
        activeTargetId={activeTargetId}
        selectedStopId={activeTargetId}
        activeLeg={activeLeg}
        transitLegActive={transitLegActive}
        geofenceThresholdM={40}
        userPos={userPos}
        state={userPos ? 'WALKING' : 'OVERVIEW'}
        distance={null}
        minimalUI
        walkingCompanionUI={false}
        fillContainer
      />
    </Suspense>
  )
}
