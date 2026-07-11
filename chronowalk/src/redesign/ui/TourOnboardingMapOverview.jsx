import { useMemo } from 'react'
import { buildTourRoadmap } from '../../content/tourRoadmap.js'
import { getTourProductTruth } from '../../content/tourProductTruth.js'
import { getWaypoint } from '../../content/manifest.js'
import { useTourManifest, useV2Journey } from '../../hooks/useV2Journey.js'
import { T, F, SHELL_TAB_BAR_INSET } from '../tokens.js'
import { photoForWaypoint, titleForWaypoint } from '../lib/waypointPresentation.js'
import { Eyebrow, PrimaryButton } from './index.js'
import TourRouteOverviewMap from './TourRouteOverviewMap.jsx'

/**
 * First-tour map overview — full route on map plus ordered stop list before audio unlock.
 */
export default function TourOnboardingMapOverview({ onUnlock, busy = false }) {
  const { context } = useV2Journey()
  const { manifest, loading } = useTourManifest()

  const stops = useMemo(
    () =>
      buildTourRoadmap(manifest, {
        path: context.path,
        sequenceIndex: 0,
        completedWaypointIds: [],
      }),
    [manifest, context.path],
  )

  const stopCount = useMemo(() => {
    if (!manifest) return 0
    return getTourProductTruth(manifest, {
      path: context.path,
      pace: context.pace,
      promotedOptionalIds: context.promotedOptionalIds,
      customWaypointIds: context.customWaypointIds,
    }).visitStopCount
  }, [manifest, context.path, context.pace, context.promotedOptionalIds, context.customWaypointIds])

  return (
    <div
      className="cw-grain redesign-app-shell"
      data-testid="tour-onboarding-map"
      style={{
        minHeight: '100%',
        background: T.bone,
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: 'max(48px, calc(env(safe-area-inset-top) + 20px)) 24px 12px',
          flexShrink: 0,
        }}
      >
        <Eyebrow color={T.ember}>YOUR ROUTE</Eyebrow>
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
          {stopCount} stops in order
        </h1>
        <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.6, margin: 0 }}>
          This is your full walk through Rome — narration unlocks as you arrive at each place.
        </p>
      </div>

      <div
        style={{
          flexShrink: 0,
          margin: '0 16px 12px',
          height: 220,
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
          <TourRouteOverviewMap manifest={manifest} context={context} />
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
                  <p style={{ fontSize: 15, fontWeight: isFirst ? 600 : 500, color: T.ink, margin: 0, lineHeight: 1.25 }}>
                    {titleForWaypoint(waypoint)}
                  </p>
                  {stop.legToNext && !stop.isLast ? (
                    <p style={{ fontSize: 11, color: T.muted, margin: '3px 0 0', fontFamily: 'ui-monospace, monospace' }}>
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

      <div
        style={{
          flexShrink: 0,
          padding: `16px 24px ${SHELL_TAB_BAR_INSET}`,
          borderTop: `1px solid ${T.muted}28`,
          background: T.bone,
        }}
      >
        <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', marginBottom: 14, lineHeight: 1.5 }}>
          Tap once to wake sound — then we&apos;ll guide you through your first stop.
        </p>
        <PrimaryButton onClick={onUnlock} disabled={busy}>
          {busy ? 'Starting audio…' : 'Begin your walk'}
        </PrimaryButton>
      </div>
    </div>
  )
}
