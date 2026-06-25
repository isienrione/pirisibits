/**
 * Expected narration scripts (spoken words). Replace with TTS exports from content/batches/.
 * Transit scripts live on the *destination* stop (walk toward this landmark).
 */
export const AUDIO_SCRIPTS = {
  colosseum: {
    arrival_transcript: `Face the Colosseum’s outer arc of travertine and brick. You are standing where Romans once filed in through numbered arches, finding their seats by social rank before the games began. Drag the slider when you are ready — the modern street noise falls away and the amphitheater returns to its imperial height, awnings shading the crowd. This is the Flavian amphitheater, dedicated around 80 AD. It could hold tens of thousands, yet the façade you see is only part of what once rose here. Look for the missing marble veneer and the holes where bronze clamps were pried out centuries later.`,
    transit_transcript: null,
  },
  'capitoline-hill': {
    arrival_transcript: `You are on the Capitoline Hill, Rome’s sacred high ground. From this terrace the Forum spreads below like an open textbook of republic and empire. Slide between eras and watch the temples and basilicas reassemble while the modern city keeps breathing around you. Michelangelo reshaped this piazza in the sixteenth century, but the hill’s authority is far older — Etruscan, republican, imperial. The equestrian statue and palaces frame a viewpoint emperors and senators once climbed to on purpose.`,
    transit_transcript: `As you walk from the Colosseum toward the Capitoline Hill, follow the pedestrian streets west and uphill. Rome rewards slow steps here — every corner reveals another layer of brick, another medieval tower built into ancient marble. You are leaving the entertainment district of the emperors and climbing toward the seat of civic power. Watch for the Victor Emmanuel monument ahead; the capitoline climb begins where the valley narrows.`,
  },
  pantheon: {
    arrival_transcript: `Stand before the portico columns and look up at the coffered ceiling of the porch. When you slide, the neighborhood around the Pantheon thins away until you meet the original temple precinct, the bronze letters of the dedication still catching the light. The rotunda behind this colonnade is one of Rome’s great engineering statements — a perfect sphere inscribed in stone and concrete. Drag the slider slowly: the oculus is the sun’s doorway. You are inside the empire’s idea of cosmic order made buildable.`,
    transit_transcript: `As you walk from the Capitoline toward the Pantheon, let the route pull you through working Rome — campanili, scooters at the crossings, café tables spilling onto the cobbles. You are crossing the campus of ancient temples buried under modern streets. Keep the portico columns in mind as your target; when they appear ahead, you have found the best-preserved major monument of imperial Rome.`,
  },
  'largo-argentina': {
    arrival_transcript: `You are above the Largo di Torre Argentina, where four republican temples sit below the modern street level. Slide the view and the pavement becomes transparent: columns, podiums, and sacred ground reappear while trams and buses still trace the old circus line above. This is not Pompey’s theatre — that story belongs elsewhere — but it is one of the clearest places to feel republican Rome under your feet. Cats, commuters, and consuls share the same block across centuries.`,
    transit_transcript: `Walking from the Pantheon toward Largo Argentina, follow the flow toward Piazza Venezia and the teatro di Pompeo quarter. The street plan is a palimpsest: medieval houses, baroque churches, and republican foundations. Listen for the change in traffic rhythm as you approach the sunken temples — Rome’s republic is literally beneath the asphalt.`,
  },
  'campo-de-fiori': {
    arrival_transcript: `You are in Campo de’ Fiori, a square that markets daylight and remembers fire at night. Slide the scene and the open campo becomes a tighter Roman crossroads — shops, stalls, and façades rearranged around a space that has always been public. This was never the Theatre of Pompey; that monument lies near Largo Argentina. Here instead you get daily Roman life stacked on medieval and Renaissance bones — fruit, flowers, and the shadow of the philosopher Giordano Bruno at the center.`,
    transit_transcript: `As you walk from Largo Argentina toward Campo de’ Fiori, cut through the neighborhood lanes where Romans actually shop. The route is short but dense — bakeries, wine bars, and laundry lines. You will know you are close when the square opens and market umbrellas crowd the center.`,
  },
  'piazza-navona': {
    arrival_transcript: `Stand where the stadium curve once swept around you. Piazza Navona is a racetrack turned piazza — Domitian’s stadium paved over by baroque genius. Slide the view and the long oval returns: tiers of seats, roar of the crowd, then fountains and palaces flowering on the same footprint. Bernini’s Four Rivers fountain fights Borromini’s church façade across the square. Drag the slider and read the plan: Rome does not delete its past, it builds the next act on top.`,
    transit_transcript: `Walking from Campo de’ Fiori to Piazza Navona is a few minutes of pure centro storico — narrow stone, sudden churches, then the wide oval of the piazza opening like a stage. Follow the pedestrian flow; when fountains and façades widen around you, you have entered the stadium that became a living room for the city.`,
  },
  'castel-sant-angelo': {
    arrival_transcript: `You are at Castel Sant’Angelo, Hadrian’s mausoleum turned fortress, papal refuge, and Roman landmark on the Tiber. Slide the view and the cylindrical tomb re-emerges in marble before bastions and angel were added. The bridge aligns with the axis of power connecting river, tomb, and Vatican beyond. Drag the slider: watch how emperors, popes, and gunpowder each rewritten the same stone drum for a new fear and a new hope.`,
    transit_transcript: `As you walk from Piazza Navona toward Castel Sant’Angelo, let the Tiber draw you west. The pedestrian bridge is your finish line — angels, castle bulk, river light. Rome’s skyline simplifies here: one fortress, one bend of water, centuries of escape routes above the city.`,
  },
}

export const getAudioScriptsForWaypoint = (waypointId) => AUDIO_SCRIPTS[waypointId] ?? {}
