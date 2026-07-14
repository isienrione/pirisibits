import { ChevronLeft } from 'lucide-react'
import { T, TAP, ICON } from '../tokens.js'
import { TYPE } from '../typography.js'

/**
 * In-flow back row (Journal ← memory detail, Own-pace ← pick stops).
 * Not the fixed FlowEscapeButton chrome.
 * showIcon=false preserves text-only "← Back" call sites.
 */
export function BackLink({ children = 'Back', onClick, style, showIcon = true }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cw-motion-pressable"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showIcon ? 4 : 0,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: T.muted,
        ...TYPE.textAction,
        minHeight: TAP.min,
        padding: '10px 4px',
        margin: '-10px -4px',
        transition:
          'opacity var(--d-feedback, 220ms) var(--ease-pressure), transform var(--d-micro, 160ms) var(--ease-pressure)',
        ...style,
      }}
    >
      {showIcon ? <ChevronLeft size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden /> : null}
      {children}
    </button>
  )
}
