import { Settings } from 'lucide-react'
import { T } from '../tokens.js'

/**
 * Icon-only chrome control (settings gear). Appearance matches My Tour / Journal.
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
      style={{
        color: T.muted,
        background: 'none',
        border: 'none',
        lineHeight: 0,
        padding: 4,
        cursor: 'pointer',
        ...style,
      }}
    >
      {children ?? <Settings size={18} />}
    </button>
  )
}
