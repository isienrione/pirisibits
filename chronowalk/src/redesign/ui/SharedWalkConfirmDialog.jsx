import { useEffect, useId } from 'react'
import { T, F } from '../tokens.js'

/**
 * Accessible confirmation dialog for shared-walk leave / rejoin.
 * Escape and backdrop dismiss safely without confirming.
 */
export default function SharedWalkConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}) {
  const titleId = useId()
  const descriptionId = useId()
  const errorId = useId()

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onCancel?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [busy, open, onCancel])

  if (!open) return null

  return (
    <div
      className="cw-grain"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '16px 16px max(16px, env(safe-area-inset-bottom))',
        fontFamily: F.body,
      }}
    >
      <button
        type="button"
        aria-label="Dismiss dialog"
        onClick={() => {
          if (!busy) onCancel?.()
        }}
        style={{
          position: 'absolute',
          inset: 0,
          border: 'none',
          background: 'rgba(11, 11, 13, 0.45)',
          cursor: busy ? 'wait' : 'pointer',
        }}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={error ? `${descriptionId} ${errorId}` : descriptionId}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          background: T.bone,
          color: T.ink,
          borderRadius: 20,
          padding: '22px 20px 18px',
          boxShadow: '0 16px 48px rgba(11, 11, 13, 0.28)',
          border: `1px solid color-mix(in srgb, ${T.ink} 12%, ${T.muted})`,
        }}
      >
        <h2
          id={titleId}
          style={{
            margin: 0,
            fontFamily: F.display,
            fontSize: 24,
            fontWeight: 400,
            lineHeight: 1.2,
            color: T.ink,
          }}
        >
          {title}
        </h2>
        <p
          id={descriptionId}
          style={{
            margin: '12px 0 0',
            fontSize: 15,
            lineHeight: 1.55,
            color: `color-mix(in srgb, ${T.ink} 72%, ${T.muted})`,
          }}
        >
          {message}
        </p>
        {error ? (
          <p
            id={errorId}
            role="alert"
            style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.45, color: T.terracotta }}
          >
            {error}
          </p>
        ) : null}
        <div
          style={{
            marginTop: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <button
            type="button"
            autoFocus
            disabled={busy}
            onClick={onCancel}
            style={{
              minHeight: 48,
              borderRadius: 12,
              border: `1px solid color-mix(in srgb, ${T.ink} 16%, ${T.muted})`,
              background: T.warmWhite,
              color: T.ink,
              fontFamily: F.body,
              fontSize: 15,
              fontWeight: 600,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            style={{
              minHeight: 48,
              borderRadius: 12,
              border: 'none',
              background: T.ink,
              color: T.warmWhite,
              fontFamily: F.body,
              fontSize: 15,
              fontWeight: 600,
              cursor: busy ? 'wait' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
