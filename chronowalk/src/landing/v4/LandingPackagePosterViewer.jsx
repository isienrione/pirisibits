import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

const MIN_SCALE = 1
const MAX_SCALE = 4
const ZOOM_STEP = 0.35
const FOCUSABLE =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

const DEFAULT_HINT =
  'Pinch or double-tap to zoom in on details. Drag to pan when zoomed.'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Accessible full-screen image viewer with pinch/pan zoom.
 * Optional sticky action bar for package checkout.
 */
export function LandingZoomableImageViewer({
  open,
  title,
  src,
  width,
  height,
  alt = '',
  hint = DEFAULT_HINT,
  accent = 'eterna',
  action = null,
  onClose,
  returnFocusRef,
}) {
  const titleId = useId()
  const reducedMotion = useReducedMotion()
  const dialogRef = useRef(null)
  const stageRef = useRef(null)
  const imgRef = useRef(null)
  const pointersRef = useRef(new Map())
  const pinchRef = useRef(null)
  const panRef = useRef(null)
  const lastTapRef = useRef(0)

  const [scale, setScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const [hintVisible, setHintVisible] = useState(false)

  const resetView = useCallback(() => {
    setScale(1)
    setTx(0)
    setTy(0)
  }, [])

  const dismissHint = useCallback(() => {
    setHintVisible(false)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    resetView()
    setHintVisible(Boolean(hint))
    if (!hint) return undefined
    const timer = window.setTimeout(() => setHintVisible(false), reducedMotion ? 1800 : 4200)
    return () => window.clearTimeout(timer)
  }, [open, hint, reducedMotion, resetView])

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusReturn = returnFocusRef

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose?.()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE)]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    const frame = window.requestAnimationFrame(() => {
      const closeBtn = dialogRef.current?.querySelector('[data-viewer-close]')
      closeBtn?.focus({ preventScroll: true })
    })

    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      const node = focusReturn?.current
      if (node && typeof node.focus === 'function') {
        window.requestAnimationFrame(() => node.focus({ preventScroll: true }))
      }
    }
  }, [open, onClose, returnFocusRef])

  useEffect(() => {
    if (!open) return undefined
    const onResize = () => resetView()
    window.addEventListener('orientationchange', onResize)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('orientationchange', onResize)
      window.removeEventListener('resize', onResize)
    }
  }, [open, resetView])

  const constrainTranslation = useCallback((nextScale, nextTx, nextTy) => {
    const stage = stageRef.current
    const img = imgRef.current
    if (!stage || !img) return { tx: nextTx, ty: nextTy }
    const stageBox = stage.getBoundingClientRect()
    const naturalW = img.naturalWidth || img.width || 1
    const naturalH = img.naturalHeight || img.height || 1
    const fit = Math.min(stageBox.width / naturalW, stageBox.height / naturalH)
    const displayW = naturalW * fit * nextScale
    const displayH = naturalH * fit * nextScale
    const maxX = Math.max(0, (displayW - stageBox.width) / 2)
    const maxY = Math.max(0, (displayH - stageBox.height) / 2)
    return {
      tx: clamp(nextTx, -maxX, maxX),
      ty: clamp(nextTy, -maxY, maxY),
    }
  }, [])

  const applyScaleAt = useCallback(
    (nextScale, originX, originY) => {
      const stage = stageRef.current
      if (!stage) {
        setScale(nextScale)
        return
      }
      const box = stage.getBoundingClientRect()
      const cx = originX - box.left - box.width / 2
      const cy = originY - box.top - box.height / 2
      const ratio = nextScale / scale
      const tentativeTx = cx - (cx - tx) * ratio
      const tentativeTy = cy - (cy - ty) * ratio
      const constrained = constrainTranslation(nextScale, tentativeTx, tentativeTy)
      setScale(nextScale)
      setTx(constrained.tx)
      setTy(constrained.ty)
    },
    [constrainTranslation, scale, tx, ty],
  )

  const zoomBy = useCallback(
    (delta) => {
      const stage = stageRef.current
      if (!stage) {
        setScale((s) => clamp(s + delta, MIN_SCALE, MAX_SCALE))
        return
      }
      const box = stage.getBoundingClientRect()
      const next = clamp(scale + delta, MIN_SCALE, MAX_SCALE)
      applyScaleAt(next, box.left + box.width / 2, box.top + box.height / 2)
    },
    [applyScaleAt, scale],
  )

  const onPointerDown = (event) => {
    dismissHint()
    const stage = stageRef.current
    if (!stage) return
    stage.setPointerCapture?.(event.pointerId)
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointersRef.current.size === 1) {
      panRef.current = { x: event.clientX, y: event.clientY, tx, ty }
      const now = Date.now()
      if (now - lastTapRef.current < 280 && scale <= 1.05) {
        applyScaleAt(2.2, event.clientX, event.clientY)
        lastTapRef.current = 0
      } else if (now - lastTapRef.current < 280 && scale > 1.05) {
        resetView()
        lastTapRef.current = 0
      } else {
        lastTapRef.current = now
      }
    }

    if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()]
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      pinchRef.current = {
        dist,
        scale,
        midX: (pts[0].x + pts[1].x) / 2,
        midY: (pts[0].y + pts[1].y) / 2,
      }
      panRef.current = null
    }
  }

  const onPointerMove = (event) => {
    if (!pointersRef.current.has(event.pointerId)) return
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = [...pointersRef.current.values()]
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      if (pinchRef.current.dist > 0) {
        const next = clamp(
          pinchRef.current.scale * (dist / pinchRef.current.dist),
          MIN_SCALE,
          MAX_SCALE,
        )
        applyScaleAt(next, pinchRef.current.midX, pinchRef.current.midY)
      }
      return
    }

    if (pointersRef.current.size === 1 && panRef.current && scale > 1.01) {
      const dx = event.clientX - panRef.current.x
      const dy = event.clientY - panRef.current.y
      const constrained = constrainTranslation(
        scale,
        panRef.current.tx + dx,
        panRef.current.ty + dy,
      )
      setTx(constrained.tx)
      setTy(constrained.ty)
    }
  }

  const onPointerUp = (event) => {
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current = null
    if (pointersRef.current.size === 0) panRef.current = null
  }

  if (!open || !src || typeof document === 'undefined') return null

  const transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`
  const transition = reducedMotion ? 'none' : 'transform 120ms ease-out'
  const hasAction = Boolean(action?.ctaLabel && action?.onCta)
  const zoomed = scale > 1.05

  return createPortal(
    <div
      className={`cw-v4-poster-viewer cw-v4-poster-viewer--${accent}${zoomed ? ' is-zoomed' : ''}${hasAction ? ' has-action' : ''}`}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="cw-v4-poster-viewer__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="cw-v4-visually-hidden">
          {title}
        </h2>

        <div
          ref={stageRef}
          className="cw-v4-poster-viewer__stage"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <img
            ref={imgRef}
            className="cw-v4-poster-viewer__image"
            src={src}
            alt={alt}
            width={width}
            height={height}
            draggable={false}
            style={{ transform, transition }}
          />
        </div>

        <div className="cw-v4-poster-viewer__overlay">
          <div className="cw-v4-poster-viewer__tools" role="group" aria-label="Zoom controls">
            <button
              type="button"
              className="cw-v4-poster-viewer__tool"
              onClick={() => {
                dismissHint()
                zoomBy(ZOOM_STEP)
              }}
              aria-label="Zoom in"
            >
              <ZoomIn size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="cw-v4-poster-viewer__tool"
              onClick={() => {
                dismissHint()
                zoomBy(-ZOOM_STEP)
              }}
              aria-label="Zoom out"
            >
              <ZoomOut size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="cw-v4-poster-viewer__tool"
              onClick={() => {
                dismissHint()
                resetView()
              }}
              aria-label="Reset zoom"
            >
              <RotateCcw size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="cw-v4-poster-viewer__tool cw-v4-poster-viewer__tool--close"
              data-viewer-close
              onClick={() => onClose?.()}
              aria-label="Close viewer"
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>

          {hint && hintVisible ? (
            <p className="cw-v4-poster-viewer__hint" role="status">
              {hint}
            </p>
          ) : null}
        </div>

        {hasAction ? (
          <div className="cw-v4-poster-viewer__actionbar">
            <div className="cw-v4-poster-viewer__action-meta">
              {action.name ? <p className="cw-v4-poster-viewer__action-name">{action.name}</p> : null}
              {action.price ? <p className="cw-v4-poster-viewer__action-price">{action.price}</p> : null}
            </div>
            <button
              type="button"
              className="cw-v4-poster-viewer__cta"
              onClick={() => action.onCta?.()}
            >
              {action.ctaLabel}
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

/**
 * Package-card wrapper — same checkout handler as the mobile CTA.
 */
export function LandingPackagePosterViewer({
  open,
  tier,
  onClose,
  onBeginTier,
  returnFocusRef,
}) {
  if (!tier) return null
  return (
    <LandingZoomableImageViewer
      open={open}
      title={`${tier.name} illustrated route map`}
      src={tier.cardImage}
      width={tier.cardWidth}
      height={tier.cardHeight}
      alt=""
      accent={tier.theme ?? 'eterna'}
      hint="Pinch or double-tap to zoom in on monuments and route details. Drag to pan."
      action={{
        name: tier.name,
        price: tier.price,
        ctaLabel: tier.primaryCta,
        onCta: () => onBeginTier?.(tier.id),
      }}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
    />
  )
}
