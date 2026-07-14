import { T } from '../tokens.js'
import { TYPE } from '../typography.js'

/**
 * Low-emphasis text action (Route, Start from here, Edit stops, Skip).
 */
export function TextButton({
  children,
  onClick,
  style,
  disabled = false,
  type = 'button',
  underline = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...TYPE.textAction,
        color: disabled ? `${T.muted}88` : T.muted,
        background: 'none',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        padding: 0,
        textDecoration: underline ? 'underline' : 'none',
        textUnderlineOffset: underline ? 3 : undefined,
        ...style,
      }}
    >
      {children}
    </button>
  )
}
