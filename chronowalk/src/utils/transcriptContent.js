/**
 * Normalize em dashes in transcript text for display.
 * Converts space-emdash-space to space-hyphen-space, and bare em dash to hyphen.
 * @param {string} text
 * @returns {string}
 */
export function normalizeTranscriptDashes(text) {
  if (!text || typeof text !== 'string') return text
  return text.replace(/ \u2014 /g, ' - ').replace(/\u2014/g, '-')
}

/**
 * Remove ElevenLabs / director cues in square brackets from readable copy.
 * @param {string | null | undefined} text
 * @returns {string}
 */
export function stripDirectorCues(text) {
  if (!text || typeof text !== 'string') return ''

  return normalizeTranscriptDashes(text)
    .replace(/\[[^\]]*\]/g, '')
    // Director emoji cues (e.g. look/gesture markers in Navona scripts).
    .replace(/[\u{1F44B}-\u{1F44F}\u{1F3AD}\u{270B}\u{1F446}-\u{1F450}\u{261D}\u{1F918}-\u{1F91F}]/gu, '')
    .replace(/[✋🎭👆👇👈👉]/gu, '')
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

/** Bias applied to playback progress before mapping to words (accounts for pauses in audio). */
export const KARAOKE_SYNC_BIAS = 0.86

/** Extra timeline weight between paragraphs - approximates breath gaps in narration. */
const PARAGRAPH_GAP_WEIGHT = 14

function wordWeight(text) {
  const letters = text.replace(/[^a-zA-Z0-9À-ÿ]/g, '').length
  return Math.max(3, letters || text.length)
}

/**
 * @param {string} text
 * @returns {{
 *   paragraphs: Array<{ id: string, words: Array<{ text: string, index: number }> }>,
 *   wordCount: number,
 *   timeline: Array<{ text: string, index: number, weight: number, startProgress: number, endProgress: number }>
 * }}
 */
export function parseTranscriptForKaraoke(text) {
  const paragraphs = splitTranscriptParagraphs(text)
  const weightedWords = []
  let wordIndex = 0

  paragraphs.forEach((paraText, pIdx) => {
    const re = /\S+/g
    let match
    let firstInPara = true
    while ((match = re.exec(paraText)) !== null) {
      const token = match[0]
      const weight = wordWeight(token) + (firstInPara && pIdx > 0 ? PARAGRAPH_GAP_WEIGHT : 0)
      weightedWords.push({ text: token, index: wordIndex, weight })
      wordIndex += 1
      firstInPara = false
    }
  })

  const totalWeight = weightedWords.reduce((sum, word) => sum + word.weight, 0) || 1
  let cumulative = 0
  const timeline = weightedWords.map((word) => {
    const startProgress = cumulative / totalWeight
    cumulative += word.weight
    return {
      ...word,
      startProgress,
      endProgress: cumulative / totalWeight,
    }
  })

  let timelineCursor = 0
  const parsedParagraphs = paragraphs.map((paraText, pIdx) => {
    const words = []
    const re = /\S+/g
    let match
    while ((match = re.exec(paraText)) !== null) {
      const entry = timeline[timelineCursor]
      words.push({ text: entry?.text ?? match[0], index: entry?.index ?? timelineCursor })
      timelineCursor += 1
    }
    return { id: `paragraph-${pIdx}`, words }
  })

  return { paragraphs: parsedParagraphs, wordCount: wordIndex, timeline }
}

/**
 * @param {Array<{ index: number, startProgress: number }>} timeline
 * @param {number} currentTime
 * @param {number} duration
 */
export function resolveActiveWordIndex(timeline, currentTime, duration) {
  if (!timeline?.length) return -1
  if (!Number.isFinite(duration) || duration <= 0) return -1

  const progress = Math.min(Math.max(currentTime / duration, 0), 1)
  if (progress >= 1) return timeline[timeline.length - 1].index

  const t = progress * KARAOKE_SYNC_BIAS

  let active = timeline[0].index
  for (let i = 0; i < timeline.length; i += 1) {
    if (t >= timeline[i].startProgress) active = timeline[i].index
    else break
  }
  return active
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
