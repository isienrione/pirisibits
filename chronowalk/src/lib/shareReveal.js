/**
 * Render a branded Then/Now composite and share via the native share sheet (iOS)
 * or Web Share / download fallback (web).
 */
import { IS_IOS } from './platform.js'

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('missing_src'))
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image_load_failed'))
    img.src = src
  })
}

/**
 * @returns {Promise<Blob>}
 */
export async function renderRevealShareBlob({
  thenSrc,
  nowSrc,
  stopName = 'Rome',
  width = 1200,
  height = 900,
} = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas_unavailable')

  // Background
  ctx.fillStyle = '#16130F'
  ctx.fillRect(0, 0, width, height)

  const pad = 36
  const gap = 18
  const headerH = 88
  const footerH = 64
  const imgW = (width - pad * 2 - gap) / 2
  const imgH = height - headerH - footerH - pad

  const [thenImg, nowImg] = await Promise.all([
    loadImage(thenSrc).catch(() => null),
    loadImage(nowSrc).catch(() => null),
  ])

  function drawCover(img, x, y, w, h) {
    if (!img) {
      ctx.fillStyle = '#2A241C'
      ctx.fillRect(x, y, w, h)
      return
    }
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    const dx = x + (w - dw) / 2
    const dy = y + (h - dh) / 2
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.clip()
    ctx.drawImage(img, dx, dy, dw, dh)
    ctx.restore()
  }

  // Title
  ctx.fillStyle = '#F5F0E8'
  ctx.font = '600 36px Georgia, serif'
  ctx.fillText(stopName || 'Rome', pad, 52)
  ctx.font = '500 18px system-ui, sans-serif'
  ctx.fillStyle = '#C4A35A'
  ctx.fillText('Then  ·  Now', pad, 78)

  drawCover(thenImg, pad, headerH, imgW, imgH)
  drawCover(nowImg, pad + imgW + gap, headerH, imgW, imgH)

  // Labels
  ctx.fillStyle = 'rgba(22,19,15,0.72)'
  ctx.fillRect(pad, headerH + imgH - 36, 72, 28)
  ctx.fillRect(pad + imgW + gap, headerH + imgH - 36, 72, 28)
  ctx.fillStyle = '#F5F0E8'
  ctx.font = '600 14px system-ui, sans-serif'
  ctx.fillText('THEN', pad + 14, headerH + imgH - 16)
  ctx.fillText('NOW', pad + imgW + gap + 16, headerH + imgH - 16)

  // Wordmark
  ctx.fillStyle = '#C4A35A'
  ctx.font = '600 20px Georgia, serif'
  ctx.fillText('ChronoWalk', pad, height - 28)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('blob_failed'))
        else resolve(blob)
      },
      'image/jpeg',
      0.92,
    )
  })
}

/**
 * Share the composite — Filesystem + Share on iOS; navigator.share / download on web.
 */
export async function shareRevealComposite({ thenSrc, nowSrc, stopName }) {
  const blob = await renderRevealShareBlob({ thenSrc, nowSrc, stopName })
  const fileName = `chronowalk-${String(stopName || 'rome')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}.jpg`

  if (IS_IOS) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const { Share } = await import('@capacitor/share')

    const buffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    const base64 = btoa(binary)

    const written = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    })

    await Share.share({
      title: stopName ? `${stopName} — ChronoWalk Rome` : 'ChronoWalk Rome',
      text: stopName ? `Then & Now at ${stopName}` : 'Then & Now — ChronoWalk Rome',
      url: written.uri,
      dialogTitle: 'Save / Share',
    })
    return { ok: true, via: 'capacitor_share' }
  }

  const file = new File([blob], fileName, { type: 'image/jpeg' })
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: stopName ? `${stopName} — ChronoWalk` : 'ChronoWalk',
      text: stopName ? `Then & Now at ${stopName}` : 'Then & Now',
    })
    return { ok: true, via: 'web_share' }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
  return { ok: true, via: 'download' }
}
