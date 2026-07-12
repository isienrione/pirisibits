import { useReducedMotion } from '../../hooks/useReducedMotion'

export default function ArrivalGoldParticles() {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) return null

  const particles = Array.from({ length: 24 }, (_, index) => ({
    id: index,
    left: `${6 + ((index * 13) % 88)}%`,
    top: `${8 + ((index * 19) % 84)}%`,
    delay: `${(index % 8) * 0.55}s`,
    size: index % 4 === 0 ? 3 : 2,
    opacity: index % 3 === 0 ? 0.35 : 0.22,
  }))

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute rounded-full bg-gold animate-splash-dust"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            animationDelay: particle.delay,
            opacity: particle.opacity,
          }}
        />
      ))}
    </div>
  )
}
