import { useCallback, useEffect, useRef, useState } from 'react'
import { mediaUrl, networkMediaUrl, unregisterCachedMedia } from '../lib/mediaUrl.js'

/**
 * Resolve a manifest/CDN media URL to a Cache API blob when available.
 * On blob paint failure, fall back to the network URL (never stay black).
 */
export function useOfflineMediaUrl(src) {
  const [resolvedSrc, setResolvedSrc] = useState(() => mediaUrl(src) ?? src)
  const [failed, setFailed] = useState(!src)
  const generationRef = useRef(0)
  const triedNetworkFallbackRef = useRef(false)

  useEffect(() => {
    const generation = ++generationRef.current
    triedNetworkFallbackRef.current = false
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
    if (!src) {
      setFailed(true)
      return
    }

    // Poisoned/corrupt offline blob (or SPA HTML cached as media) · drop it and
    // retry the real network URL once before giving up.
    if (String(resolvedSrc).startsWith('blob:')) {
      unregisterCachedMedia(src)
      const network = networkMediaUrl(src)
      if (network && network !== resolvedSrc && !triedNetworkFallbackRef.current) {
        triedNetworkFallbackRef.current = true
        setResolvedSrc(network)
        setFailed(false)
        return
      }
      setFailed(true)
      return
    }

    if (triedNetworkFallbackRef.current) {
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
        const network = networkMediaUrl(src)
        if (network && network !== resolvedSrc) {
          triedNetworkFallbackRef.current = true
          setResolvedSrc(network)
          setFailed(false)
          return
        }
        setFailed(true)
      })
      .catch(() => {
        if (generation !== generationRef.current) return
        const network = networkMediaUrl(src)
        if (network && network !== resolvedSrc && !triedNetworkFallbackRef.current) {
          triedNetworkFallbackRef.current = true
          setResolvedSrc(network)
          setFailed(false)
          return
        }
        setFailed(true)
      })
  }, [src, resolvedSrc])

  return { src: failed ? null : resolvedSrc, failed, onError }
}

/** Drop-in <img> that hydrates from the Rome offline Cache API. */
export function OfflineMediaImg({
  src,
  alt = '',
  className,
  style,
  width,
  height,
  decoding = 'async',
  'data-testid': dataTestId,
}) {
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
        data-testid={dataTestId ?? 'offline-media-img-fallback'}
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
      data-testid={dataTestId}
    />
  )
}
