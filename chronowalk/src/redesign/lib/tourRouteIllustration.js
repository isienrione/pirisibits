/**
 * Layout + path helpers for the illustrated tour roadmap (non-geographic).
 */

/** @typedef {{ id: string, title: string, actNumeral?: string, actTitle?: string, index: number }} IllustratedStop */

/**
 * @param {Array<{ id: string, title: string, actNumeral?: string, actTitle?: string }>} stops
 * @param {{ width?: number, rowGap?: number, paddingY?: number }} [opts]
 * @returns {{ points: IllustratedStop[], width: number, height: number, pathD: string }}
 */
export function buildIllustratedRouteLayout(stops, opts = {}) {
  const width = opts.width ?? 360
  const rowGap = opts.rowGap ?? 40
  const paddingY = opts.paddingY ?? 32
  const paddingX = 28
  const count = stops.length

  if (!count) {
    return { points: [], width, height: 200, pathD: '' }
  }

  const points = stops.map((stop, index) => {
    const wave = Math.sin((index / Math.max(count - 1, 1)) * Math.PI * 2.4)
    const x = width / 2 + wave * (width * 0.34)
    const y = paddingY + index * rowGap
    const labelOnRight = wave <= 0
    return {
      ...stop,
      index,
      x,
      y,
      labelOnRight,
      labelX: labelOnRight ? x + 16 : x - 16,
      labelAnchor: labelOnRight ? 'start' : 'end',
    }
  })

  const height = paddingY * 2 + Math.max(0, count - 1) * rowGap

  let pathD = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]
    const curr = points[i]
    const midY = (prev.y + curr.y) / 2
    pathD += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`
  }

  return {
    points,
    width,
    height,
    pathD,
    paddingX,
  }
}

export function shortStopLabel(title, maxLen = 22) {
  if (!title) return ''
  if (title.length <= maxLen) return title
  return `${title.slice(0, maxLen - 1).trim()}…`
}

export function actColorForNumeral(numeral, actColors) {
  if (!numeral) return actColors.I ?? '#C7A348'
  return actColors[numeral] ?? actColors.I ?? '#C7A348'
}
