/** @typedef {{ file: string, title?: string, transcript?: string }} ChapterObject */

/**
 * @param {string | ChapterObject} chapter
 */
export function chapterAudioFile(chapter) {
  if (chapter == null) return null
  return typeof chapter === 'string' ? chapter : chapter.file
}

/**
 * @param {string | ChapterObject} chapter
 * @param {string} [fallback]
 */
export function chapterTitle(chapter, fallback = 'Chapter') {
  if (chapter == null) return fallback
  if (typeof chapter === 'string') return fallback
  return chapter.title?.trim() || fallback
}

/**
 * @param {Array<string | ChapterObject> | undefined} chapters
 */
export function chapterAtIndex(chapters, index, fallback = 'Chapter') {
  const chapter = chapters?.[index]
  if (!chapter) return { file: null, title: fallback }
  if (typeof chapter === 'string') return { file: chapter, title: fallback }
  return { file: chapter.file, title: chapter.title?.trim() || fallback }
}
