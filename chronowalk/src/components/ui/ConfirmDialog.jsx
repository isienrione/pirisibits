import { useEffect, useId } from 'react'
import { Button } from './Button'
import { GlassPanel } from './GlassPanel'
import { cn } from './cn'
import { focusRing } from './focusRing'
import { useOpenHaptic } from '../../hooks/useHapticTriggers'

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Open anyway',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  const titleId = useId()
  const descriptionId = useId()
  useOpenHaptic(open)

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel?.()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[400] flex items-end justify-center p-4 pb-safe sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-deep-slate/45 backdrop-blur-[2px]"
        aria-label="Dismiss dialog"
        onClick={onCancel}
      />
      <GlassPanel
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-md p-5 shadow-plaque-lg"
      >
        <h2 id={titleId} className="font-display text-xl font-semibold text-deep-slate">
          {title}
        </h2>
        <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-soft-slate">
          {message}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" fullWidth className="sm:w-auto" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            autoFocus
            fullWidth
            className={cn('sm:w-auto', focusRing)}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </GlassPanel>
    </div>
  )
}

export default ConfirmDialog
