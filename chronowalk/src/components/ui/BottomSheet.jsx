import { cn } from './cn'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export function BottomSheet({
  open = false,
  onHandleClick,
  handleLabel = 'Minimize',
  className,
  contentClassName,
  flush = false,
  cinematic = false,
  children,
}) {
  const reducedMotion = useReducedMotion()

  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 z-50 w-full',
        reducedMotion
          ? open
            ? 'translate-y-0'
            : 'translate-y-full'
          : cinematic && open
            ? 'animate-sheet-rise'
            : cn(
                'transform motion-safe-transition',
                open ? 'translate-y-0' : 'translate-y-full'
              ),
        className
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-h-[min(92dvh,92vh)] flex-col rounded-t-sheet border border-limestone/60',
          'bg-gradient-to-b from-warm-white via-warm-white to-sand/90 shadow-sheet-up'
        )}
      >
        <div className="flex shrink-0 items-center justify-center px-5 pt-4">
          <button
            type="button"
            onClick={onHandleClick}
            className="h-1.5 w-14 rounded-full bg-limestone/80 transition hover:bg-limestone"
            aria-label={handleLabel}
          />
        </div>

        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain pb-safe',
            flush ? 'pt-0' : 'px-6 pt-2',
            contentClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
