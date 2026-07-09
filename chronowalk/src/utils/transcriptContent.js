/**
 * Remove ElevenLabs / director cues in square brackets from readable copy.
 * @param {string | null | undefined} text
 * @returns {string}
 */
export function stripDirectorCues(text) {
  if (!text || typeof text !== 'string') return ''

  return text
    .replace(/\[[^\]]*\]/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * @param {string | null | undefined} transcript
 * @returns {Promise<string | null>}
 */
export async function loadTranscriptContent(transcript) {
  if (!transcript || typeof transcript !== 'string') return null

  const trimmed = transcript.trim()
  if (!trimmed) return null

  if (!trimmed.startsWith('/') && !trimmed.startsWith('http')) {
    return stripDirectorCues(trimmed)
  }

  try {
    const response = await fetch(trimmed)
    if (!response.ok) return null
    return stripDirectorCues(await response.text())
  } catch {
    return null
  }
}

/**
 * @param {string} text
 * @returns {string[]}
 */
export function splitTranscriptParagraphs(text) {
  return stripDirectorCues(text)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

/**
 * @param {string} text
 * @returns {{ paragraphs: Array<{ id: string, words: Array<{ text: string, index: number }> }>, wordCount: number }}
 */
export function parseTranscriptForKaraoke(text) {
  const paragraphs = splitTranscriptParagraphs(text)
  let wordIndex = 0

  const parsed = paragraphs.map((paraText, pIdx) => {
    const words = []
    const re = /\S+/g
    let match
    while ((match = re.exec(paraText)) !== null) {
      words.push({ text: match[0], index: wordIndex })
      wordIndex += 1
    }
    return { id: `paragraph-${pIdx}`, words }
  })

  return { paragraphs: parsed, wordCount: wordIndex }
}

/**
 * @param {number} wordCount
 * @param {number} currentTime
 * @param {number} duration
 */
export function resolveActiveWordIndex(wordCount, currentTime, duration) {
  if (!wordCount) return -1
  if (!Number.isFinite(duration) || duration <= 0) return -1

  const progress = Math.min(Math.max(currentTime / duration, 0), 1)
  if (progress >= 1) return wordCount - 1

  return Math.min(wordCount - 1, Math.floor(progress * wordCount))
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
