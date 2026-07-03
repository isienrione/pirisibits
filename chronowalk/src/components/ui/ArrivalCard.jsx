import { LivingSeam } from './LivingSeam.jsx'
import { cn } from './cn'

export function ArrivalCard({ actEyebrow, waypointName, eyebrowAccent, className }) {
  return (
    <div className={cn('inline-flex max-w-sm flex-col', className)}>
      {actEyebrow ? (
        <p
          className="text-eyebrow uppercase text-muted"
          style={eyebrowAccent ? { color: eyebrowAccent } : undefined}
        >
          {actEyebrow}
        </p>
      ) : null}

      <h2
        className="mt-3 font-display text-bone"
        style={{
          fontSize: 'var(--fs-title)',
          lineHeight: 1.15,
          fontWeight: 500,
          fontFamily: 'var(--font-display)',
        }}
      >
        {waypointName}
      </h2>

      <LivingSeam vertical={false} className="mt-4 w-full max-w-[min(100%,12rem)]" />
    </div>
  )
}

export default ArrivalCard
