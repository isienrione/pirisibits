import { useEffect, useRef } from 'react'

/**
 * Screen-reader announcements for dynamic tour events (arrivals, unlocks).
 */
export function LiveAnnouncer({ message }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!message || !ref.current) return
    ref.current.textContent = ''
    window.requestAnimationFrame(() => {
      if (ref.current) ref.current.textContent = message
    })
  }, [message])

  return (
    <div
      ref={ref}
      className="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    />
  )
}

export default LiveAnnouncer
