/** Smoothstep 0→1 */
export function smoothstep(t) {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

/**
 * Chapter scroll weights — doubled so every transition has room to breathe.
 * Arrive (Threshold) is the emotional peak.
 */
export function chapterScrollWeight(chapter) {
  if (chapter?.emotional) return 7.2
  if (chapter?.id === 'walk') return 5.6
  return 4.8
}

/**
 * Build overlapping chapter ranges on a 0→1 timeline.
 * Next chapter starts before the previous finishes.
 */
export function buildChapterRanges(chapters, overlap = 0.18) {
  const weights = chapters.map(chapterScrollWeight)
  const total = weights.reduce((sum, w) => sum + w, 0) || 1
  let cursor = 0
  return chapters.map((chapter, index) => {
    const span = weights[index] / total
    const start = Math.max(0, cursor - (index === 0 ? 0 : overlap * 0.5))
    const end = Math.min(1, cursor + span + (index === chapters.length - 1 ? 0 : overlap * 0.5))
    cursor += span
    return { id: chapter.id, index, start, end, span, chapter }
  })
}

/**
 * Target crossfade length in scroll pixels (Apple-soft, never instant).
 */
export const PHONE_FADE_SCROLL_PX = 480

/**
 * Phone layer visibility for a chapter range.
 * Fade in / hold / fade out with opacity + translateY(20) + scale(0.98→1) + blur.
 */
export function phoneLayerStyle(progress, start, end, scrollablePx = 0) {
  const span = Math.max(0.001, end - start)
  const fadeFromPx =
    scrollablePx > 0 ? PHONE_FADE_SCROLL_PX / scrollablePx : Math.min(0.1, span * 0.28)
  const fade = Math.min(span * 0.42, Math.max(0.02, fadeFromPx))
  let opacity = 0

  if (progress <= start || progress >= end) {
    opacity = 0
  } else if (progress < start + fade) {
    opacity = smoothstep((progress - start) / fade)
  } else if (progress > end - fade) {
    opacity = 1 - smoothstep((progress - (end - fade)) / fade)
  } else {
    opacity = 1
  }

  const t = opacity
  return {
    opacity: t,
    transform: `translateY(${(1 - t) * 20}px) scale(${0.98 + 0.02 * t})`,
    filter: t >= 0.98 ? 'none' : `blur(${(1 - t) * 6}px)`,
    pointerEvents: t > 0.55 ? 'auto' : 'none',
    visibility: t < 0.01 ? 'hidden' : 'visible',
  }
}

/** Beat/phase index inside a chapter from global progress. */
export function chapterPhase(progress, start, end, beatCount) {
  const beats = Math.max(1, beatCount)
  const span = Math.max(0.001, end - start)
  const local = Math.min(1, Math.max(0, (progress - start) / span))
  return Math.min(beats - 1, Math.floor(local * beats))
}

/**
 * Text opacity: 0 away from viewport center → 1 at center → 0 again.
 */
export function textCenterOpacity(rect, viewportHeight) {
  if (!rect) return 0
  const viewCenter = viewportHeight * 0.5
  const elCenter = rect.top + rect.height * 0.5
  const dist = Math.abs(elCenter - viewCenter)
  const range = viewportHeight * 0.42
  return smoothstep(1 - Math.min(1, dist / range))
}
