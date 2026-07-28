/** Smoothstep 0→1 */
export function smoothstep(t) {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

export function clamp01(t) {
  return Math.min(1, Math.max(0, t))
}

/**
 * Short holds — enough to read, not a marathon.
 * Emotional arrive chapter gets a touch more room.
 */
export function chapterHoldWeight(chapter) {
  if (chapter?.emotional) return 1.15
  if (chapter?.id === 'walk') return 1.0
  return 0.85
}

/** Crossfade window relative to holds (~350–550px on typical viewports). */
export const XFADE_WEIGHT = 0.42

/**
 * Build hold + true pairwise crossfade timeline.
 * progress 0→1: hold0 → xfade → hold1 → … → holdN
 * During xfade: A = 1−t, B = t (never both empty).
 */
export function buildCinematicTimeline(chapters) {
  if (!chapters?.length) {
    return { totalWeight: 1, segments: [], chapters: [] }
  }

  const holds = chapters.map(chapterHoldWeight)
  const xfadeCount = Math.max(0, chapters.length - 1)
  const totalWeight = holds.reduce((sum, w) => sum + w, 0) + xfadeCount * XFADE_WEIGHT

  const segments = []
  let cursor = 0

  chapters.forEach((chapter, index) => {
    const holdStart = cursor / totalWeight
    cursor += holds[index]
    segments.push({
      type: 'hold',
      index,
      id: chapter.id,
      start: holdStart,
      end: cursor / totalWeight,
    })

    if (index < chapters.length - 1) {
      const fadeStart = cursor / totalWeight
      cursor += XFADE_WEIGHT
      segments.push({
        type: 'xfade',
        from: index,
        to: index + 1,
        fromId: chapter.id,
        toId: chapters[index + 1].id,
        start: fadeStart,
        end: cursor / totalWeight,
      })
    }
  })

  if (segments.length) {
    segments[0].start = 0
    segments[segments.length - 1].end = 1
  }

  return { totalWeight, segments, chapters }
}

/** Soft screen motion — opacity + slight rise/scale. No blur. */
export function softLayerMotion(opacity) {
  const t = clamp01(opacity)
  return {
    opacity: t,
    transform: `translateY(${(1 - t) * 16}px) scale(${0.985 + 0.015 * t})`,
    pointerEvents: t > 0.55 ? 'auto' : 'none',
  }
}

/**
 * Resolve per-chapter opacity + local progress.
 * Guarantees at least one layer is visible (never an empty phone).
 */
export function resolveTimeline(progress, timeline) {
  const p = clamp01(progress)
  const count = timeline.chapters.length
  const opacities = Array(count).fill(0)
  const locals = Array(count).fill(0)

  if (!count) return { opacities, locals, activeIndex: 0 }

  let activeIndex = 0
  let matched = false

  for (const seg of timeline.segments) {
    if (p < seg.start || p > seg.end) continue

    if (seg.type === 'hold') {
      opacities[seg.index] = 1
      const span = Math.max(0.0001, seg.end - seg.start)
      locals[seg.index] = clamp01((p - seg.start) / span)
      activeIndex = seg.index
      matched = true
      break
    }

    if (seg.type === 'xfade') {
      const span = Math.max(0.0001, seg.end - seg.start)
      const t = smoothstep((p - seg.start) / span)
      opacities[seg.from] = 1 - t
      opacities[seg.to] = t
      locals[seg.from] = 1
      locals[seg.to] = 0
      activeIndex = t < 0.5 ? seg.from : seg.to
      matched = true
      break
    }
  }

  if (!matched) {
    if (p <= 0) {
      opacities[0] = 1
      activeIndex = 0
    } else {
      const last = count - 1
      opacities[last] = 1
      locals[last] = 1
      activeIndex = last
    }
  }

  // Safety: never leave the phone empty (floating-point gaps).
  const peak = Math.max(...opacities, 0)
  if (peak < 0.08) {
    opacities[activeIndex] = 1
  }

  return { opacities, locals, activeIndex }
}

export function beatFromLocal(local, beatCount) {
  const beats = Math.max(1, beatCount)
  return Math.min(beats - 1, Math.floor(clamp01(local) * beats))
}

/** Track height in vh — short cinematic scrub, not a marathon. */
export function timelineHeightVh(timeline) {
  // ~1 viewport of lead-in feel per weight unit; floor so 4 chapters stay usable.
  return Math.max(280, Math.round(timeline.totalWeight * 70))
}

// —— Back-compat helpers ——

export function chapterScrollWeight(chapter) {
  return chapterHoldWeight(chapter) + XFADE_WEIGHT * 0.5
}

export function textCenterOpacity(rect, viewportHeight) {
  if (!rect) return 0
  const viewCenter = viewportHeight * 0.5
  const elCenter = rect.top + rect.height * 0.5
  const dist = Math.abs(elCenter - viewCenter)
  const range = viewportHeight * 0.38
  return smoothstep(1 - Math.min(1, dist / range))
}

export function buildChapterRanges(chapters, overlap = 0.18) {
  const timeline = buildCinematicTimeline(chapters)
  return timeline.chapters.map((chapter, index) => {
    const hold = timeline.segments.find((s) => s.type === 'hold' && s.index === index)
    const prevX = timeline.segments.find((s) => s.type === 'xfade' && s.to === index)
    const nextX = timeline.segments.find((s) => s.type === 'xfade' && s.from === index)
    const start = prevX ? prevX.start : hold?.start ?? 0
    const end = nextX ? nextX.end : hold?.end ?? 1
    return {
      id: chapter.id,
      index,
      start,
      end,
      span: end - start,
      chapter,
      overlap,
    }
  })
}

export const PHONE_FADE_SCROLL_PX = 420

export function phoneLayerStyle(progress, start, end, scrollablePx = 0) {
  const span = Math.max(0.001, end - start)
  const fadeFromPx =
    scrollablePx > 0 ? PHONE_FADE_SCROLL_PX / scrollablePx : Math.min(0.1, span * 0.28)
  const fade = Math.min(span * 0.42, Math.max(0.02, fadeFromPx))
  let opacity = 0
  if (progress > start && progress < end) {
    if (progress < start + fade) opacity = smoothstep((progress - start) / fade)
    else if (progress > end - fade) opacity = 1 - smoothstep((progress - (end - fade)) / fade)
    else opacity = 1
  }
  return softLayerMotion(opacity)
}

export function chapterPhase(progress, start, end, beatCount) {
  const span = Math.max(0.001, end - start)
  const local = clamp01((progress - start) / span)
  return beatFromLocal(local, beatCount)
}
