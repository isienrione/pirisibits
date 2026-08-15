/**
 * Back-of-card stop copy for the landing waypoints carousel.
 * Aligned with Viator / TripAdvisor product text (cleaned of marketplace chrome).
 * Colosseum + Pantheon combine exterior and interior beats into one card each.
 */

/** @typedef {{ body: string, duration: string, admission: string }} LandingStopFlipCopy */

/** @type {Readonly<Record<string, LandingStopFlipCopy>>} */
export const LANDING_STOP_FLIP_COPY = Object.freeze({
  colosseum: Object.freeze({
    duration: '15–60 min',
    admission: 'Exterior free · interior ticket not included',
    body:
      'Your first stop. Outside the amphitheatre, narration opens the tour with how the building worked on a games day: the crowd, the awnings, the machinery beneath the arena floor. Press and hold the screen to see the façade reconstructed as it stood in the 1st century.\n\n' +
      'An optional visit with your own ticket continues inside with chapters on the hypogeum, the seating hierarchy and the arena floor. If you prefer not to enter, the tour continues seamlessly to the next stop.',
  }),

  'palatine-hill-cluster': Object.freeze({
    duration: '30 min',
    admission: 'Admission ticket not included',
    body:
      'Walk the hill where Rome placed both its legendary beginnings and its imperial palaces. From the terraces above the Forum, discover Romulus, the emperors who transformed the hill, and how the Palatine ultimately gave us the word “palace.” Includes narration from a sub-stop with a viewpoint over the Circus Maximus.',
  }),

  'forum-arch-titus': Object.freeze({
    duration: '15 min',
    admission: 'Admission ticket not included',
    body:
      'At the head of the Via Sacra, the audio covers the triumph of AD 71 and the menorah carved inside the arch — the spoils of Jerusalem carried through Rome, sculpted where you’re standing. You’ll need a ticket (included in the same general Parco Archeologico entrance).',
  }),

  'forum-basilica-maxentius': Object.freeze({
    duration: '12 min',
    admission: 'Admission ticket not included',
    body:
      'Three surviving vaults of what was once the largest roofed hall in Rome, including the age of Constantine. The audio explains how the building stood and what it held, and the reconstruction restores the missing roof above you.',
  }),

  'forum-via-sacra': Object.freeze({
    duration: '8 min',
    admission: 'Admission ticket not included',
    body:
      'The main street of ancient Rome, walked inside the Forum with your own ticket. Narration follows the road as triumphs did: prisoners, spoils and generals moving toward the Capitoline, over paving stones still rutted from traffic.\n\n' +
      'Prefer not to enter the archaeological park? A public Forum viewpoint nearby lets you identify temples, basilicas and the Via Sacra from above — with a Then & Now reconstruction that helps reveal the Forum at its height.',
  }),

  'forum-temple-vesta': Object.freeze({
    duration: '10 min',
    admission: 'Admission ticket not included',
    body:
      'The house of the priestesses who guarded Rome’s sacred flame. The audio covers who the Vestals were, the privileges and the punishments, and how the ruins of their courtyard and statues fit together.',
  }),

  'forum-rostra': Object.freeze({
    duration: '8 min',
    admission: 'Admission ticket not included',
    body:
      'Stand at the political heart of the Roman Republic, where speeches could sway a city and change history. This was Rome’s great public stage for persuasion, celebration, accusation… and sometimes brutal political revenge.',
  }),

  'forum-temple-saturn': Object.freeze({
    duration: '10 min',
    admission: 'Admission ticket not included',
    body:
      'The Temple of Saturn marked Rome’s state treasury and the calendar of festival licence. From the surviving columns and podium, the audio reads how the city’s wealth was stored here, why Saturnalia spilled from these steps into the streets, and how the western Forum still turns on this ruin.',
  }),

  'forum-curia-julia': Object.freeze({
    duration: '15 min',
    admission: 'Admission ticket not included',
    body:
      'The Senate House, one of the best-preserved buildings in the Forum. Narration covers what happened in this room, how the Senate actually worked, and how the building survived by becoming a church.',
  }),

  'forum-arch-severus': Object.freeze({
    duration: '10 min',
    admission: 'Admission ticket not included',
    body:
      'At the western end of the Forum, the audio unpacks the Severan dynasty, the campaigns carved into the reliefs, and the name that was chiselled out of the inscription — and why.',
  }),

  'capitoline-hill': Object.freeze({
    duration: '15 min',
    admission: 'Admission free',
    body:
      'Michelangelo’s Piazza del Campidoglio, laid over the most sacred hill of ancient Rome. The audio connects the Renaissance square underfoot to the Temple of Jupiter that once crowned it, with views back over the Forum.',
  }),

  'trajan-market': Object.freeze({
    duration: '15 min',
    admission: 'Free view from outside',
    body:
      'The brick tiers of what’s often called the world’s first shopping complex. Narration covers Trajan’s Forum, the engineering of the hillside, and how the column beside it told a war story in stone. Enjoy a free view from outside; museum entry is separate.',
  }),

  'spanish-steps': Object.freeze({
    duration: '15 min',
    admission: 'Admission free',
    body:
      'The great staircase between the piazza and Trinità dei Monti. Narration covers Grand Tour Rome, the foreign artists and poets who lived on these steps, and Bernini’s sinking-boat fountain at the bottom.',
  }),

  'fontana-di-trevi': Object.freeze({
    duration: '20 min',
    admission: 'Admission free',
    body:
      'Rome’s most famous fountain, and the ancient aqueduct still feeding it. The audio follows the water from the Aqua Virgo to the Baroque theatre in front of you, with the crowd, the coins and the ritual explained.',
  }),

  pantheon: Object.freeze({
    duration: '20–45 min',
    admission: 'Exterior free · interior ticket not included',
    body:
      'The best-preserved building of ancient Rome, seen from the piazza. Narration covers Agrippa’s inscription, Hadrian’s rebuild, and how the portico once met a very different square. Press and hold to see it as it stood.\n\n' +
      'An optional visit with your own ticket continues inside: the dome and the oculus, how the concrete was engineered, why the opening was never closed, who rests there, and how the building has stayed standing for two thousand years.',
  }),

  'piazza-navona': Object.freeze({
    duration: '20 min',
    admission: 'Admission free',
    body:
      'The shape of the square is the shape of the stadium beneath it. The audio traces Domitian’s arena under your feet, then Bernini’s fountain above, with a reconstruction of the racing track that became a piazza.',
  }),

  'campo-de-fiori': Object.freeze({
    duration: '12 min',
    admission: 'Admission free',
    body:
      'A market square by morning and a meeting place by night, with a darker past. The audio covers the executions once held here and the statue of Giordano Bruno standing where he was burned in 1600.',
  }),

  'largo-argentina': Object.freeze({
    duration: '15 min',
    admission: 'Admission free',
    body:
      'Four Republican temples sunk below street level, viewed from the railing at no cost. The narration explains what stood here — including the portico where Caesar was killed — and why the site is now also famous for its cats.',
  }),

  'castel-sant-angelo': Object.freeze({
    duration: '20 min',
    admission: 'Exterior free · interior ticket not included',
    body:
      'Hadrian’s mausoleum turned papal fortress, seen from the Ponte Sant’Angelo. The audio traces its lives — imperial tomb, refuge, prison — with Bernini’s angels lining the bridge in front of you. Interior visits require a separate ticket.',
  }),

  'circus-maximus': Object.freeze({
    duration: '15 min',
    admission: 'Admission free',
    body:
      'In the long valley between the Palatine and the Aventine, the audio restores the circus that held chariot racing for a quarter of a million spectators: the spina, the factions, and the roar that once filled this empty green. Pair it with the Palatine terrace viewpoint above for the full race-day picture.',
  }),

  'appian-way': Object.freeze({
    duration: '30 min',
    admission: 'Admission free',
    body:
      'An optional encore beyond the city centre, on the road that carried Rome’s armies south. Narration covers the engineering of the paving, the tombs lining the route, and what it meant to leave the city by this gate. Best reached by taxi or car.',
  }),
})

/**
 * @param {string} stopId
 * @returns {LandingStopFlipCopy | null}
 */
export function getLandingStopFlipCopy(stopId) {
  return LANDING_STOP_FLIP_COPY[stopId] ?? null
}
