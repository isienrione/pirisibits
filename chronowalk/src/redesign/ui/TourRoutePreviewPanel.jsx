import { useMemo } from 'react'
import { buildTourRoadmap } from '../../content/tourRoadmap.js'
import { getTourProductTruth } from '../../content/tourProductTruth.js'
import { getWaypoint } from '../../content/manifest.js'
import { T, F } from '../tokens.js'
import { titleForWaypoint } from '../lib/waypointPresentation.js'
import { Eyebrow } from './index.js'
import TourRouteIllustration from './TourRouteIllustration.jsx'

/**
 * Shared route preview — illustrated roadmap + compact summary (no Mapbox).
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
  const lastStopTitle = stops.length
    ? titleForWaypoint(getWaypoint(manifest, stops[stops.length - 1].id))
    : null

  return (
    <>
      <div
        style={{
          padding: 'max(48px, calc(env(safe-area-inset-top) + 20px)) 24px 10px',
          flexShrink: 0,
        }}
      >
        <Eyebrow color={T.ember}>{cityLabel.toUpperCase()}</Eyebrow>
        <h1
          style={{
            fontFamily: F.display,
            fontSize: 32,
            fontWeight: 300,
            color: T.ink,
            lineHeight: 1.12,
            margin: '10px 0 8px',
          }}
        >
          {stopCount} stops · your route
        </h1>
        <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.55, margin: 0 }}>
          {firstStopTitle && lastStopTitle
            ? `${firstStopTitle} → ${lastStopTitle}. Walk in order — narration unlocks at each place.`
            : 'Walk in order — narration unlocks as you arrive at each place.'}
        </p>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          padding: '0 12px 8px',
        }}
      >
        {loading || !manifest ? (
          <div
            style={{
              margin: '0 4px',
              height: 240,
              borderRadius: 16,
              display: 'grid',
              placeItems: 'center',
              background: `${T.muted}18`,
              color: T.muted,
              fontSize: 13,
            }}
          >
            Loading route…
          </div>
        ) : (
          <TourRouteIllustration manifest={manifest} context={context ?? { path: 'a' }} />
        )}
      </div>
    </>
  )
}
