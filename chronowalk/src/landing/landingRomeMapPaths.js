import { projectRouteStops } from './landingTierRoutes.js'

export function buildPolygonD(ring, options) {
  const points = projectRouteStops(ring, options)
  if (!points.length) return ''
  const [first, ...rest] = points
  return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} ${rest
    .map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')} Z`
}

export function buildLineD(line, options) {
  const points = projectRouteStops(line, options)
  if (points.length < 2) return ''
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')
}

export function buildSmoothRouteD(points) {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[Math.max(index - 1, 0)]
    const current = points[index]
    const next = points[index + 1]
    const after = points[Math.min(index + 2, points.length - 1)]
    const controlOneX = current.x + (next.x - previous.x) / 6
    const controlOneY = current.y + (next.y - previous.y) / 6
    const controlTwoX = next.x - (after.x - current.x) / 6
    const controlTwoY = next.y - (after.y - current.y) / 6
    path += ` C ${controlOneX.toFixed(2)} ${controlOneY.toFixed(2)}, ${controlTwoX.toFixed(2)} ${controlTwoY.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`
  }
  return path
}

export function projectGeoPoint(point, options) {
  const [projected] = projectRouteStops([point], options)
  return projected ?? null
}

export function buildBlockRects(blocks, options) {
  const { minLat, maxLat, minLng, maxLng } = options.bounds
  const latSpan = maxLat - minLat || 0.001
  const lngSpan = maxLng - minLng || 0.001
  const { width = 100, height = 72, padding = 8 } = options

  return blocks.map((block) => {
    const center = projectGeoPoint({ lat: block.lat, lng: block.lng }, options)
    const blockWidth =
      ((block.w / lngSpan) * (width - padding * 2) + (block.w / latSpan) * (height - padding * 2)) / 2
    const blockHeight = blockWidth * 0.72
    return {
      x: center.x - blockWidth / 2,
      y: center.y - blockHeight / 2,
      width: blockWidth,
      height: blockHeight,
    }
  })
}
