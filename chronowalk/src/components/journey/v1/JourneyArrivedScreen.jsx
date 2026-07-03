import { useMemo } from 'react'
import { getActForWaypoint } from '../../../data/romePacing.js'
import { useActAccent } from '../../../hooks/useActAccent.js'
import { useReducedMotion } from '../../../hooks/useReducedMotion.js'
import { ArrivalCard } from '../../ui'
import { cn } from '../../ui/cn'

export default function JourneyArrivedScreen({ waypoint }) {
  const accent = useActAccent()
  const reducedMotion = useReducedMotion()

  const actEyebrow = useMemo(() => {
    if (!waypoint?.id) return null
    const act = getActForWaypoint(waypoint.id)
    if (!act) return null
    return `Act ${act.numeral} · ${act.title}`
  }, [waypoint?.id])

  const arrivalLine =
    waypoint?.arrival_subtitle ?? "You've arrived — your story is opening."

  return (
    <div className="relative min-h-full bg-obsidian">
      {waypoint ? (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute left-1/2 top-[38%] h-3 w-3 rounded-full border',
            !reducedMotion && 'animate-arrival-map-pulse'
          )}
          style={{ borderColor: accent }}
        />
      ) : null}

      <div className="relative flex min-h-full flex-col justify-end px-6 pb-16 pt-24">
        {waypoint ? (
          <ArrivalCard
            actEyebrow={actEyebrow}
            waypointName={waypoint.title}
            eyebrowAccent={accent}
          />
        ) : (
          <p className="text-eyebrow uppercase" style={{ color: accent }}>
            Arrived
          </p>
        )}

        <p className="mt-6 max-w-sm text-base leading-relaxed text-muted">{arrivalLine}</p>
      </div>
    </div>
  )
}
