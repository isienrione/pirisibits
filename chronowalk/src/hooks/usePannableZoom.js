import { useCallback, useRef, useState } from 'react'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function distanceBetween(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/**
 * Lightweight pinch-to-zoom and pan for a single full-screen layer.
 */
export function usePannableZoom({ minScale = 1, maxScale = 4 } = {}) {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 })
  const pointersRef = useRef(new Map())
  const panOriginRef = useRef(null)
  const pinchOriginRef = useRef(null)

  const commitTransform = useCallback(
    (updater) => {
      setTransform((current) => {
        const next = updater(current)
        return {
          scale: clamp(next.scale, minScale, maxScale),
          x: next.x,
          y: next.y,
        }
      })
    },
    [maxScale, minScale]
  )

  const reset = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 })
    pointersRef.current.clear()
    panOriginRef.current = null
    pinchOriginRef.current = null
  }, [])

  const onWheel = useCallback(
    (event) => {
      event.preventDefault()

      const rect = event.currentTarget.getBoundingClientRect()
      const px = event.clientX - rect.left - rect.width / 2
      const py = event.clientY - rect.top - rect.height / 2
      const delta = -event.deltaY * 0.0015

      commitTransform((current) => {
        const nextScale = clamp(current.scale * (1 + delta), minScale, maxScale)
        const scaleRatio = nextScale / current.scale

        return {
          scale: nextScale,
          x: current.x - px * (scaleRatio - 1),
          y: current.y - py * (scaleRatio - 1),
        }
      })
    },
    [commitTransform, maxScale, minScale]
  )

  const onPointerDown = useCallback(
    (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return

      event.currentTarget.setPointerCapture(event.pointerId)
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

      if (pointersRef.current.size === 1) {
        panOriginRef.current = {
          x: transform.x,
          y: transform.y,
          px: event.clientX,
          py: event.clientY,
        }
      }

      if (pointersRef.current.size === 2) {
        const points = [...pointersRef.current.values()]
        pinchOriginRef.current = {
          distance: distanceBetween(points[0], points[1]),
          scale: transform.scale,
          x: transform.x,
          y: transform.y,
          midpoint: midpoint(points[0], points[1]),
        }
        panOriginRef.current = null
      }
    },
    [transform.scale, transform.x, transform.y]
  )

  const onPointerMove = useCallback(
    (event) => {
      if (!pointersRef.current.has(event.pointerId)) return

      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

      if (pointersRef.current.size >= 2 && pinchOriginRef.current) {
        const points = [...pointersRef.current.values()]
        const nextDistance = distanceBetween(points[0], points[1])
        const ratio = nextDistance / pinchOriginRef.current.distance
        const nextScale = clamp(pinchOriginRef.current.scale * ratio, minScale, maxScale)

        commitTransform(() => ({
          scale: nextScale,
          x: pinchOriginRef.current.x,
          y: pinchOriginRef.current.y,
        }))
        return
      }

      if (pointersRef.current.size === 1 && panOriginRef.current) {
        const dx = event.clientX - panOriginRef.current.px
        const dy = event.clientY - panOriginRef.current.py

        commitTransform((current) => ({
          scale: current.scale,
          x: panOriginRef.current.x + dx,
          y: panOriginRef.current.y + dy,
        }))
      }
    },
    [commitTransform, maxScale, minScale]
  )

  const onPointerUp = useCallback((event) => {
    pointersRef.current.delete(event.pointerId)

    if (pointersRef.current.size < 2) {
      pinchOriginRef.current = null
    }

    if (pointersRef.current.size === 1) {
      const remaining = [...pointersRef.current.entries()][0]
      panOriginRef.current = {
        x: transform.x,
        y: transform.y,
        px: remaining[1].x,
        py: remaining[1].y,
      }
    } else {
      panOriginRef.current = null
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [transform.x, transform.y])

  const bind = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onWheel,
    style: { touchAction: 'none' },
  }

  return {
    transform,
    bind,
    reset,
  }
}

export default usePannableZoom
