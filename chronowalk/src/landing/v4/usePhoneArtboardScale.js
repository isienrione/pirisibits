import { useLayoutEffect, useRef, useState } from 'react'

const ART_W = 390

/**
 * Measure the phone screen and scale the 390px artboard exactly to its width.
 * More reliable than container-query units across mobile browsers.
 */
export default function usePhoneArtboardScale() {
  const screenRef = useRef(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const node = screenRef.current
    if (!node || typeof ResizeObserver === 'undefined') return undefined

    const update = () => {
      const width = node.getBoundingClientRect().width
      if (width > 0) setScale(width / ART_W)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { screenRef, scale }
}
