import { ChevronLeft } from 'lucide-react'
import { T } from '../tokens.js'
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: showIcon ? 4 : 0,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: T.muted,
        ...TYPE.textAction,
        padding: 0,
        ...style,
      }}
    >
      {showIcon ? <ChevronLeft size={16} aria-hidden /> : null}
      {children}
    </button>
  )
}
