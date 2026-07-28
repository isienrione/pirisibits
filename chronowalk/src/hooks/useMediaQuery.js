import { useEffect, useState } from 'react'

/**
 * Subscribe to a CSS media query. When matchMedia is unavailable (SSR / some test envs),
 * returns `fallback` (default true) so desktop layouts remain the safe default.
 * @param {string} query
 * @param {boolean} [fallback=true]
 */
export function useMediaQuery(query, fallback = true) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return fallback
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined
    const mediaQuery = window.matchMedia(query)
    const onChange = (event) => setMatches(event.matches)
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [query])

  return matches
}
