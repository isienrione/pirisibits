import { useMemo } from 'react'
import { buildTourRoadmap } from '../../content/tourRoadmap.js'
import { getTourProductTruth } from '../../content/tourProductTruth.js'
import { getWaypoint } from '../../content/manifest.js'
import { T, F } from '../tokens.js'
import { titleForWaypoint } from '../lib/waypointPresentation.js'
import { Eyebrow } from './index.js'
import TourRouteIllustration from './TourRouteIllustration.jsx'

/**
 * Shared route preview — illustrated roadmap dominates the screen.
 */
export default function TourRoutePreviewPanel({
  manifest,
  loading = false,
  context,
  cityLabel = 'Rome, Italy',
}) {
  const stops = useMemo(
    () =>
      buildTourRoadmap(manifest, {
        path: context?.path ?? 'a',
        sequenceIndex: 0,
        completedWaypointIds: [],
      }),
    [manifest, context?.path],
  )

  const stopCount = useMemo(() => {
    if (!manifest) return 0
    return getTourProductTruth(manifest, {
      path: context?.path ?? 'a',
      pace: context?.pace,
      promotedOptionalIds: context?.promotedOptionalIds ?? [],
      customWaypointIds: context?.customWaypointIds,
    }).visitStopCount
  }, [manifest, context?.path, context?.pace, context?.promotedOptionalIds, context?.customWaypointIds])

  const firstStopTitle = stops[0] ? titleForWaypoint(getWaypoint(manifest, stops[0].id)) : null

  return (
    <div className="cw-route-preview-panel">
      <div className="cw-route-preview-panel__header">
        <Eyebrow color={T.ember}>{cityLabel.toUpperCase()}</Eyebrow>
        <h1
          className="cw-route-preview-panel__title"
          style={{ fontFamily: F.display, color: T.ink }}
        >
          {stopCount} stops · your route
        </h1>
        {firstStopTitle ? (
          <p className="cw-route-preview-panel__subtitle" style={{ color: T.muted }}>
            Starting at {firstStopTitle} — scroll the map to see every stop in order.
          </p>
        ) : null}
      </div>

      <div className="cw-route-preview-panel__hero">
        {loading || !manifest ? (
          <div className="cw-route-preview-panel__loading" style={{ color: T.muted }}>
            Loading route…
          </div>
        ) : (
          <TourRouteIllustration manifest={manifest} context={context ?? { path: 'a' }} />
        )}
      </div>
    </div>
  )
}
