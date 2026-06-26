import { useEffect, useState } from 'react'

/**
 * Tracks programmatic image preload status for skeleton → fade-in handoff.
 * @returns {'idle' | 'loading' | 'ready' | 'error'}
 */
export function useImageLoadState(url) {
  const [status, setStatus] = useState(url ? 'loading' : 'idle')

  useEffect(() => {
    if (!url) {
      setStatus('idle')
      return undefined
    }

    let cancelled = false
    setStatus('loading')

    const image = new Image()
    image.onload = () => {
      if (!cancelled) setStatus('ready')
    }
    image.onerror = () => {
      if (!cancelled) setStatus('error')
    }
    image.referrerPolicy = 'no-referrer'
    image.src = url

    return () => {
      cancelled = true
    }
  }, [url])

  return status
}

export default useImageLoadState
