import { T } from '../tokens.js'

/** Small ChronoWalk mark used in shell brand rows. */
export function BrandMark({ size = 22, color = T.ember, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden style={style}>
      <circle cx="11" cy="11" r="9.5" stroke={color} strokeWidth="1.5" />
      <line x1="11" y1="1.5" x2="11" y2="20.5" stroke={color} strokeWidth="1.5" />
      <line x1="11" y1="7" x2="18" y2="15" stroke={T.actV} strokeWidth="1" opacity="0.6" />
      <line x1="11" y1="7" x2="4" y2="15" stroke={T.actVI} strokeWidth="1" opacity="0.6" />
    </svg>
  )
}
