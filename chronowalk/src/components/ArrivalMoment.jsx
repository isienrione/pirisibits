import { MedallionBadge, cn } from './ui'
import { useReducedMotion } from '../hooks/useReducedMotion'

function SparkleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.2 4.2L17.5 8 13.2 9.2 12 13.5 10.8 9.2 6.5 8l4.3-1.8L12 2Zm7 9 0.8 2.8L22.5 15l-3.7 1.5L18 19.3l-0.8-2.8L13.5 15l3.7-1.5L19 11Zm-14 0 0.8 2.8L8.5 15 4.8 16.5 4 19.3 3.2 16.5 0.5 15l3.7-1.5L5 11Z" />
    </svg>
  )
}

const ArrivalMoment = ({ waypoint, visible }) => {
  const reducedMotion = useReducedMotion()

  if (!visible || !waypoint) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className={cn(
          'absolute inset-0 bg-obsidian/45',
          !reducedMotion && 'animate-arrival-vignette'
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(212,175,55,0.22),transparent_60%)]',
          !reducedMotion && 'animate-arrival-vignette'
        )}
        aria-hidden="true"
      />

      <div className="flex h-full flex-col items-center px-6 pt-[max(5.5rem,env(safe-area-inset-top)+4rem)]">
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gradient-to-r from-gold/25 via-gold/20 to-bronze/20 px-4 py-2 shadow-gold-glow backdrop-blur-sm',
            !reducedMotion && 'animate-arrival-discover'
          )}
        >
          <MedallionBadge size="sm" className="h-7 w-7">
            <SparkleIcon className="h-3.5 w-3.5 text-gold" />
          </MedallionBadge>
          <span className="font-display text-sm font-semibold text-ivory">Waypoint discovered</span>
          <SparkleIcon className="h-3.5 w-3.5 text-gold/90" />
        </div>
        <p
          className={cn(
            'mt-4 max-w-xs text-center font-display text-2xl font-semibold leading-tight text-ivory',
            !reducedMotion && 'animate-arrival-title'
          )}
        >
          {waypoint.title}
        </p>
      </div>
    </div>
  )
}

export default ArrivalMoment
