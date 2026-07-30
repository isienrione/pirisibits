const REFLECTION_SENTENCES = {
  colosseum:
    'For four centuries, this arena held the breath of an empire · and the lives of those who entered it.',
  pantheon:
    'For nearly two thousand years, this dome remained the largest on Earth.',
  default:
    'Some places do not fade. They wait, stone by stone, until someone stands where the city once looked.',
}

/**
 * @param {{ id?: string }} stop
 * @returns {string}
 */
export function getStoryReflectionSentence(stop) {
  return REFLECTION_SENTENCES[stop?.id] ?? REFLECTION_SENTENCES.default
}
