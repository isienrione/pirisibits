/**
 * Draw an image with CSS object-fit: cover behavior onto a canvas context.
 */
export function drawCoverImage(ctx, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  const offsetX = (width - drawWidth) / 2
  const offsetY = (height - drawHeight) / 2

  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
}

export function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load overlay image: ${src}`))
    image.referrerPolicy = 'no-referrer'
    image.src = src
  })
}

/**
 * @param {{
 *   video: HTMLVideoElement,
 *   overlaySrc: string,
 *   opacity: number,
 *   width?: number,
 *   height?: number,
 * }} options
 */
export async function captureOverlayFrame({
  video,
  overlaySrc,
  opacity,
  width = video.videoWidth,
  height = video.videoHeight,
}) {
  if (!width || !height) {
    throw new Error('Camera frame is not ready yet.')
  }

  const overlayImage = await loadImageElement(overlaySrc)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas is unavailable.')
  }

  context.drawImage(video, 0, 0, width, height)
  context.globalAlpha = opacity
  drawCoverImage(context, overlayImage, width, height)
  context.globalAlpha = 1

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Capture failed.'))
    }, 'image/png')
  })
}

export function downloadCapture(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
