import { T, S, R, TAP } from '../tokens.js'
import { TYPE } from '../typography.js'

const PRESS =
  'opacity var(--d-feedback, 220ms) var(--ease-pressure), transform var(--d-micro, 160ms) var(--ease-pressure)'

/**
 * Ghost CTA for immersive (photo) surfaces — translucent border + blur.
 */
export function GhostButton({
  children,
  onClick,
  style,
  disabled = false,
  busy = false,
  type = 'button',
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
        border: `1.5px solid color-mix(in srgb, var(--warm-white, #faf6ef) 25%, transparent)`,
        color: T.warmWhite,
        borderRadius: R.control,
        ...TYPE.button,
        fontWeight: 500,
        background: 'color-mix(in srgb, var(--obsidian, #0b0b0d) 35%, transparent)',
        cursor: busy ? 'wait' : inert ? 'not-allowed' : 'pointer',
        opacity: inert ? 0.55 : 1,
        backdropFilter: 'blur(8px)',
        transition: PRESS,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
