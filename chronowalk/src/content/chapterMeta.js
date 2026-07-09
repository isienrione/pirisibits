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
  return (chapters ?? [])
    .map(chapterTranscript)
    .filter(Boolean)
    .join('\n\n')
}
