import { T, F, S } from '../tokens.js'

/**
 * Ghost CTA for immersive (photo) surfaces — translucent border + blur.
 * Pass style for tone variants without forking the control.
 */
export function GhostButton({ children, onClick, style, disabled = false, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: `${S.m} ${S.l}`,
        border: `1.5px solid rgba(245,239,227,0.25)`,
        color: T.warmWhite,
        borderRadius: 12,
        fontFamily: F.body,
        fontSize: 15,
        background: 'rgba(11,11,13,0.35)',
        cursor: disabled ? 'wait' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        backdropFilter: 'blur(8px)',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
