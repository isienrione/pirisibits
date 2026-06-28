import { useEffect, useRef } from 'react'
import { useReducedMotion } from './useReducedMotion'

/** Gentle scroll-linked translate for hero imagery. */
export function useScrollParallax({ enabled = true, strength = 0.22 } = {}) {
  const targetRef = useRef(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!enabled || reducedMotion || typeof window === 'undefined') return undefined

    let frame = null

    const apply = () => {
      frame = null
      const node = targetRef.current
      if (!node) return

      const offset = window.scrollY * strength
      node.style.transform = `translate3d(0, ${offset}px, 0)`
    }

    const onScroll = () => {
      if (frame != null) return
      frame = window.requestAnimationFrame(apply)
    }

    apply()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame != null) window.cancelAnimationFrame(frame)
    }
  }, [enabled, reducedMotion, strength])

  return targetRef
}
