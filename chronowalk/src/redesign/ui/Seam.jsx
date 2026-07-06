import { T } from '../tokens.js'

export function Seam({ variant = 'vertical', accent = T.ember, pct = 0, style: extra = {} }) {
  const base =
    variant === 'horizontal'
      ? { position: 'absolute', left: 0, right: 0, height: 1.5 }
      : variant === 'progress'
        ? { position: 'absolute', top: 0, left: 0, height: 3, width: `${pct * 100}%` }
        : {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            width: 1.5,
            transform: 'translateX(-50%)',
          }

  const glow =
    variant === 'progress'
      ? { boxShadow: `0 0 8px ${accent}80` }
      : {
          boxShadow: '0 0 12px rgba(232,161,60,0.45)',
          animation: 'seamBreathe 3s ease-in-out infinite',
        }

  return (
    <div
      style={{
        ...base,
        background: accent,
        pointerEvents: 'none',
        zIndex: variant === 'progress' ? 5 : 4,
        ...glow,
        ...extra,
      }}
    />
  )
}
