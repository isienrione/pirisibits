import { useMemo } from 'react'
import { JOURNEY_STATE } from '../../hooks/useGeoLocation'
import {
  buildOfflineWalkingInstruction,
  formatDistanceLabel,
  resolveActiveLegEndpoints,
} from '../../utils/offlineWalkingGuide'
import { buildRouteOverviewModel } from '../../utils/routeOverviewProjection'
import {
  getLegRouteCoordinates,
  getLegWalkingSteps,
  getTourRouteCoordinates,
} from '../../utils/routeGeometryCache'
import { estimateWalkMinutes } from '../../utils/tourStats'
import { sanitizeWalkDistanceM } from '../../content/journeyProgress.js'
import { StatusBadge, cn } from '../ui'
import { hex } from '../../design/tokens.js'

const STOP_COLORS = {
  completed: hex.verdigris,
  current: hex.ember,
  upcoming: hex.inkMuted,
}

function RouteOverviewSvg({ model }) {
  if (!model.fullRoutePath && !model.stops.length) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-3xl border border-dashed border-ink800 bg-bone text-sm text-muted">
        Route overview will appear once stops are loaded.
      </div>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${model.width} ${model.height}`}
      className="h-[220px] w-full rounded-3xl border border-ink800 bg-bone"
      role="img"
      aria-label="Simplified tour route overview"
    >
      {model.fullRoutePath ? (
        <path
          d={model.fullRoutePath}
          fill="none"
          stroke={hex.cityRome}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.35"
          strokeDasharray="6 8"
        />
      ) : null}
      {model.activeRoutePath ? (
        <path
          d={model.activeRoutePath}
          fill="none"
          stroke={hex.cityRome}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {model.stops.map((stop) => {
        // Label only current + next — labeling every stop stacks into illegible glyphs.
        const showLabel = stop.status === 'current' || stop.status === 'upcoming'
        return (
          <g key={stop.id}>
            <circle
              cx={stop.x}
              cy={stop.y}
              r={stop.status === 'current' ? 8 : 6}
              fill={STOP_COLORS[stop.status] ?? STOP_COLORS.upcoming}
              stroke={hex.warmWhite}
              strokeWidth="2"
            />
            {showLabel && stop.status === 'current' ? (
              <text
                x={stop.x}
                y={stop.y - 12}
                textAnchor="middle"
                className="fill-ink900 text-[9px] font-semibold"
              >
                {stop.title?.split(' ').slice(0, 2).join(' ')}
              </text>
            ) : null}
          </g>
        )
      })}
      {model.userPoint ? (
        <g>
          <circle
            cx={model.userPoint.x}
            cy={model.userPoint.y}
            r="9"
            fill={hex.cityLondon}
            stroke={hex.warmWhite}
            strokeWidth="3"
          />
          <text
            x={model.userPoint.x}
            y={model.userPoint.y + 22}
            textAnchor="middle"
            className="fill-sky-blue text-[8px] font-bold uppercase tracking-[0.12em]"
          >
            You
          </text>
        </g>
      ) : null}
    </svg>
  )
}

function WaypointSummaryCard({ eyebrow, title, detail, badge }) {
  return (
    <div className="bg-ink900 rounded-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-eyebrow uppercase text-muted">{eyebrow}</p>
          <p className="mt-1 font-display text-lg font-semibold leading-tight text-ink900">{title}</p>
          {detail ? <p className="mt-1.5 text-sm text-muted">{detail}</p> : null}
        </div>
        {badge}
      </div>
    </div>
  )
}

export function OfflineRouteMap({
  tour,
  stops = [],
  activeTargetId,
  activeLeg,
  transitLegActive = false,
  userPos,
  state,
  distance,
  awaitingFirstStop = false,
  className,
}) {
  const atStop = state === JOURNEY_STATE.ARRIVAL
  const { currentStop, nextStop, targetStop } = resolveActiveLegEndpoints({
    tour,
    stops,
    activeLeg,
    transitLegActive,
    activeTargetId,
  })

  const routeCoordinates = useMemo(() => {
    if (!tour?.id) return null

    if (transitLegActive && activeLeg) {
      return (
        getLegRouteCoordinates(tour.id, activeLeg.fromId, activeLeg.toId) ??
        getTourRouteCoordinates(tour.id)
      )
    }

    return getTourRouteCoordinates(tour.id)
  }, [tour?.id, transitLegActive, activeLeg])

  const cachedSteps = useMemo(() => {
    if (!tour?.id || !activeLeg) return null
    return getLegWalkingSteps(tour.id, activeLeg.fromId, activeLeg.toId)
  }, [tour?.id, activeLeg])

  const overview = useMemo(
    () =>
      buildRouteOverviewModel({
        tour,
        stops,
        routeCoordinates,
        activeLeg,
        transitLegActive,
        userPos,
      }),
    [tour, stops, routeCoordinates, activeLeg, transitLegActive, userPos]
  )

  const safeDistance = sanitizeWalkDistanceM(distance)
  const distanceLabel = formatDistanceLabel(safeDistance)
  const walkMinutes = estimateWalkMinutes(safeDistance)

  const walkingInstruction = buildOfflineWalkingInstruction({
    state,
    distance,
    currentStopTitle: currentStop?.title,
    nextStopTitle: nextStop?.title,
    targetStopTitle: targetStop?.title,
    transitLegActive,
    awaitingFirstStop,
    cachedSteps,
    atStop,
    userPos,
    targetLandmark: targetStop?.landmark,
  })

  return (
    <div
      className={cn(
        'flex h-screen w-full flex-col bg-bone px-4 pb-safe pt-safe text-ink900',
        className
      )}
    >
      <div
        className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 overflow-y-auto py-4"
        style={{ paddingTop: 'max(5.75rem, calc(env(safe-area-inset-top) + 5rem))' }}
      >
        <div>
          <p className="text-eyebrow uppercase text-ember">Offline route</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink900">Walking overview</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Detailed street maps need internet. Your tour, GPS arrival detection, and downloaded
            stories still work offline.
          </p>
        </div>

        <RouteOverviewSvg model={overview} />

        <div className="grid gap-3">
          <WaypointSummaryCard
            eyebrow="Current waypoint"
            title={currentStop?.title ?? targetStop?.title ?? 'Current stop'}
            detail={
              atStop
                ? 'You are within arrival range of this landmark.'
                : distanceLabel
                  ? `${distanceLabel} away`
                  : 'GPS will refine your distance as you walk.'
            }
            badge={
              atStop ? <StatusBadge variant="active">Arrived</StatusBadge> : (
                <StatusBadge variant="walking">En route</StatusBadge>
              )
            }
          />

          {nextStop && nextStop.id !== currentStop?.id ? (
            <WaypointSummaryCard
              eyebrow="Next waypoint"
              title={nextStop.title}
              detail={
                walkMinutes
                  ? `About ${walkMinutes} min walk on the route above`
                  : 'Continue along the route to unlock the next story.'
              }
            />
          ) : null}
        </div>

        <div className="bg-ink900 rounded-card border-ember/25 bg-ember/[0.05] p-4">
          <p className="text-eyebrow uppercase text-ember">Walking guidance</p>
          <p className="mt-2 text-sm leading-relaxed text-ink900">{walkingInstruction}</p>
          {distanceLabel && !atStop ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Distance to next waypoint: {distanceLabel}
              {walkMinutes ? ` · ~${walkMinutes} min` : ''}
            </p>
          ) : null}
        </div>

        <p className="pb-2 text-center text-xs leading-relaxed text-muted">
          Use the route card below to continue your tour, reopen stories, or get directions when you
          are back online.
        </p>
      </div>
    </div>
  )
}

export default OfflineRouteMap
