import { useMemo } from 'react'
import { buildTourRoadmap } from '../../content/tourRoadmap.js'
import { getTourProductTruth } from '../../content/tourProductTruth.js'
import { getWaypoint } from '../../content/manifest.js'
import { T, F } from '../tokens.js'
import { photoForWaypoint, titleForWaypoint } from '../lib/waypointPresentation.js'
import { Eyebrow } from './index.js'
import TourRouteOverviewMap from './TourRouteOverviewMap.jsx'

/**
 * Shared map + ordered stop list for tour route previews.
 */
export default function TourRoutePreviewPanel({
  manifest,
  loading = false,
  context,
  mapHeight = 260,
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
    <>
      <div
        style={{
          padding: 'max(48px, calc(env(safe-area-inset-top) + 20px)) 24px 12px',
          flexShrink: 0,
        }}
      >
        <Eyebrow color={T.ember}>{cityLabel.toUpperCase()}</Eyebrow>
        <h1
          style={{
            fontFamily: F.display,
            fontSize: 34,
            fontWeight: 300,
            color: T.ink,
            lineHeight: 1.1,
            margin: '12px 0 8px',
          }}
        >
          {stopCount} stops · your route
        </h1>
        <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.6, margin: 0 }}>
          {firstStopTitle
            ? `You'll begin at ${firstStopTitle} and walk through Rome in order — narration unlocks as you arrive at each place.`
            : 'Walk Rome in order — narration unlocks as you arrive at each place.'}
        </p>
      </div>

      <div
        style={{
          flexShrink: 0,
          margin: '0 16px 12px',
          height: mapHeight,
          borderRadius: 14,
          overflow: 'hidden',
          border: `1px solid ${T.muted}33`,
          boxShadow: `0 8px 32px ${T.ink}18`,
        }}
      >
        {loading || !manifest ? (
          <div
            style={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              background: T.obsidian,
              color: T.muted,
              fontSize: 13,
            }}
          >
            Loading map…
          </div>
        ) : (
          <TourRouteOverviewMap manifest={manifest} context={context ?? { path: 'a' }} />
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          padding: '4px 24px 12px',
        }}
      >
        {loading ? (
          <p style={{ color: T.muted }}>Loading stops…</p>
        ) : (
          stops.map((stop, index) => {
            const waypoint = getWaypoint(manifest, stop.id)
            const photo = photoForWaypoint(waypoint)
            const isFirst = index === 0

            return (
              <div
                key={stop.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 0',
                  borderBottom: index < stops.length - 1 ? `1px solid ${T.muted}22` : 'none',
                  opacity: isFirst ? 1 : 0.72,
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0,
                    background: isFirst ? T.ember : `${T.muted}22`,
                    color: isFirst ? T.obsidian : T.muted,
                  }}
                >
                  {index + 1}
                </span>
                {photo ? (
                  <img
                    src={photo}
                    alt=""
                    style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: `${T.muted}22` }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: isFirst ? 600 : 500,
                      color: T.ink,
                      margin: 0,
                      lineHeight: 1.25,
                    }}
                  >
                    {titleForWaypoint(waypoint)}
                  </p>
                  {stop.legToNext && !stop.isLast ? (
                    <p
                      style={{
                        fontSize: 11,
                        color: T.muted,
                        margin: '3px 0 0',
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    >
                      {stop.legToNext}
                    </p>
                  ) : null}
                </div>
                {isFirst ? (
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: T.ember,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    Start
                  </span>
                ) : null}
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
