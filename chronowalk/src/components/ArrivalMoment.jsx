import { cn } from './ui'
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
          'absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,var(--ember-glow),transparent_58%)]',
          !reducedMotion && 'animate-arrival-vignette'
        )}
        aria-hidden="true"
      />

      <div className="flex h-full items-end justify-center px-6 pb-[min(30vh,13rem)]">
        <div
          className={cn(
            'max-w-sm border-[color-mix(in_srgb,var(--ember)_35%,var(--bone))] px-6 py-6 text-center',
            !reducedMotion && 'animate-arrival-discover'
          )}
        >
          <div size="md" className="mx-auto">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="mt-4 text-eyebrow uppercase text-ember">Waypoint discovered</p>
          <p className="mt-2 font-display text-2xl font-semibold leading-tight text-ink900">
            {waypoint.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your story is ready below
          </p>
        </div>
      </div>
    </div>
  )
}

export default ArrivalMoment
