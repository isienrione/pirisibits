/**
 * @param {Array<{ startProgress: number }>} chapters
 * @param {number} progress
 */
export function resolveCurrentChapterIndex(chapters, progress) {
  if (!chapters?.length) return 0

  let index = 0
  for (let i = 0; i < chapters.length; i += 1) {
    if (progress >= chapters[i].startProgress) {
      index = i
    }
  }

  return index
}

/**
 * @param {Array<{ startProgress: number }>} chapters
 * @param {number} chapterIndex
 * @param {number} progress
 */
export function isChapterComplete(chapters, chapterIndex, progress) {
  if (!chapters?.length) return false

  const nextStart = chapters[chapterIndex + 1]?.startProgress ?? 1
  return progress >= nextStart - 0.001
}

/**
 * @param {Array<{ startProgress: number }>} chapters
 * @param {number} progress
 */
export function getChapterStatuses(chapters, progress) {
  const currentIndex = resolveCurrentChapterIndex(chapters, progress)

  return chapters.map((chapter, index) => ({
    ...chapter,
    status:
      index === currentIndex
        ? 'current'
        : isChapterComplete(chapters, index, progress)
          ? 'complete'
          : 'upcoming',
  }))
}
