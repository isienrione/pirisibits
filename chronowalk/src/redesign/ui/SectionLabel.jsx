import { T } from '../tokens.js'
import { TYPE } from '../typography.js'

/**
 * Compact uppercase section labels (KEY FACTS / CHAPTERS).
 * Distinct from Eyebrow (kicker) — denser tracking, one step larger.
 */
export function SectionLabel({ children, color = T.muted, style }) {
  return (
    <p
      style={{
        ...TYPE.section,
        color,
        ...style,
      }}
    >
      {children}
    </p>
  )
}
