import { useCallback, useEffect, useId, useState } from 'react'
import { BottomSheet, Button, cn } from './ui'
import { track } from '../analytics/analytics'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { getAncientPosterUrl, getModernPosterUrl } from '../utils/sliderMedia'

const EXPORT_WIDTH = 1000
const EXPORT_HEIGHT = 1250

async function loadImageDataUrl(src) {
  const response = await fetch(src)
  if (!response.ok) {
    throw new Error(`Failed to load image: ${src}`)
  }

  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read image data'))
    reader.readAsDataURL(blob)
  })
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildShareSvg({ modernDataUrl, ancientDataUrl, title, eraLabel }) {
  const safeTitle = escapeXml(title)
  const safeEra = escapeXml(eraLabel)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${EXPORT_WIDTH}" height="${EXPORT_HEIGHT}" viewBox="0 0 ${EXPORT_WIDTH} ${EXPORT_HEIGHT}">
  <defs>
    <clipPath id="modernHalf">
      <rect x="0" y="0" width="${EXPORT_WIDTH / 2}" height="${EXPORT_HEIGHT}" />
    </clipPath>
    <clipPath id="ancientHalf">
      <rect x="${EXPORT_WIDTH / 2}" y="0" width="${EXPORT_WIDTH / 2}" height="${EXPORT_HEIGHT}" />
    </clipPath>
    <linearGradient id="footFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#17212B" stop-opacity="0" />
      <stop offset="55%" stop-color="#17212B" stop-opacity="0.72" />
      <stop offset="100%" stop-color="#17212B" stop-opacity="0.94" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="#17212B" />
  <image href="${modernDataUrl}" x="0" y="0" width="${EXPORT_WIDTH}" height="${EXPORT_HEIGHT}" preserveAspectRatio="xMidYMid slice" clip-path="url(#modernHalf)" />
  <image href="${ancientDataUrl}" x="0" y="0" width="${EXPORT_WIDTH}" height="${EXPORT_HEIGHT}" preserveAspectRatio="xMidYMid slice" clip-path="url(#ancientHalf)" />
  <rect x="${EXPORT_WIDTH / 2 - 1}" y="0" width="2" height="${EXPORT_HEIGHT}" fill="#D9A441" />
  <text x="48" y="72" fill="#FFFDF8" font-family="DM Sans, system-ui, sans-serif" font-size="22" font-weight="600" letter-spacing="5.5">TODAY</text>
  <text x="${EXPORT_WIDTH - 48}" y="88" fill="#D9A441" font-family="Fraunces, Georgia, serif" font-size="44" font-style="italic" text-anchor="end">${safeEra}</text>
  <rect x="0" y="${EXPORT_HEIGHT - 280}" width="${EXPORT_WIDTH}" height="280" fill="url(#footFade)" />
  <text x="56" y="${EXPORT_HEIGHT - 118}" fill="#FFFDF8" font-family="Fraunces, Georgia, serif" font-size="52" font-weight="600">${safeTitle}</text>
  <circle cx="56" cy="${EXPORT_HEIGHT - 52}" r="7" fill="#D9A441" />
  <text x="76" y="${EXPORT_HEIGHT - 44}" fill="#FFFDF8" font-family="DM Sans, system-ui, sans-serif" font-size="24" font-weight="600" letter-spacing="4">CHRONOWALK</text>
</svg>`
}

async function renderSharePng({ modernSrc, ancientSrc, title, eraLabel }) {
  const [modernDataUrl, ancientDataUrl] = await Promise.all([
    loadImageDataUrl(modernSrc),
    loadImageDataUrl(ancientSrc),
  ])

  const svgMarkup = buildShareSvg({
    modernDataUrl,
    ancientDataUrl,
    title,
    eraLabel,
  })

  const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to render share card'))
      img.src = svgUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = EXPORT_WIDTH
    canvas.height = EXPORT_HEIGHT
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result)
        else reject(new Error('PNG export failed'))
      }, 'image/png')
    })

    return blob
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ShareCardPreview({ modernSrc, ancientSrc, title, eraLabel = 'Ancient Rome' }) {
  return (
    <div
      className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl border border-limestone/70 bg-deep-slate shadow-glass-lg"
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex">
        <div className="relative h-full w-1/2 overflow-hidden">
          <img src={modernSrc} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="relative h-full w-1/2 overflow-hidden">
          <img src={ancientSrc} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, #D9A441 18%, #FFFDF8 50%, #D9A441 82%, transparent 100%)',
          boxShadow: '0 0 18px rgba(217, 164, 65, 0.55)',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between px-4 pt-4">
        <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-warm-white drop-shadow-md">
          Today
        </p>
        <p className="font-display text-xl italic text-gold drop-shadow-md">{eraLabel}</p>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-deep-slate/95 via-deep-slate/70 to-transparent px-5 pb-5 pt-16">
        <p className="font-display text-2xl font-semibold text-warm-white">{title}</p>
        <p className="mt-2 flex items-center gap-2 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-warm-white/90">
          <span className="inline-block h-2 w-2 rounded-full bg-gold" aria-hidden="true" />
          ChronoWalk
        </p>
      </div>
      <div className="grain-overlay" aria-hidden="true" />
    </div>
  )
}

export function ShareCard({
  waypoint,
  modernSrc,
  ancientSrc,
  open,
  onClose,
  eraLabel = 'Ancient Rome',
}) {
  const titleId = useId()
  const reducedMotion = useReducedMotion()
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)

  const resolvedModern = modernSrc ?? (waypoint ? getModernPosterUrl(waypoint) : null)
  const resolvedAncient = ancientSrc ?? (waypoint ? getAncientPosterUrl(waypoint) : null)
  const title = waypoint?.title ?? 'Rome landmark'

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const exportPng = useCallback(async () => {
    if (!resolvedModern || !resolvedAncient) {
      throw new Error('Share images are not ready yet.')
    }

    return renderSharePng({
      modernSrc: resolvedModern,
      ancientSrc: resolvedAncient,
      title,
      eraLabel,
    })
  }, [eraLabel, resolvedAncient, resolvedModern, title])

  const handleSave = async () => {
    setBusy(true)
    try {
      const blob = await exportPng()
      const slug = waypoint?.id ?? 'chronowalk'
      downloadBlob(blob, `chronowalk-${slug}.png`)
      if (waypoint?.id) {
        track('view_shared', { stopId: waypoint.id })
      }
    } catch (error) {
      console.error('ShareCard save failed:', error)
      setToast('Could not save image. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  const handleShare = async () => {
    setBusy(true)
    try {
      const blob = await exportPng()
      const slug = waypoint?.id ?? 'chronowalk'
      const file = new File([blob], `chronowalk-${slug}.png`, { type: 'image/png' })
      const shareData = {
        files: [file],
        title: `${title} — ChronoWalk`,
        text: `Then and now at ${title} with ChronoWalk.`,
      }

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
        if (waypoint?.id) {
          track('view_shared', { stopId: waypoint.id })
        }
        return
      }

      downloadBlob(blob, `chronowalk-${slug}.png`)
      if (waypoint?.id) {
        track('view_shared', { stopId: waypoint.id })
      }
      setToast('Download started — press and hold the image to save on some devices.')
    } catch (error) {
      if (error?.name === 'AbortError') return
      console.error('ShareCard share failed:', error)
      setToast('Press and hold to save, or use Save image.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <BottomSheet
      open={open}
      onHandleClick={onClose}
      onEscape={onClose}
      handleLabel="Close share card"
      ariaLabelledBy={titleId}
      className="z-[360]"
    >
      <div className={cn('pb-2', reducedMotion ? '' : 'motion-safe-transition')}>
        <h2 id={titleId} className="font-display text-2xl font-semibold text-deep-slate">
          Share this reveal
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-soft-slate">
          A screenshot-ready before-and-after card for {title}.
        </p>

        {resolvedModern && resolvedAncient ? (
          <div className="mt-5">
            <ShareCardPreview
              modernSrc={resolvedModern}
              ancientSrc={resolvedAncient}
              title={title}
              eraLabel={eraLabel}
            />
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-limestone/70 bg-sand/40 px-4 py-3 text-sm text-soft-slate">
            Poster frames are still loading for this landmark.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button fullWidth disabled={busy || !resolvedModern || !resolvedAncient} onClick={handleShare}>
            Share
          </Button>
          <Button
            variant="secondary"
            fullWidth
            disabled={busy || !resolvedModern || !resolvedAncient}
            onClick={handleSave}
          >
            Save image
          </Button>
        </div>

        {toast ? (
          <p className="mt-4 rounded-2xl border border-limestone/70 bg-sand/50 px-4 py-3 text-sm text-deep-slate" role="status">
            {toast}
          </p>
        ) : null}
      </div>
    </BottomSheet>
  )
}

export default ShareCard
