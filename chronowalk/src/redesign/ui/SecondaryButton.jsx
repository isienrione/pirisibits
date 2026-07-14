import { T, S, R, TAP } from '../tokens.js'
import { TYPE } from '../typography.js'

const PRESS =
  'opacity var(--d-feedback, 220ms) var(--ease-pressure), transform var(--d-micro, 160ms) var(--ease-pressure)'

/**
 * Quiet outline CTA for bone / light surfaces (journey complete, journal actions).
 */
export function SecondaryButton({
  children,
  onClick,
  style,
  disabled = false,
  busy = false,
  type = 'button',
  color = T.muted,
  borderColor,
  className = '',
  ...rest
}) {
  const inert = disabled || busy
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={inert}
      className={['cw-motion-pressable', className].filter(Boolean).join(' ')}
      style={{
        width: '100%',
        minHeight: TAP.min,
        padding: `${S.m} ${S.l}`,
        background: 'transparent',
        color,
        borderRadius: R.control,
        ...TYPE.buttonQuiet,
        border: `1px solid ${borderColor ?? `${T.muted}33`}`,
        cursor: busy ? 'wait' : inert ? 'not-allowed' : 'pointer',
        opacity: inert ? 0.55 : 1,
        transition: PRESS,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
