import { useEffect, useId } from 'react'
import { Button } from './Button'
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
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--obsidian)_45%,transparent)]"
        aria-label="Dismiss dialog"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="bg-ink900 rounded-card relative w-full max-w-md p-5"
      >
        <h2 id={titleId} className="font-display text-xl font-semibold text-ink900">
          {title}
        </h2>
        <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-muted">
          {message}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="quiet" fullWidth className="sm:w-auto" onClick={onCancel}>
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
      </div>
    </div>
  )
}

export default ConfirmDialog
