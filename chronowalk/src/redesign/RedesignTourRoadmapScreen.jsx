import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  buildTourRoadmap,
  summarizeTourRoadmap,
  tourRoadmapHeadline,
} from '../content/tourRoadmap.js'
import { JOURNEY_STATES } from '../state/journey.js'
import { useV2Journey, useTourManifest } from '../hooks/useV2Journey.js'
import {T, F, withAlpha} from './tokens.js'
import { photoForWaypoint, titleForWaypoint } from './lib/waypointPresentation.js'
import { getWaypoint } from '../content/manifest.js'
import { Eyebrow } from './ui/index.js'

function TimelineDot({ status }) {
  const isCompleted = status === 'completed'
  const isCurrent = status === 'current'
  const isUpcoming = status === 'upcoming'

  return (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: 7,
        flexShrink: 0,
        background: isCompleted || isCurrent ? T.ember : 'transparent',
        border: isUpcoming ? `1.5px solid ${withAlpha(T.muted, '44')}` : `2px solid ${isCurrent ? T.ink : T.ember}`,
        boxShadow: isCompleted || isCurrent ? `0 0 8px ${withAlpha(T.ember, '55')}` : 'none',
        opacity: isUpcoming ? 0.45 : 1,
        zIndex: 2,
      }}
      aria-hidden
    />
  )
}

function TimelineLine({ faded, isLast }) {
  if (isLast) return null
  return (
    <div
      style={{
        position: 'absolute',
        left: 6,
        top: 14,
        bottom: -8,
        width: 2,
        background: faded ? `${withAlpha(T.muted, '33')}` : T.ember,
        opacity: faded ? 0.55 : 0.85,
        zIndex: 1,
      }}
      aria-hidden
    />
  )
}

export default function RedesignTourRoadmapScreen() {
  const navigate = useNavigate()
  const { state, context } = useV2Journey()
  const { manifest, loading, error } = useTourManifest()

  const stops = useMemo(
    () =>
      buildTourRoadmap(manifest, {
        path: context.path,
        sequenceIndex: context.currentSequenceIndex,
        completedWaypointIds: context.completedWaypointIds,
      }),
    [manifest, context.path, context.currentSequenceIndex, context.completedWaypointIds],
  )

  const progress = useMemo(() => summarizeTourRoadmap(stops), [stops])
  const headline = useMemo(() => tourRoadmapHeadline(stops), [stops])

  const journeyActive =
    state !== JOURNEY_STATES.IDLE && state !== JOURNEY_STATES.COMPLETE

  if (loading) {
    return (
      <div
        className="cw-grain"
        style={{
          background: T.bone,
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          fontFamily: F.body,
          color: T.muted,
        }}
      >
        Loading your tour…
      </div>
    )
  }

  if (error || !manifest) {
    return (
      <div className="cw-grain" style={{ background: T.bone, height: '100%', padding: 32, fontFamily: F.body }}>
        <p style={{ color: T.muted }}>{error?.message ?? 'Tour unavailable'}</p>
        <button type="button" onClick={() => navigate('/begin')} style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, border: 'none', background: T.ember, cursor: 'pointer' }}>
          Start tour
        </button>
      </div>
    )
  }

  return (
    <div
      className="cw-grain"
      style={{
        background: T.bone,
        height: '100%',
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: 'max(48px, calc(env(safe-area-inset-top) + 16px)) 24px 12px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <Eyebrow color={T.ember}>YOUR TOUR</Eyebrow>
          <span
            style={{
              fontSize: 12,
              color: T.muted,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.06em',
              flexShrink: 0,
              paddingTop: 2,
            }}
          >
            {progress.completed} / {progress.total}
          </span>
        </div>
        <h1
          style={{
            fontFamily: F.display,
            fontSize: 26,
            fontWeight: 300,
            color: T.ink,
            lineHeight: 1.25,
            margin: '12px 0 0',
          }}
        >
          {headline}
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          padding: '8px 24px 16px',
        }}
      >
        {stops.map((stop, index) => {
          const waypoint = getWaypoint(manifest, stop.id)
          const photo = photoForWaypoint(waypoint)
          const isCurrent = stop.status === 'current'
          const isUpcoming = stop.status === 'upcoming'
          const faded = isUpcoming
          const showNextLabel = isCurrent && progress.completed > 0

          return (
            <div
              key={stop.id}
              style={{
                display: 'flex',
                gap: 14,
                padding: '14px 0',
                opacity: faded ? 0.42 : 1,
                transition: 'opacity 200ms',
              }}
            >
              <div style={{ position: 'relative', width: 14, flexShrink: 0, marginTop: 4 }}>
                <TimelineDot status={stop.status} />
                <TimelineLine faded={faded || isUpcoming} isLast={stop.isLast} />
              </div>

              <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                {showNextLabel ? (
                  <p
                    style={{
                      margin: '0 0 4px',
                      fontSize: 10,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: T.muted,
                      fontWeight: 600,
                    }}
                  >
                    Next
                  </p>
                ) : null}
                <p
                  style={{
                    margin: 0,
                    fontFamily: F.display,
                    fontSize: isCurrent ? 22 : 20,
                    fontWeight: isCurrent ? 400 : 300,
                    color: faded ? T.muted : T.ink,
                    lineHeight: 1.2,
                  }}
                >
                  {titleForWaypoint(waypoint)}
                </p>
                {stop.legToNext && !stop.isLast ? (
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: 12,
                      color: T.muted,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {stop.legToNext}
                  </p>
                ) : null}
              </div>

              {photo ? (
                <img
                  src={photo}
                  alt=""
                  style={{
                    width: 72,
                    height: 56,
                    borderRadius: 8,
                    objectFit: 'cover',
                    flexShrink: 0,
                    filter: faded ? 'grayscale(0.35) saturate(0.5)' : 'none',
                    opacity: faded ? 0.55 : 1,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 56,
                    borderRadius: 8,
                    background: `${withAlpha(T.muted, '22')}`,
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: '14px 24px max(14px, env(safe-area-inset-bottom))',
          borderTop: `1px solid ${withAlpha(T.muted, '28')}`,
          background: T.bone,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {journeyActive ? (
          <Link
            to="/journey"
            style={{
              display: 'block',
              width: '100%',
              padding: '15px 20px',
              borderRadius: 14,
              border: 'none',
              background: T.ember,
              color: T.obsidian,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 15,
              textAlign: 'center',
              textDecoration: 'none',
              boxShadow: `0 4px 20px ${withAlpha(T.ember, '44')}`,
            }}
          >
            Continue walk →
          </Link>
        ) : (
          <Link
            to="/begin"
            style={{
              display: 'block',
              width: '100%',
              padding: '15px 20px',
              borderRadius: 14,
              border: 'none',
              background: T.ember,
              color: T.obsidian,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 15,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            {state === JOURNEY_STATES.COMPLETE ? 'Walk again' : 'Begin your walk'}
          </Link>
        )}

        {progress.completed > 0 ? (
          <Link
            to="/letter"
            style={{
              display: 'block',
              textAlign: 'center',
              fontSize: 13,
              color: T.muted,
              textDecoration: 'none',
              padding: '4px 0',
            }}
          >
            Open journey letter
          </Link>
        ) : null}
      </div>
    </div>
  )
}
