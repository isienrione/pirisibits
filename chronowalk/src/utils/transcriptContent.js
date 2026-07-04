/**
 * @param {string | null | undefined} transcript
 * @returns {Promise<string | null>}
 */
export async function loadTranscriptContent(transcript) {
  if (!transcript || typeof transcript !== 'string') return null

  const trimmed = transcript.trim()
  if (!trimmed) return null

  if (!trimmed.startsWith('/') && !trimmed.startsWith('http')) {
    return trimmed
  }

  try {
    const response = await fetch(trimmed)
    if (!response.ok) return null
    return await response.text()
  } catch {
    return null
  }
}

/**
 * @param {string} text
 * @returns {string[]}
 */
export function splitTranscriptParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

/**
 * @param {Array<{ startProgress: number }>} paragraphs
 * @param {number} progress
 */
export function resolveCurrentParagraphIndex(paragraphs, progress) {
  if (!paragraphs?.length) return 0

  let index = 0
  for (let i = 0; i < paragraphs.length; i += 1) {
    if (progress >= paragraphs[i].startProgress) {
      index = i
    }
  }

  return index
}

/**
 * @param {string[]} paragraphs
 */
export function attachParagraphProgress(paragraphs) {
  const count = paragraphs.length || 1

  return paragraphs.map((text, index) => ({
    id: `paragraph-${index + 1}`,
    text,
    startProgress: index / count,
  }))
}
