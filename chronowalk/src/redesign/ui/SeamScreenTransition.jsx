import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { T } from '../tokens.js'

const COMPANION_ROUTES = new Set(['/journey', '/map', '/journal', '/settings', '/letter'])

function shouldPlayTransition(from, to) {
  if (!from || from === to) return false
  if (COMPANION_ROUTES.has(from) && COMPANION_ROUTES.has(to)) return false
  return true
}

/** Brief full-screen seam sweep between onboarding / flow screens. */
export default function SeamScreenTransition() {
  const location = useLocation()
  const prevPath = useRef(location.pathname)
  const [active, setActive] = useState(false)
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const from = prevPath.current
    const to = location.pathname
    prevPath.current = to

    if (!shouldPlayTransition(from, to)) return undefined

    setActive(true)
    setPct(0)

    let raf = 0
    let start = 0
    const duration = 520

    const tick = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setPct(p)
      if (p < 1) raf = requestAnimationFrame(tick)
      else {
        window.setTimeout(() => {
          setActive(false)
          setPct(0)
        }, 120)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [location.pathname])

  if (!active) return null

  return (
    <div
      aria-hidden="true"
      className="cw-seam-transition"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        pointerEvents: 'none',
        opacity: pct > 0.92 ? 1 - (pct - 0.92) / 0.08 : 1,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: 0,
          width: 10,
          height: `${pct * 100}%`,
          background: `radial-gradient(ellipse at center, rgba(232,161,60,0.28) 0%, transparent 78%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: 0,
          width: 1.5,
          height: `${pct * 100}%`,
          background: T.ember,
          boxShadow: '0 0 18px rgba(232,161,60,0.65), 0 0 40px rgba(232,161,60,0.25)',
        }}
      />
    </div>
  )
}
