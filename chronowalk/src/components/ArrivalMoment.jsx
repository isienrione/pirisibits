import { GlassPanel, cn } from './ui'
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
          'absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(217,164,65,0.22),transparent_62%)]',
          !reducedMotion && 'animate-arrival-vignette'
        )}
        aria-hidden="true"
      />

      <div className="flex h-full items-end justify-center px-6 pb-[min(28vh,12rem)]">
        <GlassPanel
          className={cn(
            'max-w-sm rounded-3xl border-gold/30 bg-warm-white/94 px-6 py-5 text-center shadow-glass-lg',
            !reducedMotion && 'animate-arrival-discover'
          )}
        >
          <p className="text-eyebrow uppercase text-gold">Waypoint discovered</p>
          <p className="mt-2 font-display text-2xl font-semibold leading-tight text-deep-slate">
            {waypoint.title}
          </p>
          <p className="mt-2 text-sm text-soft-slate">Your story is ready below</p>
        </GlassPanel>
      </div>
    </div>
  )
}

export default ArrivalMoment
