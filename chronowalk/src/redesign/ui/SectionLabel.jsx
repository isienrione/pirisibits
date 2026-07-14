import { T, F } from '../tokens.js'

/**
 * Compact uppercase section labels (KEY FACTS / CHAPTERS).
 * Distinct from Eyebrow (10px / 0.25em) — this is 11px / 0.18em.
 */
export function SectionLabel({ children, color = T.muted, style }) {
  return (
    <p
      style={{
        fontSize: 11,
        color,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        fontWeight: 500,
        margin: 0,
        fontFamily: F.body,
        ...style,
      }}
    >
      {children}
    </p>
  )
}
