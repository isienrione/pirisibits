import { useEffect, useRef } from 'react'
import { cn } from './cn'
import { focusRing } from './focusRing'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useOpenHaptic } from '../../hooks/useHapticTriggers'
import { triggerHaptic, HAPTIC_KIND } from '../../utils/haptics'

function getFocusableElements(container) {
  if (!container) return []
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  )
}

export function BottomSheet({
  open = false,
  onHandleClick,
  handleLabel = 'Minimize',
  ariaLabelledBy,
  ariaDescribedBy,
  onEscape,
  className,
  contentClassName,
  flush = false,
  cinematic = false,
  children,
}) {
  const reducedMotion = useReducedMotion()
  const sheetRef = useRef(null)
  const previousFocusRef = useRef(null)
  useOpenHaptic(open)

  const handleClose = () => {
    triggerHaptic(HAPTIC_KIND.SOFT_TAP)
    onHandleClick?.()
  }

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape?.() ?? handleClose()
        return
      }

      if (event.key !== 'Tab' || !sheetRef.current) return

      const focusable = getFocusableElements(sheetRef.current)
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onEscape, onHandleClick])

  useEffect(() => {
    if (!open || !sheetRef.current) return undefined

    previousFocusRef.current = document.activeElement

    const focusable = getFocusableElements(sheetRef.current)
    focusable[0]?.focus({ preventScroll: true })

    return () => {
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus({ preventScroll: true })
      }
    }
  }, [open])

  return (
    <div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
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
        <div className="flex shrink-0 items-center justify-center px-5 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              'flex min-h-11 min-w-[4.5rem] items-center justify-center rounded-full px-4 py-3',
              focusRing
            )}
            aria-label={handleLabel}
          >
            <span className="h-1.5 w-14 rounded-full bg-limestone/80 transition hover:bg-limestone" />
          </button>
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
