import { stripDirectorCues } from '../utils/transcriptContent.js'
import { t } from '../i18n/t.js'

/** Helpers for waypoint chapter entries (string filename or { file, title, transcript }). */

function sanitizeChapterTitleText(rawTitle) {
  if (typeof rawTitle !== 'string') return rawTitle
  let t = rawTitle.trim().replace(/\s+/g, ' ')

  // Remove accidental chapter numbering prefixes.
  // Examples:
  // - "Chapter 3: the city ..." → "the city ..."
  // - "3. resilient for centuries" → "resilient for centuries"
  t = t.replace(/^chapter\s*\d+[\s:\-.)]+\s*/i, '')
  t = t.replace(/^\d+\s*[\.\)]\s*/, '')

  // Remove trailing duration fragments like "(1:23)" / "[1:23]".
  t = t.replace(/\s*(?:\(|\[)\s*\d+:\d+(?:\.\d+)?\s*(?:\)|\])\s*$/, '')

  return t
}

export function chapterFile(chapter) {
  if (!chapter) return null
  return typeof chapter === 'string' ? chapter : chapter.file ?? null
}

/** @deprecated Use chapterFile */
export const chapterAudioFile = chapterFile

export function chapterTitle(chapter, fallback = null) {
  if (!chapter) return fallback
  if (typeof chapter === 'string') return fallback
  return sanitizeChapterTitleText(chapter.title ?? fallback)
}

export function chapterTranscript(chapter) {
  if (!chapter || typeof chapter === 'string') return null
  return chapter.transcript ?? null
}

export function chapterAtIndex(chapters, index, fallbackTitle = null) {
  const chapter = chapters?.[index]
  const baseTitle = fallbackTitle ?? t('chapter.fallback')
  const numberedFallback = `${baseTitle} ${index + 1}`
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
