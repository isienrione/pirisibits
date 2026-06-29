import { useEffect, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { cn } from './ui/cn'

const LOGO_SRC = '/brand/chronowalk-logo.png'
const SPLASH_MS = 2000
const FADE_MS = 650

function DustParticles({ reducedMotion }) {
  if (reducedMotion) return null

  const particles = Array.from({ length: 18 }, (_, index) => ({
    id: index,
    left: `${8 + ((index * 17) % 84)}%`,
    top: `${12 + ((index * 23) % 76)}%`,
    delay: `${(index % 6) * 0.45}s`,
    size: index % 3 === 0 ? 3 : 2,
  }))

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute rounded-full bg-gold/30 animate-splash-dust"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            animationDelay: particle.delay,
          }}
        />
      ))}
    </div>
  )
}

export function SplashScreen({ onComplete }) {
  const reducedMotion = useReducedMotion()
  const [phase, setPhase] = useState('visible')

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setPhase('fading'), SPLASH_MS)
    const doneTimer = window.setTimeout(() => onComplete?.(), SPLASH_MS + FADE_MS)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(doneTimer)
    }
  }, [onComplete])

  return (
    <div
      className={cn(
        'fixed inset-0 z-[500] flex items-center justify-center bg-obsidian transition-opacity duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
        phase === 'fading' ? 'pointer-events-none opacity-0' : 'opacity-100'
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading ChronoWalk"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.12)_0%,transparent_62%)]"
        aria-hidden="true"
      />
      <DustParticles reducedMotion={reducedMotion} />

      <div
        className={cn(
          'relative flex max-w-sm flex-col items-center px-8 text-center transition-all duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          phase === 'fading' ? 'translate-y-2 scale-[0.98] opacity-0' : 'translate-y-0 scale-100 opacity-100'
        )}
      >
        <img
          src={LOGO_SRC}
          alt=""
          className="h-auto w-full max-w-[min(72vw,18rem)] drop-shadow-gold-glow"
          aria-hidden="true"
        />
        <p className="mt-6 font-display text-sm font-medium uppercase tracking-[0.35em] text-gold/85">
          Walk Through Time
        </p>
      </div>
    </div>
  )
}

export default SplashScreen
