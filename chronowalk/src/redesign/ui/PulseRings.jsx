import { T } from '../tokens.js'

/**
 * Concentric pulse rings · water-drop beacon (shared center on dot + rings).
 */
export function PulseRings({ accent = T.actI, variant = 'arrival', count = 3 }) {
  const animation =
    variant === 'approaching'
      ? 'approachPulse 3.8s ease-in-out infinite'
      : 'pulseRingOut 2.2s ease-out infinite'

  const sizes = variant === 'approaching' ? [62, 100] : [48, 72, 96].slice(0, count)

  return (
    <div
      style={{
        position: 'relative',
        width: sizes[sizes.length - 1] ?? 96,
        height: sizes[sizes.length - 1] ?? 96,
      }}
    >
      {sizes.map((size, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            border: `${variant === 'approaching' && i === 0 ? '1.5px' : '1px'} solid ${accent}`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation,
            animationDelay: `${i * (variant === 'approaching' ? 0.7 : 0.5)}s`,
            pointerEvents: 'none',
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 10,
          height: 10,
          borderRadius: 5,
          background: accent,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 12px ${accent}CC, 0 0 24px ${accent}55`,
        }}
      />
    </div>
  )
}
