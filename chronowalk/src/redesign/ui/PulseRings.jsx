import { T } from '../tokens.js'

/**
 * Concentric pulse rings — used on C3 Approaching and C4 Arrival.
 * Wrap in a positioned container at the desired screen location.
 */
export function PulseRings({ accent = T.actI, variant = 'arrival', count = 3 }) {
  const animation =
    variant === 'approaching'
      ? 'approachPulse 3.8s ease-in-out infinite'
      : 'pulseRingOut 2.2s ease-out forwards'

  const sizes = variant === 'approaching' ? [62, 100] : [56, 80, 104].slice(0, count)

  return (
    <>
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
            animation,
            animationDelay: `${i * (variant === 'approaching' ? 0.7 : 0.45)}s`,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 8,
          height: 8,
          borderRadius: 4,
          background: accent,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 12px ${accent}CC, 0 0 20px ${accent}66`,
        }}
      />
    </>
  )
}
