import { T, TAP } from '../tokens.js'
import { TYPE } from '../typography.js'

/**
 * Low-emphasis text action (Route, Start from here, Edit stops, Skip).
 * Optical type stays compact; hit box meets tap floor.
 */
export function TextButton({
  children,
  onClick,
  style,
  disabled = false,
  type = 'button',
  underline = false,
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={['cw-motion-pressable', className].filter(Boolean).join(' ')}
      style={{
        ...TYPE.textAction,
        color: disabled ? `${T.muted}88` : T.muted,
        background: 'none',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        minHeight: TAP.min,
        padding: '10px 4px',
        margin: '-10px -4px',
        textDecoration: underline ? 'underline' : 'none',
        textUnderlineOffset: underline ? 3 : undefined,
        opacity: disabled ? 0.55 : 1,
        transition:
          'opacity var(--d-feedback, 220ms) var(--ease-pressure), transform var(--d-micro, 160ms) var(--ease-pressure)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
