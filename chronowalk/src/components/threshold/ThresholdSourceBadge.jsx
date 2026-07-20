import { useState } from 'react'

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 10v6M12 7h.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function ThresholdCaptionBubble({ text, onDismiss }) {
  if (!text) return null

  return (
    <div
      role="status"
      style={{
        position: 'absolute',
        left: 'var(--edge)',
        right: 'var(--edge)',
        bottom: 'max(5.5rem, calc(env(safe-area-inset-bottom) + 4rem))',
        margin: 0,
        padding: '10px 14px',
        borderRadius: 14,
        background: 'color-mix(in srgb, var(--obsidian) 78%, transparent)',
        border: '1px solid color-mix(in srgb, var(--warm-white) 14%, transparent)',
        textAlign: 'center',
        fontSize: 10,
        lineHeight: 1.5,
        color: 'color-mix(in srgb, var(--warm-white) 82%, transparent)',
        backdropFilter: 'blur(8px)',
        zIndex: 3,
      }}
    >
      <p style={{ margin: 0 }}>{text}</p>
      {onDismiss ? (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onDismiss}
          style={{
            marginTop: 8,
            border: 'none',
            background: 'transparent',
            color: 'var(--ember)',
            fontSize: 10,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
      ) : null}
    </div>
  )
}

export default function ThresholdSourceBadge({
  label,
  caption,
  align = 'right',
  onPointerDownCapture,
}) {
  const [open, setOpen] = useState(false)

  if (!caption) return null

  const horizontal = align === 'left' ? { left: 'var(--edge)' } : { right: 'var(--edge)' }

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onPointerDown={(event) => {
          event.stopPropagation()
          onPointerDownCapture?.(event)
        }}
        onClick={() => setOpen((value) => !value)}
        style={{
          position: 'absolute',
          top: 'max(3.25rem, calc(env(safe-area-inset-top) + 2.25rem))',
          ...horizontal,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '1px solid color-mix(in srgb, var(--warm-white) 20%, transparent)',
          background: 'color-mix(in srgb, var(--obsidian) 70%, transparent)',
          color: 'color-mix(in srgb, var(--warm-white) 85%, transparent)',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          zIndex: 2,
        }}
      >
        <InfoIcon />
      </button>

      {open ? <ThresholdCaptionBubble text={caption} onDismiss={() => setOpen(false)} /> : null}
    </>
  )
}

export const AI_NOW_DISCLOSURE_COPY =
  "This present-day view is an AI-assisted rendering, created because a suitable photograph wasn't available for this exact vantage point."
