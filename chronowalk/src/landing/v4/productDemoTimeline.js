/** Smoothstep 0→1 */
export function smoothstep(t) {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

export function clamp01(t) {
  return Math.min(1, Math.max(0, t))
}

/**
 * Hold lengths (relative). Transitions are separate and shared —
 * so A fades out while B fades in over the same scrub window.
 */
export function chapterHoldWeight(chapter) {
  if (chapter?.emotional) return 6.4
  if (chapter?.id === 'walk') return 5.2
  return 4.4
}

/** Shared crossfade length relative to holds — lands ~400–600px in typical viewports. */
export const XFADE_WEIGHT = 1.35

/**
 * Build a timeline of holds + true pairwise crossfades.
 *
 * progress 0→1 maps to:
 *   hold0 → xfade(0→1) → hold1 → xfade(1→2) → … → holdN
 *
 * During xfade i→i+1, opacities are locked: A = 1−t, B = t.
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
    const holdEnd = cursor / totalWeight
    segments.push({
      type: 'hold',
      index,
      id: chapter.id,
      start: holdStart,
      end: holdEnd,
    })

    if (index < chapters.length - 1) {
      const fadeStart = cursor / totalWeight
      cursor += XFADE_WEIGHT
      const fadeEnd = cursor / totalWeight
      segments.push({
        type: 'xfade',
        from: index,
        to: index + 1,
        fromId: chapter.id,
        toId: chapters[index + 1].id,
        start: fadeStart,
        end: fadeEnd,
      })
    }
  })

  // Float hygiene — last segment must land exactly on 1.
  if (segments.length) {
    segments[0].start = 0
    segments[segments.length - 1].end = 1
  }

  return { totalWeight, segments, chapters }
}

/** Soft screen motion — opacity + slight rise/scale. No blur (blur tanks live UI). */
export function softLayerMotion(opacity) {
  const t = clamp01(opacity)
  return {
    opacity: t,
    transform: `translateY(${(1 - t) * 20}px) scale(${0.98 + 0.02 * t})`,
    pointerEvents: t > 0.55 ? 'auto' : 'none',
  }
}

/**
 * Resolve per-chapter opacity + local 0→1 progress from global scroll progress.
 * True crossfade: outgoing and incoming share the same t.
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
      locals[0] = 0
      activeIndex = 0
    } else {
      const last = count - 1
      opacities[last] = 1
      locals[last] = 1
      activeIndex = last
    }
  }

  return { opacities, locals, activeIndex }
}

/** Beat index from chapter-local progress (for chips only — not for remounting screens). */
export function beatFromLocal(local, beatCount) {
  const beats = Math.max(1, beatCount)
  return Math.min(beats - 1, Math.floor(clamp01(local) * beats))
}

/**
 * Text opacity: 0 away from viewport center → 1 at center → 0 again.
 */
export function textCenterOpacity(rect, viewportHeight) {
  if (!rect) return 0
  const viewCenter = viewportHeight * 0.5
  const elCenter = rect.top + rect.height * 0.5
  const dist = Math.abs(elCenter - viewCenter)
  const range = viewportHeight * 0.38
  return smoothstep(1 - Math.min(1, dist / range))
}

/** Track height in vh — holds + xfades, with breathing room. */
export function timelineHeightVh(timeline) {
  return Math.round(timeline.totalWeight * 100)
}

// —— Back-compat helpers used by older tests (thin wrappers) ——

export function chapterScrollWeight(chapter) {
  return chapterHoldWeight(chapter) + XFADE_WEIGHT * 0.5
}

export function buildChapterRanges(chapters, overlap = 0.18) {
  const timeline = buildCinematicTimeline(chapters)
  return timeline.chapters.map((chapter, index) => {
    const holds = timeline.segments.filter((s) => s.type === 'hold' && s.index === index)
    const hold = holds[0]
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

export const PHONE_FADE_SCROLL_PX = 480

export function phoneLayerStyle(progress, start, end, scrollablePx = 0) {
  const timeline = {
    chapters: [{ id: 'a' }, { id: 'b' }],
    segments: [
      { type: 'hold', index: 0, start: 0, end: start },
      { type: 'xfade', from: 0, to: 1, start, end, fromId: 'a', toId: 'b' },
      { type: 'hold', index: 1, start: end, end: 1 },
    ],
  }
  // Direct soft motion for a synthetic single-layer fade window
  const span = Math.max(0.001, end - start)
  const fadeFromPx = scrollablePx > 0 ? PHONE_FADE_SCROLL_PX / scrollablePx : Math.min(0.1, span * 0.28)
  const fade = Math.min(span * 0.42, Math.max(0.02, fadeFromPx))
  let opacity = 0
  if (progress > start && progress < end) {
    if (progress < start + fade) opacity = smoothstep((progress - start) / fade)
    else if (progress > end - fade) opacity = 1 - smoothstep((progress - (end - fade)) / fade)
    else opacity = 1
  }
  void timeline
  return softLayerMotion(opacity)
}

export function chapterPhase(progress, start, end, beatCount) {
  const span = Math.max(0.001, end - start)
  const local = clamp01((progress - start) / span)
  return beatFromLocal(local, beatCount)
}
