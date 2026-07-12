# ChronoWalk — Acts, Conditional Inserts & Final Assemblies
### The freedom-model addendum: app copy, the 7 callback insert scripts, and the four fully-assembled remaining stops.
**Companion to the (now-patched) MASTER Production Script v2. Everything here is ElevenLabs-ready.**

---

# 1. THE ACT MODEL — APP COPY (exact strings)

**Pace selector (replaces the day selector):**
- Title: *"Rome is yours. How do you want to take it?"*
- Option 1 — **The Classic Split** (default, badge "Most loved"): *"The ancient city one outing, the living city another. Acts I–IV, then V–VI."*
- Option 2 — **The Heroic Day**: *"All of it, dawn to golden hour. Bring real shoes and real ambition."*
- Option 3 — **Your Own Pace**: *"Any act, any order, as many mornings as you like. I'll keep your place."*
- Beneath all three, Orientation voice: *"You can change your mind at any time. Nothing expires. Nothing is skipped forever."*

**Act names (route screen):** I · The Arena — II · The Gate & the Hill — III · The Forum — IV · The Market — V · The Living City — VI · The River — Encore · The Long Games & the Long Road (Circus floor + Appia). Each act shows its entry point, walking time, and a one-line promise (e.g., Act III: *"Nine stops, one drained swamp, the centre of the world."*).

**Resume greetings (one shared file each, rotate):** `resume_same_day.mp3`: "[warm] Welcome back. We were just getting to the good part." · `resume_new_day.mp3`: "[warm] Rome kept your place. [wry] It's had practice waiting. [slow] When you're ready — we pick up exactly where you left it."

**"Start from where I am":** finds nearest waypoint; confirmation copy: *"You're closest to [name] — Act [n], chapter [x]. Start there? The story works from any door."*

---

# 2. THE SEVEN CONDITIONAL INSERTS (Layer 3 files — record each as its own clip)

**How they work:** each is a short standalone clip. The app plays it at the marked point in the narration *only if* `requires` is in `completedWaypointIds`; otherwise the narration flows past the gap seamlessly (the base scripts in the master now read complete without them). Mix: same voice/settings, normalized −16 LUFS, 0.4 s head/tail silence for clean stitching.

**ins_whopaid** — plays in W02 Ch.II, before "So who paid for the free games?" · requires **W01**
> [quiet] Which answers the question you carried in through the gate.

**ins_window** — plays in the ENCORE Circus-floor stop, before "Find the palace face on the hill" · requires **W04**
> [warm] Earlier you stood up there, looking down from the emperor's side. Now you're where everyone else stood.

**ins_jerusalem** — plays in W05 Ch.I, before "In 70 AD the legions took Jerusalem" · requires **W01**
> [matter-of-fact] This is the war you heard about at the amphitheatre — the one whose plunder helped pay for it.

**ins_fire** — plays in W19 Campo, at the marked point after Bruno's quote · requires **W08**
> [thoughtful] Earlier on this walk, at a small round temple, you met six women bound for life to keep a fire because an institution demanded it — and a Vestal who went into the ground protesting her innocence. Here the same machinery ran in reverse: an institution demanding words a man would not say, with fire at the end of the process either way. [slow] Rome's fires and Rome's refusals... have always known each other.

**ins_caesar_tease** — plays in transit T15 at the marked point · requires **W07 or W12**
> [slow] And the question you've been holding since the Sacred Way — where was Caesar actually killed? — [quiet] ends there.

**ins_water_trevi** — plays in W16 Trevi, directly after the aqueduct-terminal reveal · requires **W15**
> [slow] This is the quiet water from the Steps. Same source. Same channel. [wry] It walked here with you — it just dressed up on the way.

**ins_agrippa** — plays in W17 Pantheon Exterior, at the close · requires **W16**
> [curious] And Agrippa — the name on the stone? The man who built the aqueduct you've been following all day. [wry] Third time you've met him today. He just didn't introduce himself until now.
> *(Base line, already standing in the Exterior script when this doesn't play: Agrippa is introduced cold there — no edit needed.)*

**Manifest schema addition (per waypoint):**
```json
"inserts": [
  {"id":"ins_fire","file":"/rome/audio/inserts/ins_fire.mp3",
   "afterSeconds": 118.4, "requiresAny":["w08"]}
]
```
**Cursor prompt (replaces the old cue-list part of the mix layer):** "Add an insert player to the audio engine: when narration playback reaches insert.afterSeconds, if requiresAny intersects completedWaypointIds, pause narration, play the insert file, resume narration at the same position; else continue uninterrupted. Preload insert files with the day's cache. afterSeconds values come from the manifest (I will fill them after listening to the final masters — build with placeholder values)."

---

# 3. FINAL ASSEMBLED SCRIPTS (the four that were "your text + insertions" — now fully merged, paste-ready)

## W15 — SPANISH STEPS (final · ~2:55)
⟦AMBIENT: BED-CENTRO morning⟧ ⟦SFX: sfx_w15_fountain · low fountain overflow, continuous · from 0:00⟧

[curious] The fountain at the bottom of these steps is sinking.

[pause]

It is not collapsing — it was built this way. A stone boat, half-submerged in a shallow oval basin, with water flowing over its prow and sides rather than upward from a jet. It sits below the level of the piazza. The surrounding cobblestones rise around it. You have to look slightly down to see it properly.

The reason is the water. [curious] It arrives here through an ancient aqueduct called the Acqua Vergine — remember the name... ⟦PLANT:WATER⟧ [slow] because this quiet water is going to follow you all day, and twice more it will do something you don't expect. The aqueduct's source is only marginally higher than this piazza. There isn't enough pressure to push a jet upward. Pietro Bernini, commissioned to build a fountain here in the 1620s, could not make the water rise. [slow] So he made it sink. He designed a basin already below grade, a boat already half-submerged, and let the water do what low pressure allows: fill slowly, overflow gently, run over the sides. [matter-of-fact] The engineering problem became the form.

[softly] That sound — the low overflow of the same water — was there through the winter of 1820 and into 1821.

The building to the right of the steps — the second window on the first floor, if you can see it from here — that's where John Keats died. He arrived in Rome in November 1820, at twenty-five, already sick. Doctors believed warmer climates might slow tuberculosis — Rome was where English patients who could afford the trip were sent to try. He wasn't here to see the city. He was here to try to survive it.

His friend, a painter named Joseph Severn, came with him and stayed. They took rooms at number twenty-six, the building immediately to the right of the steps. Keats spent most of his time inside. Severn described the fountain's sound in his letters home — he could hear it from the room. [slow] The fountain was there through all of it.

Keats told Severn what he wanted on his gravestone. No name. He said he didn't want his name on the stone at all. What he wanted was this:

[softly] Here lies One... Whose Name was writ in Water.

[long pause]

✋ [softly] Before you leave... look up at that second window, and give it a second of your morning. [pause] He'd have liked the sound you're hearing right now. It was the last thing the room ever gave him.

## W16 — FONTANA DI TREVI (final · ~4:20)
⟦SFX: sfx_w16_roar · the water's roar swelling from silence over 4 s · at 0:00, before the first word⟧

[warm] Look at the coins on the floor of the basin.

[pause] Each one is a person who stood where you're standing, took a coin, threw it over their left shoulder with their right hand, and trusted that doing so would bring them back to Rome. Thousands do it every day. The basin floor is covered. [matter-of-fact] And that ritual — the specific ritual, one coin, left shoulder, right hand, the promise of return — appears to date from a 1954 Hollywood film.

The film was called Three Coins in the Fountain. It was set here, it won two Academy Awards, and its theme song played across the English-speaking world for a year — at the precise moment mass tourism was beginning. People arrived. They did what they had seen in the film. And the ritual, through sheer repetition, became what it is now. 🎭 [dry] About a million and a half euros lands in this basin every year, and it goes to charity — which makes this the only place in Rome where a movie-invented superstition runs a soup kitchen. [warm] The coins are real. The donations are real. The emotion is real. [matter-of-fact] The origin is a film.

[quiet] Here is what else is real. The water pouring through this fountain right now has been traveling to this spot, along roughly the same underground route... since 19 BC. The aqueduct is called the Acqua Vergine. Marcus Agrippa built it. It runs under the streets you've been walking — and it terminates here. This is where it surfaces. [slow] The sound you're hearing is more than two thousand years of continuous infrastructure... announcing itself. ⟦INSERT:ins_water_trevi · requires W15 · plays here⟧

✋ [softly] Put your hand on the travertine rim — feel the vibration? That's not machinery. That's the weight of the water itself, shaking two-hundred-year-old stone. The spectacle is physical before it's visual.

[warm] The fountain itself is younger than its water. Nicola Salvi designed it in the 1730s after a papal competition, and worked on it for the last twenty-one years of his life — in worsening health, in the dampness of the site. There was no room to build freestanding at the scale he had in mind, so he built it against the back wall of a palace... ✋ and look now at where the fountain ends and the building begins. [slow] You cannot find the seam. He used the palace the way a sculptor uses a block of stone: as material the work is cut from. He died in 1751 without seeing it finished. [quiet] Two centuries after his death, the film arrived and taught the world what to do here.

[slow] The water is over two thousand years old. The fountain, not yet three hundred. The ritual... seventy. [pause] Nobody planned this combination. The aqueduct itself is named for a girl — in legend, a young girl led Agrippa's engineers to the spring, and the water has carried her name ever since. Whether the girl existed doesn't change the water.

[quiet] Now press and hold when you're ready — because everything you're standing in front of... [slow] was built to replace what you're about to see. ⟦App: Threshold — the reverse-wonder crossing, 1629⟧

[unhurried] All of it arrived together: the ancient source, the Baroque display, and the seventy-year-old wish.

## W20 — LARGO DI TORRE ARGENTINA (final · ~4:30)
⟦AMBIENT: BED-CENTRO with traffic edge⟧

[matter-of-fact] This is where Caesar died.
⟦SFX: sfx_w20_silence · all ambience ducks to near-silence for 8 s · under that sentence — the city holds its breath⟧

[long pause]

[unhurried] Look down into the excavation. The ancient floor is several meters below the street you're standing on — that gap is two thousand years of city piling up above the original level. Four Republican temple platforms. Column bases. Cats moving through the ruins. And in the corner of this zone, the foundations of the Curia of Pompey — the meeting room where the Roman Senate assembled on March 15, 44 BC, because the standard Senate building was under repair. ⟦PAYOFF:CAESAR-ROOM⟧ [quiet] This is the room. Not the Forum. Not the Senate house with his name on it. Here — in a theatre lobby, because the chamber was being renovated. [dry] History's most famous assassination happened at the temporary venue.

[thoughtful] He had not intended to come. His wife Calpurnia had a nightmare and asked him to stay home. The augur Spurinna had warned him — specifically, that date, the Ides of March. Caesar agreed to cancel. Then Marcus Junius Brutus arrived at his door and offered to escort him personally... and Caesar let himself be persuaded. He arrived late. As he took his seat, someone handed him a written note describing the plot. [slow] He carried it unread.

[quiet] The first blow comes from Casca. Caesar grabs his arm. Within seconds the others are on him. He pulls his toga over his face when he understands there is no escape. He falls near the base of a statue of Pompey — the man he had defeated in civil war. Twenty-three wounds. One immediately fatal, according to the surgeon who later examined the body. [pause] The other senators fled. Then Caesar's three slaves came and put him on a litter to carry him home through the city. Suetonius records one detail of that journey. [slow] One arm hung over the side.

[long pause]

[unhurried] Afterward, the Senate declared this place cursed — the entrance walled over, the room removed from use. The city built over it: a tenement, then centuries of ordinary Roman life, and the murder site was lost. In 1926, a road-widening program demolished the tenement... and out of the ground came four Republican temples. [dry] That is how the most significant assassination site in Western history was recovered. Someone needed to widen a street.

✋ [softly] Put both hands on the railing and look at the drop — several metres between your feet and their floor. [slow] That gap is twenty centuries, layer on layer. You're not standing above the temples. You're standing on top of the Rome that buried them.

[lightly] And the cats. [warm] They've been here for decades — the colony grew, attracted volunteers, became a formal sanctuary. At any given time, one to two hundred cats live in the ruins of the Curia of Pompey. [matter-of-fact] The most famous political murder in Western history takes place in a cat sanctuary. [pause] Both of those things are completely true. 🎭 [warm] The cats, for the record, take no position on the assassination. [dry] They are, however, firmly in power.
⟦SFX: sfx_w20_cats · one distant meow · beat after "firmly in power"⟧

## W21 — CASTEL SANT'ANGELO (final · ~5:00 — the finale)
⟦AMBIENT: BED-RIVER⟧ ⟦SFX: sfx_w21_bells+run · far bells + hurried footsteps on stone, 4 s · at 0:00, before the first word⟧

[quiet] He moved through the corridor at speed. Eight hundred meters of covered passageway running above the city wall, the Vatican behind him, the Castel ahead — and below, through the stone, the sound of Rome coming apart.

[softly] The man running was Pope Clement the Seventh. The date was May 6, 1527. Troops of the Holy Roman Emperor had broken into the city — the Swiss Guards died at the door of Saint Peter's holding the line while the Pope moved through the passetto: the elevated corridor connecting the Vatican to this fortress, built across centuries precisely so that this moment would be possible. He reached the battlements... and watched Rome burn. He was besieged for months. The Sack killed tens of thousands. The painters and scholars who had made Rome the centre of Europe fled, and did not come back.

✋ [softly] Stop at the middle of the bridge — between the angels — and look at the water going under you. [slow] Hadrian's engineers chose this exact crossing. Every pilgrim, every pope, every prisoner came over the same span you're standing on. [warm] The corridor the Pope ran through is still there — the roofed passage along the wall to the north. What you cannot see from here is what this building was before it was a fortress.

[matter-of-fact] Hadrian built it as his tomb. Construction began around 123 AD; he died before it was finished, and his successor consecrated it in 139. A massive drum of concrete, some sixty-four meters across, originally clad in marble, crowned with a garden of cypress trees and a gilded four-horse chariot at the summit. His ashes were placed at the centre, and the emperors who followed were buried here too, one after another, until the line ended and the building was full. [slow] It stood there. The concrete stayed. The city changed.

[thoughtful] A military engineer looking at it a century later could see immediately what it was for *now* — the thick walls, the position on the river — and the medieval papacy folded it into the city's defences. Tradition holds that during a plague around 590, Pope Gregory looked up and saw the Archangel Michael above the building, sheathing his sword — a sign the plague was ending. The building was renamed. The angel at the summit has been there in some form ever since; the bronze one you see now is eighteenth-century, and it shows the exact moment of the vision: [slow] the sword already going back into its scabbard.

[quiet] The building became a prison. Giordano Bruno was held here during his eight-year trial. He walked out on February 17, 1600 — not free. You were at Campo de' Fiori earlier. [slow] That is where he walked to. Beatrice Cenci was executed in front of this building in 1599, the year before Bruno... at twenty-two years old. [thoughtful] It is now a museum. [pause] Inside: Hadrian's spiral ramp, still ascending through the original concrete. Above it, medieval fortifications. Above those, Renaissance papal apartments with their frescoes. Somewhere below, the cells. [slow] You can walk from an emperor's tomb to a pope's bedroom in twenty minutes... through the same walls.

[matter-of-fact] What this building reveals is not Rome's care for the past. It is Rome's habit of finding the thing that is already there and making it useful. The concrete Hadrian poured was still here. [quiet] That was enough. [slow] The walls were indifferent to the purposes they held.

[quiet] And that... is the walk. You began at a fountain that sinks, and you end at a tomb that refused to stay a tomb. [slow] Everything you passed today survived the same way — by becoming whatever the next century needed. [warm] Rome doesn't preserve things. [pause] It keeps them employed. [softly] Now stay for the light, if it's on. You've earned the view twice over.
⟦App: → Journey Letter⟧
*(Note: the Bruno line "You were at Campo de' Fiori earlier" is safe unconditioned — Campo precedes Castel in every recommended pacing — but for full freedom-proofing, record the alternative sentence `w21_alt_bruno.mp3`: "[quiet] He walked out of here to a market square across the river... where a statue now stares back at his judges." App swaps it if W19 not completed.)*

---

# 4. UPDATED TOTALS & CHECKLIST DELTA
Master file is now patched (Acts headers, no calendar words, payoffs → conditional inserts). Production additions to Appendix C: **+7 insert clips, +2 resume greetings, +1 w21_alt_bruno, +pace-selector has no audio.** Everything else unchanged. Timeline impact: ~25 minutes of extra ElevenLabs work, one extra Cursor prompt. The freedom model is now fully paid for.

---

# 5. PATH A / PATH B — THE ACT II CHOICE (app copy + new clips)

**Choice screen (appears during T01, at the fork):**
- Title: *"Two doors into ancient Rome. Pick your appetite."*
- **Path A — The Forum Direct** · badge "~45 min shorter": *"Straight through the gate of triumphs and down into the heart. The Palatine stays available as an optional climb."*
- **Path B — The Emperor's Approach** · badge "The full hill": *"Past Constantine's arch, up the Palatine the way power went — palace, the Circus from the emperor's railing, then descend into the Forum from above."*
- Footnote, Orientation voice: *"Same ticket, same stops available, same single entry. You can still climb the hill later on Path A — nothing is lost either way."*

**New audio clips this creates (add to Appendix C regeneration list):**
1. `t01_shared.mp3` — Colosseum piazza + Arch of Constantine beat (in master).
2. `t01_fork_a.mp3` / `t01_fork_b.mp3` — the two routing tails (in master).
3. `w03_outro_a.mp3` / `w03_outro_b.mp3` — Titus endings (in master).
4. `t03_a.mp3` / `t03_b.mp3` — descent variants (in master).
5. `ins_constantine.mp3` — plays in W06 after "put his own face in the apse" · requires T01 heard:
> [quiet] And you've already met him. The arch you saw by the Colosseum — the emperor assembled from other emperors' monuments. [dry] Recycling other men's glory wasn't a one-off. [slow] It was the method.

**Routing logic (Cursor prompt):** "Add `path` ('a'|'b') to journey context, set at the T01 choice screen. Manifest transits/outros gain an optional `variant` field keyed to path; the player selects the matching file. Path B reorders Act II traversal to [w04, w03] with geofence triggers unchanged (the arch and the belvedere don't move — only the expected sequence and the transit files do). Path A marks W04 'optional' on the route screen with the climb offer from w03_outro_a. If a Path A traveler's GPS enters the Palatine anyway, promote W04 to active seamlessly and play T02."

**Narrative integrity check (verified):** Jerusalem payoff (needs W01) fires at Titus on both paths ✓ · WINDOW plants at W04 Ch.II and pays at the Encore floor on both ✓ · Constantine plants in shared T01 and pays at W06 on both ✓ · Path B hears the Forum-arrival reframe at Titus *after* the aerial view — the telescoping reverses (aerial → gate → immersion), which reads just as well ✓ · No insert requires the other path's exclusive content ✓.

---

# 6. THE NO-TICKET VARIANT — "THE FORUM FROM THE RAILING" (two chapters, free ground)

**When offered:** app copy if the traveler taps "I couldn't get tickets" (or dwells >10 min outside a gate): *"Sold out happens to the best of us — and Rome planned for it. The whole Forum is visible from the free terrace above it. Two stories, same wonder, zero queue. The full version will still be here tomorrow."* Waypoints geofenced along the **Via dei Fori Imperiali railing** (the long balustrade with the classic overlook, between Largo Corrado Ricci and the Curia).

## ALT-1 — THE DRAINED SWAMP, FROM ABOVE (~3:30)
⟦AMBIENT: BED-ANTIQUITY with street edge⟧

✋ [warm] Find a spot at the railing and put both hands on it. Below you — the whole of it, edge to edge — is the Roman Forum. Most people who buy the ticket never get this view: down there, the Forum is a maze you're inside. From here, it's a map. [slow] And the first thing the map tells you is what nobody puts on a postcard. This valley was a swamp.

[matter-of-fact] Low ground between the hills, it caught the runoff from all of them and flooded from the Tiber on a schedule. The most important public space in Western history began as a drainage problem — and Rome solved it the way Rome solved most things: with engineering and stubbornness. They ran a great covered sewer the length of the valley — the Cloaca Maxima — and pulled the water out. [quiet] It is still down there. Still draining. It has worked, without interruption, for twenty-five hundred years. [slow] The centre of the world is a drained marsh... kept dry by a sewer older than the Republic.

[warm] Once the valley was dry, everything followed the crowd. The market came first — flat ground is where markets go. The law courts followed the market, because markets create disputes. The temples followed the courts, because legal acts needed the gods as witnesses. The speaking platform went where the most people could hear it. [wry] Nothing was planned. The Forum's apparent order is just two centuries of buildings chasing the audience.

[quiet] And what you're looking at is the skeleton. When this space worked, every surface below you was hidden under marble — white, red porphyry, Egyptian granite. What remains is what fifteen centuries of strippers could not carry. [slow] The marble went by the cartload. The bones stayed. [softly] When you're ready... walk the railing to your left, toward the eight tall columns. The map has names.

## ALT-2 — THE GREATEST HITS, POINTED OUT (~3:45)
✋ [warm] Line yourself up with the eight standing columns at the valley's far right — that's the Temple of Saturn, Rome's treasury. Thirty metres from it, the low platform with the curved front: the Rostra, where Cicero spoke and where, in the end, his hands were displayed. [dry] Money and speech, thirty metres apart, in sight of each other. That was never a coincidence.

[matter-of-fact] Now sweep left along the valley. The plain brick box is the Curia — the Senate house, where the republic performed itself long after the emperors had emptied it of meaning. It survives because a pope made it a church. 🎭 [wry] The institution that wrote the laws against the Christians was preserved... by becoming a church. Rome never met an irony it wouldn't move into.

[quiet] Keep moving left. The small round footprint near the centre — that circle held the Temple of Vesta, where six women kept a fire alive for a thousand years. Their legal privileges were unmatched in Rome; the price of failure was being sealed underground alive. [slow] Both of those things were called the law. And the low platform mid-valley, usually with flowers on it — that is where the crowd burned Caesar's body, the night the Senate was still deciding what to do. [quiet] The mob made it sacred first.

[warm] Last: the great arch at the far left end, where the valley climbs — the Arch of Titus, carrying the carved menorah of Jerusalem, plunder from the war that paid for the Colosseum behind you. [slow] Triumph at one end, treasury at the other, the dead and the divine in between. That's the whole argument of Rome, in one glance from a free railing.

[softly] The ticket version of this walk goes down among them, stone by stone — and it will still be here whenever Rome lets you in. [warm] For today, you've seen what even most ticket-holders miss. [slow] The shape of the thing. [quiet] The map under the maze.

**Production notes:** two files, `alt_forum_1.mp3` / `alt_forum_2.mp3`, standard pipeline. App: if ALT chapters are completed and the traveler later enters the park (ticket obtained), full Act III plays normally — the ALT files never block anything. Add both to the offline day-package.
