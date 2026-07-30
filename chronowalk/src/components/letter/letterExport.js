function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildLetterCardSvg(letter, meander) {
  const width = 800
  const height = 1100
  const safeTitle = escapeXml(letter.title)
  const safeBody = escapeXml(letter.body)
  const safeReflection = escapeXml(letter.reflection ?? '')
  const path = meander.points.length ? meander.path : ''

  const dots = meander.points
    .map(
      (point) =>
        `<circle cx="${40 + (point.x / 360) * 720}" cy="${220 + (point.y / 180) * 180}" r="5" fill="#E4552E" />`
    )
    .join('')

  const safeSalutation = escapeXml(`Dear ${letter.firstName || 'Traveler'} -`)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#FAF6EF" />
  <text x="56" y="72" fill="#211C15" font-family="DM Sans, system-ui, sans-serif" font-size="14" letter-spacing="3">JOURNEY LETTER</text>
  <text x="56" y="132" fill="#211C15" font-family="Fraunces, Georgia, serif" font-size="42" font-weight="600">${safeTitle}</text>
  <rect x="56" y="170" width="688" height="260" rx="18" fill="#EFE7D8" />
  ${path ? `<path d="${path}" transform="translate(40 220) scale(2)" fill="none" stroke="#E4552E" stroke-width="3" stroke-linecap="round" />` : ''}
  ${dots}
  <foreignObject x="56" y="450" width="688" height="300">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Fraunces, Georgia, serif; font-size: 22px; line-height: 1.55; color: #211C15;">
      <p style="margin: 0 0 16px; font-weight: 300;">${safeSalutation}</p>
      <p style="margin: 0; font-family: DM Sans, system-ui, sans-serif; font-size: 20px;">${safeBody}</p>
    </div>
  </foreignObject>
  <text x="56" y="820" fill="#4F7A6A" font-family="Fraunces, Georgia, serif" font-size="24" font-style="italic">${safeReflection}</text>
  <text x="56" y="1040" fill="#B9AF9C" font-family="DM Sans, system-ui, sans-serif" font-size="14" letter-spacing="2">CHRONOWALK · ${escapeXml(letter.city)}</text>
</svg>`
}

async function svgToPngBlob(svgMarkup) {
  const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to render letter card'))
      img.src = svgUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 1100
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0)

    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('PNG export failed'))
      }, 'image/png')
    })
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}

export async function saveLetterCard(letter, meander) {
  const svg = buildLetterCardSvg(letter, meander)
  const filename = `chronowalk-${letter.city?.toLowerCase() ?? 'rome'}-letter.png`

  // Prefer navigator.share with the image file (works on iOS/Android).
  try {
    const blob = await svgToPngBlob(svg)
    const file = new File([blob], filename, { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: letter.title, files: [file] })
      return 'share'
    }
  } catch {
    // fall through to download
  }

  // Blob URL download (standard desktop / Android Chrome).
  try {
    const blob = await svgToPngBlob(svg)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    return 'download'
  } catch (blobErr) {
    // SecurityError or insecure context · use data URL fallback.
    const isSecurityError =
      blobErr instanceof DOMException &&
      (blobErr.name === 'SecurityError' || blobErr.code === 18)
    if (!isSecurityError) throw blobErr
  }

  // Last resort: open image in new tab and prompt user to long-press to save.
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 1100
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        canvas.getContext('2d').drawImage(img, 0, 0)
        resolve()
      }
      img.onerror = reject
      img.src = svgUrl
    })
    URL.revokeObjectURL(svgUrl)
    const dataUrl = canvas.toDataURL('image/png')
    const win = window.open()
    if (win) {
      win.document.write(`<img src="${dataUrl}" style="max-width:100%" /><p>Long-press the image to save.</p>`)
    }
    return 'fallback'
  } catch {
    return 'error'
  }
}

export async function shareLetterCard(letter, meander) {
  const filename = `chronowalk-${letter.city?.toLowerCase() ?? 'rome'}-letter.png`

  // Prefer sharing the rendered PNG image.
  if (navigator.share) {
    try {
      const svg = buildLetterCardSvg(letter, meander)
      const blob = await svgToPngBlob(svg)
      const file = new File([blob], filename, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: letter.title, files: [file] })
        return 'share'
      }
    } catch {
      // Image share failed; fall through to download.
    }
  }

  // Fall back to downloading the image so the user can share it manually.
  return saveLetterCard(letter, meander)
}
