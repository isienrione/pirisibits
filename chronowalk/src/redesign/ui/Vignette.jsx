import { T } from '../tokens.js'

export function Vignette() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 3,
        background:
          'radial-gradient(ellipse at 50% 40%, transparent 38%, rgba(0,0,0,0.38) 100%)',
      }}
    />
  )
}
