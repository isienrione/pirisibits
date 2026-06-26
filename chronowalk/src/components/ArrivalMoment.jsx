import { GlassPanel, cn, motionCardRise, motionUnlockVignette, typeBodySmMuted, typeEyebrowGold, typeSectionTitleMd, ArrivalIcon } from './ui'
import { useReducedMotion } from '../hooks/useReducedMotion'

function DiscoveryIcon() {
  return <ArrivalIcon size="2xl" className="mx-auto text-gold" />
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
          'absolute inset-0 bg-deep-slate/55',
          !reducedMotion && motionUnlockVignette
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(217,164,65,0.28),transparent_58%)]',
          !reducedMotion && motionUnlockVignette
        )}
        aria-hidden="true"
      />

      <div className="flex h-full items-end justify-center px-6 pb-[min(30vh,13rem)]">
        <GlassPanel
          className={cn(
            'max-w-sm rounded-3xl border-gold/35 bg-warm-white/96 px-8 py-8 text-center shadow-glass-lg',
            !reducedMotion && motionCardRise
          )}
        >
          <DiscoveryIcon />
          <p className={cn(typeEyebrowGold, 'mt-5')}>Waypoint discovered</p>
          <p className={cn(typeSectionTitleMd, 'mt-3')}>
            {waypoint.title}
          </p>
          <p className={cn(typeBodySmMuted, 'mt-4')}>
            Your story is ready below
          </p>
        </GlassPanel>
      </div>
    </div>
  )
}

export default ArrivalMoment
