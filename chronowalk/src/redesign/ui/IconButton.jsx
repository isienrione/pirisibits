import { Settings } from 'lucide-react'
import { T, TAP, ICON } from '../tokens.js'

/**
 * Icon-only chrome control (settings gear).
 * Visual glyph stays ICON.md; hit box meets tap floor.
 */
export function IconButton({
  onClick,
  label,
  children,
  style,
  type = 'button',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={label}
      className="cw-motion-pressable"
      style={{
        color: T.muted,
        background: 'none',
        border: 'none',
        lineHeight: 0,
        display: 'inline-grid',
        placeItems: 'center',
        minWidth: TAP.min,
        minHeight: TAP.min,
        padding: 0,
        cursor: 'pointer',
        transition:
          'opacity var(--d-feedback, 220ms) var(--ease-pressure), transform var(--d-micro, 160ms) var(--ease-pressure)',
        ...style,
      }}
    >
      {children ?? <Settings size={ICON.md} strokeWidth={ICON.stroke} />}
    </button>
  )
}
