import { MedallionBadge, ParchmentCard, cn } from './ui'
import { useReducedMotion } from '../hooks/useReducedMotion'

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
          'absolute inset-0 bg-obsidian/55',
          !reducedMotion && 'animate-arrival-vignette'
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(212,175,55,0.24),transparent_58%)]',
          !reducedMotion && 'animate-arrival-vignette'
        )}
        aria-hidden="true"
      />

      <div className="flex h-full items-end justify-center px-6 pb-[min(30vh,13rem)]">
        <ParchmentCard
          className={cn(
            'max-w-sm border-gold/35 px-6 py-6 text-center shadow-plaque-lg',
            !reducedMotion && 'animate-arrival-discover'
          )}
        >
          <MedallionBadge size="md" pulse className="mx-auto">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
            </svg>
          </MedallionBadge>
          <p className="mt-4 text-eyebrow uppercase text-bronze">Waypoint discovered</p>
          <p className="mt-2 font-display text-2xl font-semibold leading-tight text-deep-slate">
            {waypoint.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-soft-slate">
            Your story is ready below
          </p>
        </ParchmentCard>
      </div>
    </div>
  )
}

export default ArrivalMoment
