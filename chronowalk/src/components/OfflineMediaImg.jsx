import { useCallback, useEffect, useRef, useState } from 'react'
import { mediaUrl } from '../lib/mediaUrl.js'

/**
 * Resolve a manifest/CDN media URL to a Cache API blob when offline.
 * Safe for <img>, background-image, and lightbox surfaces that are not Threshold.
 */
export function useOfflineMediaUrl(src) {
  const [resolvedSrc, setResolvedSrc] = useState(() => mediaUrl(src) ?? src)
  const [failed, setFailed] = useState(!src)
  const generationRef = useRef(0)

  useEffect(() => {
    const generation = ++generationRef.current
    if (!src) {
      setResolvedSrc(null)
      setFailed(true)
      return undefined
    }

    const initial = mediaUrl(src) ?? src
    setResolvedSrc(initial)
    setFailed(false)

    if (String(initial).startsWith('blob:')) return undefined

    let cancelled = false
    void import('../audio/offlinePackage.js')
      .then((m) => m.hydrateCachedManifestPath(src, { kind: 'media' }))
      .then((blobUrl) => {
        if (cancelled || generation !== generationRef.current) return
        if (blobUrl) {
          setResolvedSrc(blobUrl)
          setFailed(false)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [src])

  const onError = useCallback(() => {
    const generation = generationRef.current
    if (!src || String(resolvedSrc).startsWith('blob:')) {
      setFailed(true)
      return
    }
    void import('../audio/offlinePackage.js')
      .then((m) => m.hydrateCachedManifestPath(src, { kind: 'media' }))
      .then((blobUrl) => {
        if (generation !== generationRef.current) return
        if (blobUrl) {
          setResolvedSrc(blobUrl)
          setFailed(false)
          return
        }
        setFailed(true)
      })
      .catch(() => {
        if (generation === generationRef.current) setFailed(true)
      })
  }, [src, resolvedSrc])

  return { src: failed ? null : resolvedSrc, failed, onError }
}

/** Drop-in <img> that hydrates from the Rome offline Cache API. */
export function OfflineMediaImg({ src, alt = '', className, style, width, height, decoding = 'async' }) {
  const media = useOfflineMediaUrl(src)
  if (!media.src) {
    return (
      <span
        className={className}
        style={{
          ...style,
          display: 'inline-block',
          background:
            'linear-gradient(160deg, var(--ink, #1a1814) 0%, color-mix(in srgb, var(--ember, #e8a13c) 22%, var(--obsidian, #0b0b0d)) 100%)',
        }}
        aria-hidden={!alt}
        data-testid="offline-media-img-fallback"
      />
    )
  }
  return (
    <img
      className={className}
      style={style}
      src={media.src}
      alt={alt}
      width={width}
      height={height}
      decoding={decoding}
      onError={media.onError}
    />
  )
}
