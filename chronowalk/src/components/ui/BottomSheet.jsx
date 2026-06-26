import { cn } from './cn'

export function BottomSheet({
  open = false,
  onHandleClick,
  handleLabel = 'Minimize',
  className,
  contentClassName,
  children,
}) {
  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 z-50 w-full transform transition-transform duration-500 ease-out',
        open ? 'translate-y-0' : 'translate-y-full',
        className
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-h-[min(88dvh,88vh)] flex-col rounded-t-sheet border border-limestone/60',
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
            'min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-safe pt-2',
            contentClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
