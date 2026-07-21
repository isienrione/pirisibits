import { stripDirectorCues } from '../utils/transcriptContent.js'

/** Helpers for waypoint chapter entries (string filename or { file, title, transcript }). */

export function chapterFile(chapter) {
  if (!chapter) return null
  return typeof chapter === 'string' ? chapter : chapter.file ?? null
}

/** @deprecated Use chapterFile */
export const chapterAudioFile = chapterFile

export function chapterTitle(chapter, fallback = null) {
  if (!chapter) return fallback
  if (typeof chapter === 'string') return fallback
  return chapter.title ?? fallback
}

export function chapterTranscript(chapter) {
  if (!chapter || typeof chapter === 'string') return null
  return chapter.transcript ?? null
}

/** True when a chapter belongs on the active journey path (omit when chapter.paths is set). */
export function chapterIncluded(chapter, path = 'a') {
  if (!chapter || typeof chapter === 'string') return true
  const paths = chapter.paths
  if (!paths?.length) return true
  return paths.includes(path)
}

export function filterChaptersForPath(chapters, path = 'a') {
  return (chapters ?? []).filter((chapter) => chapterIncluded(chapter, path))
}

export function chapterAtIndex(chapters, index, fallbackTitle = 'Chapter') {
  const chapter = chapters?.[index]
  const numberedFallback = `${fallbackTitle} ${index + 1}`
  const result = {
    title: chapterTitle(chapter, numberedFallback) ?? numberedFallback,
    file: chapterFile(chapter),
  }
  const transcript = chapterTranscript(chapter)
  if (transcript) result.transcript = transcript
  return result
}

export function chaptersToFiles(chapters) {
  return (chapters ?? []).map(chapterFile).filter(Boolean)
}

export function combinedChapterTranscript(chapters) {
  const raw = (chapters ?? [])
    .map(chapterTranscript)
    .filter(Boolean)
    .join('\n\n')
  return raw ? stripDirectorCues(raw) : ''
}

function readableTranscript(raw) {
  if (!raw || typeof raw !== 'string') return null
  const cleaned = stripDirectorCues(raw)
  return cleaned || null
}

/** Full readable script for a waypoint or transit step (for dock / read-along). */
export function resolveStepTranscript(step, path = 'a') {
  if (!step?.record) return null

  if (step.type === 'waypoint') {
    const record = step.record
    return (readableTranscript(record.transcript) ?? combinedChapterTranscript(record.chapters)) || null
  }

  if (step.type === 'transit') {
    const transit = step.record
    if (transit.transcript) return readableTranscript(transit.transcript)
    const variantKey = path === 'b' ? 'b' : 'a'
    return readableTranscript(transit.variant_meta?.[variantKey]?.transcript)
  }

  return null
}
