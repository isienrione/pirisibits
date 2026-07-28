import { useLayoutEffect, useRef, useState } from 'react'

const ART_W = 390

/**
 * Measure the phone screen and scale the 390px artboard exactly to its width.
 * Never collapses to 0 — a zero scale paints an empty black phone.
 */
export default function usePhoneArtboardScale() {
  const screenRef = useRef(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const node = screenRef.current
    if (!node || typeof ResizeObserver === 'undefined') return undefined

    const update = () => {
      const width = node.getBoundingClientRect().width
      if (width < 8) return
      const next = width / ART_W
      setScale((prev) => (Math.abs(prev - next) < 0.001 ? prev : next))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { screenRef, scale }
}
