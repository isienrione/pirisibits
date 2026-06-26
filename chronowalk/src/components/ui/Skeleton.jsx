import { cn } from './cn'
import { motionShimmer } from './motion'

function SkeletonShimmer({ className }) {
  return (
    <div
      className={cn(
        'absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,253,248,0.55)_50%,transparent_75%)] bg-[length:200%_100%]',
        motionShimmer,
        className
      )}
      aria-hidden="true"
    />
  )
}

export function Skeleton({ className, rounded = 'rounded-2xl' }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-sand via-limestone/50 to-warm-white',
        rounded,
        className
      )}
      aria-hidden="true"
    >
      <SkeletonShimmer />
    </div>
  )
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')}
          rounded="rounded-full"
        />
      ))}
    </div>
  )
}

export function SkeletonMedia({ className, aspect = 'aspect-[4/3]' }) {
  return <Skeleton className={cn(aspect, 'w-full', className)} rounded="rounded-none" />
}

export function SkeletonWaypointCard({ className }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-3xl border border-limestone/70 bg-warm-white/92 shadow-glass',
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading landmark card"
    >
      <SkeletonMedia aspect="aspect-[16/10] sm:aspect-[16/9]" />
      <div className="space-y-3 px-6 py-5">
        <Skeleton className="h-3 w-24" rounded="rounded-full" />
        <Skeleton className="h-7 w-4/5" rounded="rounded-xl" />
        <SkeletonText lines={2} />
        <Skeleton className="mt-2 h-11 w-full" rounded="rounded-2xl" />
      </div>
    </div>
  )
}

export function MapSkeletonOverlay({ label = 'Preparing your map…', hint, className }) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex flex-col bg-gradient-to-b from-sand/90 via-limestone/40 to-warm-white/95 backdrop-blur-sm',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex-1 overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute inset-x-[12%] top-[28%] space-y-4" aria-hidden="true">
          <Skeleton className="h-2 w-full rounded-full opacity-70" />
          <Skeleton className="ml-8 h-2 w-[72%] rounded-full opacity-60" />
          <Skeleton className="ml-4 h-2 w-[84%] rounded-full opacity-50" />
        </div>
        <div className="absolute bottom-[22%] left-[18%] flex gap-3" aria-hidden="true">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full opacity-80" />
          <Skeleton className="h-3 w-3 rounded-full opacity-60" />
        </div>
      </div>
      <div className="border-t border-limestone/50 bg-warm-white/80 px-6 py-5 text-center">
        <p className="text-sm font-semibold text-deep-slate">{label}</p>
        {hint ? <p className="mt-1 text-xs text-soft-slate">{hint}</p> : null}
      </div>
    </div>
  )
}

export function RouteLoadingShimmer({ className, label = 'Drawing your walking route…' }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-3xl border border-limestone/70 bg-warm-white/92 p-5 shadow-glass',
        className
      )}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="text-sm font-semibold text-deep-slate">{label}</p>
      <div className="mt-4 space-y-3" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 shrink-0" rounded="rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-full" rounded="rounded-full" />
              <Skeleton className="h-2.5 w-1/3" rounded="rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Skeleton
