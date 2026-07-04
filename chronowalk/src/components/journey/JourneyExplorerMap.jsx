import { useMemo } from 'react'
import { JOURNEY_STATES } from '../../state/journeyState'
import { palette } from '../../design/tokens'
import {
  buildLandmarkRouteCoordinates,
  buildRouteOverviewModel,
} from '../../utils/routeOverviewProjection'
import { cn } from '../ui'

const STOP_COLORS = {
  completed: palette.bronze,
  current: palette.gold,
  upcoming: palette.sand,
  destination: palette.gold,
}

function JourneyRouteSvg({
  model,
  destinationStopId,
  journeyState,
  selectedStopId,
  onSelectStop,
}) {
  if (!model.stops.length) {
    return (
      <div className="flex h-full min-h-[22rem] items-center justify-center text-sm text-soft-slate">
        Your route will appear here.
      </div>
    )
  }

  const destinationId = destinationStopId

  return (
    <svg
      viewBox={`0 0 ${model.width} ${model.height}`}
      className="h-full w-full"
      role="img"
      aria-label="Journey route map"
    >
      <defs>
        <linearGradient id="journey-route-active" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.bronze} stopOpacity="0.9" />
          <stop offset="100%" stopColor={palette.gold} stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {model.fullRoutePath ? (
        <path
          d={model.fullRoutePath}
          fill="none"
          stroke={palette.bronze}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.22"
        />
      ) : null}

      {model.activeRoutePath ? (
        <path
          d={model.activeRoutePath}
          fill="none"
          stroke="url(#journey-route-active)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.85"
        />
      ) : null}

      {model.stops.map((stop) => {
        const isDestination = stop.id === destinationId
        const isSelected = stop.id === selectedStopId
        const radius = isSelected ? 10 : isDestination ? 11 : stop.status === 'current' ? 8 : 6

        return (
          <g key={stop.id}>
            {isDestination || isSelected ? (
              <circle
                cx={stop.x}
                cy={stop.y}
                r="18"
                fill={isSelected ? palette.bronze : palette.gold}
                fillOpacity="0.14"
                className="motion-safe:animate-medallion-breathe"
              />
            ) : null}
            <circle
              cx={stop.x}
              cy={stop.y}
              r={radius}
              fill={
                isSelected
                  ? STOP_COLORS.completed
                  : isDestination
                    ? STOP_COLORS.destination
                    : STOP_COLORS[stop.status] ?? STOP_COLORS.upcoming
              }
              stroke={palette.ivory}
              strokeWidth="2.5"
            />
            {onSelectStop ? (
              <circle
                cx={stop.x}
                cy={stop.y}
                r="18"
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onSelectStop(stop.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectStop(stop.id)
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Select ${stop.title}`}
              />
            ) : null}
          </g>
        )
      })}

      {model.userPoint ? (
        <g>
          <circle
            cx={model.userPoint.x}
            cy={model.userPoint.y}
            r="8"
            fill={palette.olive}
            stroke={palette.ivory}
            strokeWidth="2.5"
          />
        </g>
      ) : null}
    </svg>
  )
}

export default function JourneyExplorerMap({
  manifest,
  currentStopId,
  completedStopIds = [],
  nextStopId,
  userPos,
  journeyState,
  selectedStopId = null,
  onSelectStop,
  visibleStopIds = null,
  className,
}) {
  const destinationStopId =
    journeyState === JOURNEY_STATES.ARRIVED ? currentStopId : nextStopId ?? currentStopId

  const model = useMemo(() => {
    if (!manifest) return null

    const stops = manifest.stops
      .filter((stop) => !visibleStopIds?.length || visibleStopIds.includes(stop.id))
      .map((stop) => {
        let status = 'upcoming'
        if (completedStopIds.includes(stop.id)) status = 'completed'
        else if (stop.id === currentStopId) status = 'current'

        return {
          id: stop.id,
          title: stop.shortTitle,
          landmark: stop.coords,
          status,
        }
      })

    const activeLeg =
      journeyState !== JOURNEY_STATES.ARRIVED && currentStopId && nextStopId
        ? { fromId: currentStopId, toId: nextStopId }
        : null

    return buildRouteOverviewModel({
      tour: { stopIds: manifest.stopOrder },
      stops,
      routeCoordinates: buildLandmarkRouteCoordinates(stops, { stopIds: manifest.stopOrder }),
      activeLeg,
      transitLegActive: Boolean(activeLeg),
      userPos,
      width: 420,
      height: 520,
    })
  }, [completedStopIds, currentStopId, journeyState, manifest, nextStopId, userPos, visibleStopIds])

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[2rem] border border-parchment/80 bg-gradient-to-b from-parchment/35 via-ivory to-ivory shadow-plaque',
        className
      )}
    >
      <div className="absolute inset-0 paper-texture opacity-40" aria-hidden="true" />
      <div className="relative h-full min-h-[22rem] p-4 sm:p-6">
        {model ? (
          <JourneyRouteSvg
            model={model}
            destinationStopId={destinationStopId}
            journeyState={journeyState}
            selectedStopId={selectedStopId}
            onSelectStop={onSelectStop}
          />
        ) : null}
      </div>
    </div>
  )
}
