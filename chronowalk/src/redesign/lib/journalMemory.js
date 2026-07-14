/**
 * Journal memory-book helpers — quotes, discoveries, captions.
 * Uses existing waypoint / manifest fields only (no new content system).
 */

function stripStageDirections(text = '') {
  return String(text)
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitSentences(text = '') {
  return stripStageDirections(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 28 && s.length <= 160)
}

/** Clean arrival / approach for display as a memory line. */
export function tidyMemoryLine(line) {
  if (!line) return null
  const cleaned = String(line).replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned || null
}

/**
 * Prefer authored signature; else arrival beat; else a calm transcript sentence.
 */
export function memoryQuote(waypoint) {
  if (waypoint?.sigLine?.trim()) return waypoint.sigLine.trim()
  if (waypoint?.reflection?.trim()) return waypoint.reflection.trim()

  const arrival = tidyMemoryLine(waypoint?.arrivalLine)
  if (arrival) return arrival

  const fromChapter = (waypoint?.chapters ?? [])
    .flatMap((chapter) => splitSentences(chapter.transcript ?? ''))
    .find(Boolean)
  if (fromChapter) return fromChapter

  const fromBody = splitSentences(waypoint?.transcript ?? '').find(Boolean)
  if (fromBody) return fromBody

  return 'The city keeps its place for you.'
}

/**
 * Historical discoveries for a memory page — never invent tourist facts.
 * Uses keyFacts when present; otherwise reconstruction honesty + transcript glances.
 */
export function memoryDiscoveries(waypoint, { max = 3 } = {}) {
  if (Array.isArray(waypoint?.keyFacts) && waypoint.keyFacts.length) {
    return waypoint.keyFacts.filter(Boolean).slice(0, max)
  }

  const discoveries = []
  const caption =
    waypoint?.reconstruction?.caption ??
    waypoint?.reconstruction?.honesty ??
    null
  if (caption) discoveries.push(caption)

  const transcriptBits = (waypoint?.chapters ?? [])
    .flatMap((chapter) => splitSentences(chapter.transcript ?? ''))
    .filter((sentence) => sentence !== memoryQuote(waypoint))

  for (const sentence of transcriptBits) {
    if (discoveries.length >= max) break
    if (!discoveries.includes(sentence)) discoveries.push(sentence)
  }

  if (discoveries.length < max) {
    const bodyBits = splitSentences(waypoint?.transcript ?? '')
    for (const sentence of bodyBits) {
      if (discoveries.length >= max) break
      if (!discoveries.includes(sentence) && sentence !== memoryQuote(waypoint)) {
        discoveries.push(sentence)
      }
    }
  }

  return discoveries.slice(0, max)
}

/** Quiet memory-book status — not activity-log language. */
export function memoryStatusCaption(status) {
  if (status === 'completed') return 'Remembered'
  if (status === 'current') return 'Open on the page'
  return 'Still unwritten'
}

/** Soft walking footnote — typographic, not a dashboard. */
export function memoryWalkFootnote({ completed = 0, total = 0, distanceLabel = null, walkedMeters = 0 } = {}) {
  if (completed <= 0) return null

  const places =
    completed === 1 ? '1 place kept' : `${completed} places kept`
  const ofTotal = total > 0 && completed < total ? ` of ${total}` : ''

  let distance = null
  if (walkedMeters >= 1000) {
    distance = `${(walkedMeters / 1000).toFixed(1)} km walked`
  } else if (walkedMeters >= 80) {
    distance = `${Math.round(walkedMeters)} m walked`
  } else if (distanceLabel) {
    distance = distanceLabel.replace(/^~/, 'about ')
  }

  return [places + ofTotal, distance].filter(Boolean).join(' · ')
}

/** Milestone line when an act is fully remembered. */
export function actMilestoneCaption(cards = []) {
  if (!cards.length) return null
  const remembered = cards.filter((c) => c.status === 'completed').length
  if (remembered === 0) return null
  if (remembered >= cards.length) return 'This chapter is complete'
  return `${remembered} remembered here`
}
