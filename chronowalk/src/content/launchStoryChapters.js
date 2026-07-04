const CHAPTER_TEMPLATES = {
  colosseum: [
    { title: 'The Threshold', summary: 'Stand where two thousand years of spectacle begin.' },
    { title: 'Crowds & Empire', summary: 'Fifty thousand voices, one city holding its breath.' },
    { title: 'The Architecture', summary: 'Concrete, vaults, and engineering that outlasted emperors.' },
    { title: 'Gladiators', summary: 'Honor, blood, and the politics of public death.' },
    { title: 'Beneath the Arena', summary: 'Trapdoors, cages, and the machinery of illusion.' },
    { title: 'What Remains', summary: 'Ruin, memory, and why Rome still feels alive.' },
  ],
  default: [
    { title: 'Arrival', summary: 'The moment the past meets where you stand.' },
    { title: 'First Impressions', summary: 'What the city wanted visitors to feel.' },
    { title: 'Power & Ritual', summary: 'How public space shaped Roman life.' },
    { title: 'Daily Life', summary: 'Voices, commerce, and movement through stone.' },
    { title: 'Turning Points', summary: 'When history bent on this very ground.' },
    { title: 'Echoes', summary: 'What endures when the crowds have gone.' },
  ],
}

const CHAPTER_COUNT = 6

/**
 * @typedef {Object} StoryChapter
 * @property {string} id
 * @property {number} number
 * @property {string} title
 * @property {string} summary
 * @property {number} startProgress
 */

/**
 * @param {{ id?: string, title?: string, shortTitle?: string }} stop
 * @returns {StoryChapter[]}
 */
export function getStoryChapters(stop) {
  const templates = CHAPTER_TEMPLATES[stop?.id] ?? CHAPTER_TEMPLATES.default

  return templates.slice(0, CHAPTER_COUNT).map((chapter, index) => ({
    id: `${stop?.id ?? 'stop'}-chapter-${index + 1}`,
    number: index + 1,
    title: chapter.title,
    summary: chapter.summary,
    startProgress: index / CHAPTER_COUNT,
  }))
}

export const STORY_CHAPTER_COUNT = CHAPTER_COUNT
