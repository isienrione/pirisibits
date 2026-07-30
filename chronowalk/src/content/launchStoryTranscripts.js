const TRANSCRIPT_PARAGRAPHS = {
  colosseum: [
    'You are standing before the Colosseum, where Rome once gathered to watch the empire perform itself.',
    'Fifty thousand spectators could take their seats in minutes, guided by numbered arches and a social order written in stone.',
    'The facade looks eternal, but it was also a machine - vaults, concrete, and bronze clamps holding the city’s ambition together.',
    'Gladiators entered through the same thresholds as emperors, trading their lives for applause in a theater of power.',
    'Beneath the sand, slaves and animals waited in darkness while the crowd above believed in spectacle, not machinery.',
    'What remains is not only ruin. It is a reminder that public memory can outlast the people who thought they owned history.',
  ],
  default: [
    'You have arrived at a place where the city once gathered its full attention.',
    'Every stone here was arranged to shape what people felt, believed, and remembered.',
    'Rome did not merely build monuments. It built stages for power, devotion, and daily life.',
    'Listen for the overlap between ceremony and routine - the empire lived in both.',
    'What survives is rarely complete. It is enough to suggest how vast the original moment must have been.',
    'Stand still for a moment longer. The past is not behind you. It is under your feet.',
  ],
}

/**
 * @typedef {Object} TranscriptParagraph
 * @property {string} id
 * @property {string} text
 * @property {number} startProgress
 */

/**
 * @param {{ id?: string }} stop
 * @returns {TranscriptParagraph[]}
 */
export function getLaunchTranscriptParagraphs(stop) {
  const paragraphs = TRANSCRIPT_PARAGRAPHS[stop?.id] ?? TRANSCRIPT_PARAGRAPHS.default

  return paragraphs.map((text, index) => ({
    id: `${stop?.id ?? 'stop'}-paragraph-${index + 1}`,
    text,
    startProgress: index / paragraphs.length,
  }))
}
