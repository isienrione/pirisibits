import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { projectMeanderPoints } from '../../../content/journeyLetter.js'
import { formatElapsedDuration, formatWalkedDistance } from '../../../utils/tourStats.js'
import { cn } from '../../ui/cn'

const DEMO_STOPS = [
  { id: 'w01', title: 'Colosseum', lat: 41.8902, lng: 12.4922 },
  { id: 'w02', title: 'Arch of Titus', lat: 41.891, lng: 12.4886 },
  { id: 'w06', title: 'Basilica of Maxentius', lat: 41.892, lng: 12.4889 },
  { id: 'w14', title: "Trajan's Market", lat: 41.8966, lng: 12.4862 },
  { id: 'w17', title: 'Pantheon', lat: 41.8986, lng: 12.4768 },
]

function RouteLine({ meander, gradientId }) {
  const pathRef = useRef(null)
  const [pathLength, setPathLength] = useState(0)

  useEffect(() => {
    const path = pathRef.current
    if (!path || typeof path.getTotalLength !== 'function') return
    setPathLength(path.getTotalLength())
  }, [meander.path])

  return (
    <svg
      viewBox={meander.viewBox}
      role="img"
      aria-label="Route through completed acts"
      className="h-48 w-full"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E4552E" />
          <stop offset="18%" stopColor="#E8A13C" />
          <stop offset="36%" stopColor="#7C9A5C" />
          <stop offset="54%" stopColor="#4E9B8F" />
          <stop offset="72%" stopColor="#4E7D9B" />
          <stop offset="86%" stopColor="#8A6FB5" />
          <stop offset="100%" stopColor="#B14A6E" />
        </linearGradient>
      </defs>
      <path
        ref={pathRef}
        d={meander.path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength || 1}
        strokeDashoffset={pathLength || 1}
        className="animate-letter-route-draw"
        style={{
          '--letter-path-length': pathLength,
        }}
      />
    </svg>
  )
}

export default function JourneyLetter({
  title = 'The path you walked',
  stopCount = DEMO_STOPS.length,
  walkedMeters = 4200,
  startedAtMs = Date.now() - 1000 * 60 * 145,
  closingLine = 'Rome keeps its echoes for those who walk slowly enough to hear them.',
  stops = DEMO_STOPS,
  className,
}) {
  const gradientId = useId().replace(/:/g, '')
  const meander = useMemo(() => projectMeanderPoints(stops), [stops])

  return (
    <div
      className={cn('min-h-full w-full bg-obsidian px-6 py-10 text-warmwhite', className)}
      style={{ fontFamily: 'var(--font-ui)' }}
    >
      <p
        className="uppercase text-muted"
        style={{ fontSize: '11px', letterSpacing: '0.18em' }}
      >
        Your letter
      </p>
      <h1
        className="mt-3 font-display text-3xl font-medium leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h1>

      <div className="mt-8">
        <RouteLine meander={meander} gradientId={gradientId} />
      </div>

      <dl className="mt-8 grid gap-3 text-sm text-muted">
        <div className="flex justify-between gap-4">
          <dt>Landmarks heard</dt>
          <dd className="font-semibold tabular-nums text-warmwhite">{stopCount}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Distance walked</dt>
          <dd className="font-semibold tabular-nums text-warmwhite">
            {formatWalkedDistance(walkedMeters)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Time on the path</dt>
          <dd className="font-semibold tabular-nums text-warmwhite">
            {formatElapsedDuration(startedAtMs)}
          </dd>
        </div>
      </dl>

      <p
        className="mt-10 font-display text-xl italic leading-relaxed text-muted"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {closingLine}
      </p>
    </div>
  )
}
