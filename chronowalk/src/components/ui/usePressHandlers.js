import { useCallback, useRef } from 'react'

/**
 * Reliable tap/click for mobile Safari where the first touch can be consumed by
 * hover states, composited overlays, or backdrop-filter instead of firing click.
 * Touch and pen pointers activate on pointerup; mouse keeps native click.
 */
export function usePressHandlers(onClick, { onPointerUp, onPointerDown, onPointerCancel } = {}) {
  const touchActivatedRef = useRef(false)

  const handlePointerDown = useCallback(
    (event) => {
      onPointerDown?.(event)
      if (event.pointerType === 'touch' || event.pointerType === 'pen') {
        touchActivatedRef.current = false
      }
    },
    [onPointerDown]
  )

  const handlePointerUp = useCallback(
    (event) => {
      onPointerUp?.(event)
      if (!onClick) return
      if (event.pointerType === 'mouse' && event.button !== 0) return

      if (event.pointerType === 'touch' || event.pointerType === 'pen') {
        event.preventDefault()
        touchActivatedRef.current = true
        onClick(event)
      }
    },
    [onClick, onPointerUp]
  )

  const handlePointerCancel = useCallback(
    (event) => {
      onPointerCancel?.(event)
      touchActivatedRef.current = false
    },
    [onPointerCancel]
  )

  const handleClick = useCallback(
    (event) => {
      if (touchActivatedRef.current) {
        touchActivatedRef.current = false
        event.preventDefault()
        return
      }
      onClick?.(event)
    },
    [onClick]
  )

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onClick: handleClick,
  }
}

export default usePressHandlers
