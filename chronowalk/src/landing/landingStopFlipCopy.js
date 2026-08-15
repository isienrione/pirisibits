/**
 * Back-of-card stop copy for the landing waypoints carousel.
 * Visitor-facing why-this-matters blurbs (Viator/TripAdvisor facts, warmer voice).
 * Colosseum + Pantheon fold exterior and interior into one card each.
 */

/** @typedef {{ body: string, duration: string, admission: string }} LandingStopFlipCopy */

/** @type {Readonly<Record<string, LandingStopFlipCopy>>} */
export const LANDING_STOP_FLIP_COPY = Object.freeze({
  colosseum: Object.freeze({
    duration: '15-60 min',
    admission: 'Exterior free · interior ticket not included',
    body:
      'This is where Rome put on a show for 50,000 people. Stand outside and picture games day: the roar of the crowd, canvas awnings pulling shade across the tiers, and a maze of machinery under the sand that could raise animals and scenery into the arena. Hold the screen and the scarred façade snaps back to the 1st century.\n\n' +
      'Go inside with your own ticket and you are walking the belly of the beast: tunnels, seats ranked by status, the floor where lives ended for sport. Stay outside if you prefer. The route picks you up either way.',
  }),

  'palatine-hill-cluster': Object.freeze({
    duration: '30 min',
    admission: 'Admission ticket not included',
    body:
      'Every palace on earth borrows its name from this hill. Romulus is said to have founded Rome here, then emperors piled villas on the ridge until “Palatine” literally meant power with a view. From the terraces you look down on the Forum like a ruler checking the city, and across to the Circus Maximus where the races once burned.',
  }),

  'forum-arch-titus': Object.freeze({
    duration: '15 min',
    admission: 'Admission ticket not included',
    body:
      'Victory carved in stone, right where the parade passed. In AD 71 Rome celebrated the sack of Jerusalem here, and inside the arch you can still spot the menorah being carried as loot. You are standing in the finish line of a triumph. (Same Parco Archeologico ticket as the rest of the Forum.)',
  }),

  'forum-basilica-maxentius': Object.freeze({
    duration: '12 min',
    admission: 'Admission ticket not included',
    body:
      'Three giant vaults are all that remain of the biggest roofed hall Rome ever built. In Constantine’s day this place swallowed law courts and imperial ceremony under a ceiling that felt impossible. Look up: ChronoWalk puts the missing roof back so you feel the scale instead of guessing it.',
  }),

  'forum-via-sacra': Object.freeze({
    duration: '8 min',
    admission: 'Admission ticket not included',
    body:
      'Rome’s main street, still wearing chariot ruts. Generals, prisoners, and wagonloads of treasure once rolled this way toward the Capitoline while the city watched. Walk it and you are on the same stones that sold an empire its glory.\n\n' +
      'Skipping the ticketed park? A free overlook nearby still lets you read the temples and this road from above, with a Then & Now glimpse of the Forum at full roar.',
  }),

  'forum-temple-vesta': Object.freeze({
    duration: '10 min',
    admission: 'Admission ticket not included',
    body:
      'Six women held Rome’s luck in a flame that could never go out. The Vestals lived with rare privileges and brutal penalties, and their round temple plus courtyard statues still mark the sacred hearth of the city. Quiet stones, enormous stakes.',
  }),

  'forum-rostra': Object.freeze({
    duration: '8 min',
    admission: 'Admission ticket not included',
    body:
      'The microphone of the Republic. From this platform a speech could crown a career, start a riot, or end a life. Persuasion, celebration, public shaming: Rome practiced politics as theatre, and this was centre stage.',
  }),

  'forum-temple-saturn': Object.freeze({
    duration: '10 min',
    admission: 'Admission ticket not included',
    body:
      'Columns that once guarded the state treasury. Saturn’s temple held Rome’s gold, then threw the city into Saturnalia: masters served slaves, rules flipped, and the Forum went gloriously sideways. The western end of the Forum still pivots around this ruin.',
  }),

  'forum-curia-julia': Object.freeze({
    duration: '15 min',
    admission: 'Admission ticket not included',
    body:
      'Step into one of the best-preserved rooms in the Forum and you are inside the Senate House. Debates that shaped the Mediterranean happened between these walls. It survived the centuries by becoming a church, which is why you can still feel the chamber instead of imagining rubble.',
  }),

  'forum-arch-severus': Object.freeze({
    duration: '10 min',
    admission: 'Admission ticket not included',
    body:
      'A family flex in marble at the Forum’s western gate. The Severans packed their wars into the reliefs, then politics got messy enough that a name was chiselled out of the inscription on purpose. Propaganda, rewritten in public. Bring your eyes.',
  }),

  'capitoline-hill': Object.freeze({
    duration: '15 min',
    admission: 'Admission free',
    body:
      'Michelangelo’s elegant square sits on the hill Romans once called the holiest in the city. Under your feet: the ghost of Jupiter’s temple. Behind you: the Forum laid out like a map. It is the handshake between ancient power and Renaissance swagger, and the view earns the climb.',
  }),

  'trajan-market': Object.freeze({
    duration: '15 min',
    admission: 'Free view from outside',
    body:
      'Brick terraces climbing the hillside: Rome’s answer to a shopping mall, nineteen centuries early. Beside them, Trajan’s Column spirals an entire war into stone so you can “read” a victory while you walk. Outside viewing is free; the museum behind the doors is optional.',
  }),

  'spanish-steps': Object.freeze({
    duration: '15 min',
    admission: 'Admission free',
    body:
      'The city’s favourite outdoor staircase, linking the piazza to Trinità dei Monti. Poets, painters, and Grand Tour travellers treated these steps like a salon with a skyline. At the bottom, Bernini’s little sinking boat still looks ready to take on the fountain.',
  }),

  'fontana-di-trevi': Object.freeze({
    duration: '20 min',
    admission: 'Admission free',
    body:
      'Rome’s celebrity fountain is also an ancient plumbing flex: Aqua Virgo water still feeds the Baroque theatre of rock and horses in front of you. Coins, wishes, elbow-to-elbow crowds. Lean in for the ritual, then notice the aqueduct story hiding in plain sight.',
  }),

  pantheon: Object.freeze({
    duration: '20-45 min',
    admission: 'Exterior free · interior ticket not included',
    body:
      'The building that refused to fall down. From the piazza you meet Agrippa’s bold name on Hadrian’s rebuild, and a portico that once faced a very different square. Hold the screen and the past steps forward.\n\n' +
      'Inside (own ticket), the dome and open oculus still feel like a dare to gravity. Rain falls through on purpose. Emperors and artists share the floor. Two thousand years on, it is still working.',
  }),

  'piazza-navona': Object.freeze({
    duration: '20 min',
    admission: 'Admission free',
    body:
      'That long oval is not an accident. You are standing on Domitian’s stadium, turned inside out into a Baroque living room with Bernini’s fountain as the centrepiece. Racetrack underfoot, fountain overhead: Rome recycling itself for another encore.',
  }),

  'campo-de-fiori': Object.freeze({
    duration: '12 min',
    admission: 'Admission free',
    body:
      'Market stalls by morning, aperitivo by night, and a square that once hosted executions. Giordano Bruno’s hooded statue marks the spot where he was burned in 1600. Beautiful, busy, and a little haunted if you know where to look.',
  }),

  'largo-argentina': Object.freeze({
    duration: '15 min',
    admission: 'Admission free',
    body:
      'Four Republican temples sunk below the modern street, free from the railing. One of those porticoes is where Caesar’s assassins finished the job. Today the cats own the ruins, which somehow feels very Roman: sacred ground, street-level, slightly chaotic.',
  }),

  'castel-sant-angelo': Object.freeze({
    duration: '20 min',
    admission: 'Exterior free · interior ticket not included',
    body:
      'Hadrian built a tomb. Popes turned it into a fortress, escape route, and prison. From Ponte Sant’Angelo, Bernini’s angels usher you toward a building that kept reinventing itself with the city. Peek from outside for free; go in later if the ticket calls.',
  }),

  'circus-maximus': Object.freeze({
    duration: '15 min',
    admission: 'Admission free',
    body:
      'It looks like a quiet park. It was once a racetrack for a quarter of a million fans, chariots screaming down the straight while the Palatine watched from above. Stand in the grass and fill it with noise again. The empty space is the point.',
  }),

  'appian-way': Object.freeze({
    duration: '30 min',
    admission: 'Admission free',
    body:
      'Optional encore outside the centre: the road that marched Rome’s armies south. Tombs line the way like a stone farewell, and the paving still feels built for empire. Grab a taxi or drive. Worth it when you want the city to thin out and the past to get loud.',
  }),
})

/**
 * @param {string} stopId
 * @returns {LandingStopFlipCopy | null}
 */
export function getLandingStopFlipCopy(stopId) {
  return LANDING_STOP_FLIP_COPY[stopId] ?? null
}
