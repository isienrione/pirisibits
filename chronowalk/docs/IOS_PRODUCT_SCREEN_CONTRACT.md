# ChronoWalk iOS product screen contract

Source of truth for native consumer surfaces. Implementation must conform.

This is not an architecture document. The unit the traveler experiences is **the adaptive curated route**. Hero Experiences, Discoveries, and Reveals are content components inside that route.

## Binding principle

ChronoWalk understands me → proposes something worth doing → I understand and optionally modify the plan → ChronoWalk guides me → the city reveals itself → at natural decision points ChronoWalk adapts → I keep going without ever feeling trapped in an itinerary.

The UI must never feel like a registry browser, audio-tour catalog, POI database, technical recommendation engine, questionnaire, or checklist itinerary.

## Global chrome

**Layout (top → bottom)**

1. Status bar (system)
2. Safe-area top spacing
3. Back control + optional subtle ChronoWalk identity
4. Progress (onboarding only)
5. Content
6. Primary actions
7. Tab bar on Discover / Map / Saved / Settings (`Discover` · `Map` · `Saved` · `Settings`)

**Back**

- Use the canonical `NativePageHeader` / `.native-page-header` on native-owned flows.
- Restrained ink chevron, 44×44 hit target, no floating grey circle over the logo.
- Must never overlap the clock, Dynamic Island / notch, wordmark, or headline.

**Forbidden in consumer UI**

`city-agnostic`, `schema`, `content type`, `registry`, `scope`, `rank`, `ranker`, `unlock scope`, `location optional`, `comfort preference, never a safety guarantee`, `Hero` / `Heroes` as a product label, `route mutation`, `consumer experience grouping`.

**Distance**

- **A.** Traveler → first stop: only with a plausible in-Rome fix.
- **B.** Route-item → route-item: Rome geometry, labeled as the walk between stops.
- Remote planner: “Planning Rome from afar.” Never “3 min walk” as if the traveler is at the Pantheon.

**Placeholders**

1. Real item photo
2. Real cluster / streetscape that does not misidentify another monument
3. Elegant contextual neutral treatment
4. Subtle abstract Rome texture — never a ChronoWalk logo in a beige square

---

### 1 Welcome

| | |
| --- | --- |
| **User question** | Is this for me, and can I begin without buying? |
| **Hierarchy** | Cinematic Rome still → ChronoWalk wordmark → one proposition → supporting line → CTAs |
| **Primary CTA** | Start exploring — free |
| **Secondary CTA** | I already have access |
| **Optional** | None |
| **Forbidden** | Private audio guide, stacked lockup, intro logo video, catalog language |
| **Transitions** | Start → Interests. Access → access handoff |
| **Above the fold** | Proposition + primary CTA (bottom-anchored over the still) |

---

### 2 Interests

| | |
| --- | --- |
| **User question** | What am I drawn to? |
| **Hierarchy** | Conversation prompt → compact interest chips (max 4) → Surprise me |
| **Primary CTA** | Continue |
| **Secondary CTA** | Surprise me (alternative to choosing) |
| **Optional** | Change later from Settings |
| **Forbidden** | city-agnostic, rank/ranker, “choose up to four” as a form instruction without the human prompt |
| **Transitions** | Continue → optional refinement (if useful) or Exploration Style. Back → Welcome |
| **Above the fold** | “What are you drawn to?” + first chips. Progress is step 1 of 6 |

Consumer labels: History & civilizations; Architecture & design; Art & artists; Food & local life; Politics & power; Religion & belief; Engineering & how things work; People & everyday stories; Hidden places; Iconic must-sees; Nature & landscapes; Contemporary culture.

---

### 3 Optional interest refinement

| | |
| --- | --- |
| **User question** | Is there a part of this I’m less drawn to? |
| **Hierarchy** | One human question → compact chips → Nothing in particular / Skip |
| **Primary CTA** | Continue |
| **Secondary CTA** | Skip / Nothing in particular |
| **Optional** | Entire screen is optional |
| **Forbidden** | Repeating “Less interested in X” on giant cards; numbering this as a mandatory step |
| **Transitions** | Continue/Skip → Exploration Style. Back → Interests |
| **Above the fold** | The question + first chips. Progress label: Optional (not “2 of 6”) |

History example: “What part of history loses you?”

---

### 4 Exploration Style

| | |
| --- | --- |
| **User question** | How do I like to move through a city? |
| **Hierarchy** | Three visible continua, not a pre-ticked confirmation |
| **Primary CTA** | Continue (enabled after the three continua have a choice) |
| **Secondary CTA** | None |
| **Optional** | None |
| **Forbidden** | Aggressive preselection; “Structured / Mix / Iconic” without the continuum |
| **Transitions** | Continue → Mobility. Back → refinement or Interests |
| **Above the fold** | First continuum. Progress: 2 of 6 |

Continua: Give me a plan ↔ Let me wander · The essentials ↔ Things most visitors miss · Take my time ↔ See more.

---

### 5 Time / Mobility / Trip Context

Split across three required screens. Meal / end-of-session intent is asked later, not here.

#### 5a Mobility + urban comfort

| | |
| --- | --- |
| **User question** | How do I want to move, and what feels like me in an unfamiliar city? |
| **Hierarchy** | Walking tolerance → Walk / Public transport / Taxi · rideshare → urban comfort |
| **Primary CTA** | Continue |
| **Secondary CTA** | None |
| **Optional** | Extra transport modes |
| **Forbidden** | Safety disclaimer as body copy; options clipped behind the CTA |
| **Transitions** | Continue → Trip horizon. Back → Style |
| **Above the fold** | Walking tolerance. Progress: 3 of 6 |

Urban prompt: “When you’re somewhere unfamiliar…” Options: I love wandering anywhere · I’m comfortable off the tourist trail · I prefer lively, well-trafficked areas · Keep me mostly around familiar visitor areas.

#### 5b Trip horizon + anchors

| | |
| --- | --- |
| **User question** | How long is this visit — and do I already have plans? |
| **Hierarchy** | Horizon choices → optional “Already have plans?” |
| **Primary CTA** | Continue |
| **Secondary CTA** | Add ticket / reservation / meal / must-do |
| **Optional** | Anchors |
| **Forbidden** | Prefilling a fake “Colosseum at 9:30” as committed data; clipped horizon options |
| **Transitions** | Continue → Available time now. Back → Mobility |
| **Above the fold** | Horizon list. Progress: 4 of 6 |

Horizons: I live here · Just today · 2–3 days · 4–7 days · A week or more · Not sure yet. Anchor title field may use placeholder text only.

#### 5c Available time now

| | |
| --- | --- |
| **User question** | How much time do I have right now? |
| **Hierarchy** | Distinct from trip horizon. Creates a real composer constraint |
| **Primary CTA** | Continue |
| **Secondary CTA** | None |
| **Optional** | None |
| **Forbidden** | Merging this with trip horizon; calling a 1h composition a half-day plan |
| **Transitions** | Continue → Location. Back → Trip horizon |
| **Above the fold** | The question + first options. Progress: 5 of 6 |

Options: 30 min · 1 hour · 2 hours · Half day · All day · Just exploring.

Target utilization: 30 min → ~20–35 · 1h → ~45–70 · 2h → ~90–135 · half day → ~150–240 · all day → ~300–480. If startable inventory cannot reach the band, say so honestly and do not pad with weak or locked content.

---

### 6 Location

| | |
| --- | --- |
| **User question** | Can ChronoWalk start from where I actually am? |
| **Hierarchy** | Compact prompt → one-line why → small privacy note → CTAs. No empty vertical desert |
| **Primary CTA** | Use my location |
| **Secondary CTA** | Not now |
| **Optional** | None |
| **Forbidden** | Enormous dead space; “location optional” jargon; fabricating a Rome fix |
| **Transitions** | Either CTA → Proposed Plan. System owns the permission dialog. Back → Available time |
| **Above the fold** | Title, why, both CTAs. Progress: 6 of 6 |

---

### 7 Proposed Plan

| | |
| --- | --- |
| **User question** | What would this afternoon actually feel like, and shall I start? |
| **Hierarchy** | Arc title → beginning → ending → duration · walking · 2–3 themes → order as a walk, not a ranked list → sticky Start |
| **Primary CTA** | Start this route (visible without scrolling past the itinerary; sticky) |
| **Secondary CTA** | Adjust plan |
| **Optional** | Why this? |
| **Forbidden** | Database cards (EXPERIENCE / WORTH NOTICING / LOCKED as dominant copy); calling a short free-guest route a half-day plan; traveler-to-Rome walk minutes when remote |
| **Transitions** | Start → Active Route. Adjust → Adjust plan. Why this → sheet. Back → Discover or Context |
| **Above the fold** | Arc title, duration, walking, primary CTA |

Hero cards: larger, longer duration, stronger title. Discovery: smaller, shorter, lighter. Mystery: surprise treatment, identity concealed. Locked: subtle lock + coverage cue.

Remote: “Planning Rome from afar.” Route-leg walks may show between Rome items.

Inventory-limited: “Here’s a great first hour. Unlock more of Rome to extend the afternoon.”

---

### 8 Why this? / Small change I’d suggest

#### Why this?

| | |
| --- | --- |
| **User question** | Why this plan, in human language? |
| **Hierarchy** | 2–3 deterministic sentences from structured reasons |
| **Primary CTA** | Close / Start this route |
| **Secondary CTA** | Adjust plan |
| **Optional** | None |
| **Forbidden** | Raw arrays, duplicated conjunctions (“and and”), unsupported claims |
| **Transitions** | Close → Proposed Plan |
| **Above the fold** | The explanation |

#### Small change I’d suggest

Feature-flagged. Do not show unless the remaining-time overrun is unambiguous (`ROUTE_PROACTIVE_SUGGESTIONS`). Future copy: lateness, skip X, continue to Y. Actions: Update my route · Keep original. Never fake this intelligence.

---

### 9 Discover Home

| | |
| --- | --- |
| **User question** | What should I do from here, right now? |
| **Hierarchy** | Greeting → “I have a great {duration} from here.” → compact route preview → Start exploring. Below: Or explore nearby (2–3 cards only) |
| **Primary CTA** | Start exploring |
| **Secondary CTA** | See route / Adjust |
| **Optional** | Map, See all Rome |
| **Forbidden** | Leading with a feed of places; catalog home |
| **Transitions** | Start → Active Route. See route → Plan or Active. Nearby card → Preview. Tabs stay |
| **Above the fold** | Greeting, duration line, primary CTA |

Remote greeting uses planning language, not “from here” as a GPS claim.

---

### 10 Active Route

| | |
| --- | --- |
| **User question** | What’s my afternoon, and what’s next? |
| **Hierarchy** | Your afternoon · remaining time → visual timeline (done / now / next) → actions |
| **Primary CTA** | Continue |
| **Secondary CTA** | View route |
| **Optional** | Change it |
| **Forbidden** | Tour language, “0 of 21”, stop counts as the headline |
| **Transitions** | Continue → Walk or Mystery. Change it → Route Controls. View route → Map or timeline |
| **Above the fold** | Title, remaining time, next stop, Continue |

---

### 11 Bifurcation

| | |
| --- | --- |
| **User question** | Where to next — without feeling trapped? |
| **Hierarchy** | Where to next? → one Recommended → max 2 alternatives (one may be Surprise Discovery) → Stay on the plan |
| **Primary CTA** | Recommended (or Stay on the plan when the default is already clear) |
| **Secondary CTA** | Stay on the plan |
| **Optional** | See other options (Compare) |
| **Forbidden** | Forcing a decision after every item when continuation is obvious; more than 2 alts |
| **Transitions** | Choice → Walk / Mystery (mutates remaining plan). Compare → Compare Options |
| **Above the fold** | Recommended + Stay on the plan |

---

### 12 Compare Options

| | |
| --- | --- |
| **User question** | How do these next steps differ? |
| **Hierarchy** | Max 3. Each: title or mystery veil · walking time · experience time · 1–2 tags · one-sentence reason |
| **Primary CTA** | Select an option |
| **Secondary CTA** | Close |
| **Optional** | None |
| **Forbidden** | “You left the tour.” Appearing without an explicit request |
| **Transitions** | Selection mutates route and recomposes remaining plan → Walk / Mystery |
| **Above the fold** | The three options |

---

### 13 Hero Preview

| | |
| --- | --- |
| **User question** | Is this experience worth starting? |
| **Hierarchy** | Large real image → title → Free experience or coverage name → duration → one strong reason |
| **Primary CTA** | Start walking (locked: Start → coverage unlock, no login wall) |
| **Secondary CTA** | Save for later |
| **Optional** | Back |
| **Forbidden** | Access-code wall before preview; Hero jargon; fake subject photo |
| **Transitions** | Start → Walk / Player. Locked Start → Unlock Rome. Save stays on preview |
| **Above the fold** | Image, title, duration, primary CTA |

---

### 14 Walk

| | |
| --- | --- |
| **User question** | How do I get there? |
| **Hierarchy** | Walking to X → time · distance (only if valid) → map / route / next turn |
| **Primary CTA** | I’ve arrived (operational confirm) |
| **Secondary CTA** | Route |
| **Optional** | Pause |
| **Forbidden** | Editorial overload; 0 min; traveler-to-Rome minutes when remote; mystery identity |
| **Transitions** | Arrived → Arrival. Route → Active Route. Pause → Route Controls |
| **Above the fold** | Destination, valid time/distance, map |

---

### 15 Arrival

| | |
| --- | --- |
| **User question** | I’m here — when do we start? |
| **Hierarchy** | You’ve arrived. Title. “Take a moment to look around. We’ll start when you’re ready.” |
| **Primary CTA** | Start experience |
| **Secondary CTA** | View route |
| **Optional** | None |
| **Forbidden** | Autoplay; fake reveal |
| **Transitions** | Start → Player or Discovery detail. Mystery arrival reveals identity |
| **Above the fold** | Title + Start experience |

---

### 16 Experience Player

| | |
| --- | --- |
| **User question** | Can I listen and look without fighting the chrome? |
| **Hierarchy** | Reuse the proven audio player. Minimal operational chrome |
| **Primary CTA** | Play / continue |
| **Secondary CTA** | Pause |
| **Optional** | Route |
| **Forbidden** | New player chrome in this milestone |
| **Transitions** | Complete → Best Next / Bifurcation |
| **Above the fold** | Player controls |

---

### 17 Reveal

| | |
| --- | --- |
| **User question** | What should I look at right now? |
| **Hierarchy** | Full-screen / immersive only when historically worthwhile **and** the asset is ready |
| **Primary CTA** | Continue |
| **Secondary CTA** | None |
| **Optional** | None |
| **Forbidden** | Fake placeholder Reveal |
| **Transitions** | Continue → Player / next beat |
| **Above the fold** | The visual |

---

### 18 Discovery / Surprise Discovery

#### Known Discovery

| | |
| --- | --- |
| **User question** | What is this small thing, and what should I look at? |
| **Hierarchy** | Image → title → one-sentence why → Look here → short text → optional real audio/visual → Done |
| **Primary CTA** | Done |
| **Secondary CTA** | Keep exploring |
| **Optional** | Save |
| **Forbidden** | Mini-Hero complexity; 1–6 min target exceeded with a fake deep player |
| **Transitions** | Done → Best Next if on a route, else Discover |
| **Above the fold** | Image, title, why, Look here |

#### Surprise Discovery (Mystery)

**Before reveal**

- Title: ✦ A hidden detail
- “2 min from your route” only when that is a real route-leg
- ~duration
- “There’s something on this street most people walk straight past.”
- Actions: Take me there · Reveal what it is
- Must not expose name, identifying photo, giveaway description, identity in accessibility labels, or map popup identity

**After Reveal (card flip or equivalent)**

- Actual title, photo, short teaser
- Take me there

If the traveler does not reveal, identity stays concealed until Arrival.

---

### 19 Best Next

| | |
| --- | --- |
| **User question** | What’s next after this? |
| **Hierarchy** | What’s next? → Best Next (one default) → two alternatives max → See full route |
| **Primary CTA** | Best Next |
| **Secondary CTA** | See full route |
| **Optional** | Alternatives |
| **Forbidden** | Feed of the city. If an ActiveRoute exists, route continuation has priority (use Bifurcation) |
| **Transitions** | Choice → Walk / Preview. See full route → Active Route |
| **Above the fold** | Best Next card |

---

### 20 Map

| | |
| --- | --- |
| **User question** | Where is everything in space — including my route? |
| **Hierarchy** | Spatial control surface, not the primary product. Markers: experiences, discoveries, mystery (veiled), locked, saved, current route, current location when valid |
| **Primary CTA** | Open selected place |
| **Secondary CTA** | Filters: All · Experiences · Discoveries · My route |
| **Optional** | Coverage unlock from a locked pin |
| **Forbidden** | Mystery identity; fake user location outside Rome; Map as home |
| **Transitions** | Pin → Preview. My route markers → Active / Walk |
| **Above the fold** | Map canvas + filters |

---

### 21 Saved

| | |
| --- | --- |
| **User question** | What did I keep for later? |
| **Hierarchy** | Guest-local. Filters: All · Experiences · Discoveries. Same content quality and titles as elsewhere |
| **Primary CTA** | Open a saved item |
| **Secondary CTA** | Remove |
| **Optional** | Empty state: save without an account |
| **Forbidden** | Account wall; catalog-style titles |
| **Transitions** | Open → Preview / Discovery |
| **Above the fold** | Title + filters or empty state |

---

### 22 Settings / Profile

| | |
| --- | --- |
| **User question** | Can I change how ChronoWalk knows me, and where is help / access? |
| **Hierarchy** | Profile & preferences · Trip context · Language · Offline Rome · Purchases & access · Account (when implemented) · Help · About ChronoWalk |
| **Primary CTA** | Update how ChronoWalk recommends (Trip context) |
| **Secondary CTA** | I bought ChronoWalk elsewhere |
| **Optional** | DEV QA / reset — never in Release |
| **Forbidden** | Shipping DEV tools; jargon (“Travel Context schema”) |
| **Transitions** | Trip context → Context flow. Purchases → Unlock Rome. Help / About → existing pages |
| **Above the fold** | Profile & preferences + Trip context |

---

### 23 Unlock Rome

| | |
| --- | --- |
| **User question** | What would unlocking change about my route? |
| **Hierarchy** | Outcomes, not scope IDs: Ancient Rome · Historic Center · All Central Rome |
| **Primary CTA** | Unlock {name} (disabled until StoreKit — “Purchases coming next”) |
| **Secondary CTA** | Restore purchases · I bought ChronoWalk elsewhere · Not now |
| **Optional** | None |
| **Forbidden** | Real purchase in this milestone; login wall before preview; scope IDs |
| **Transitions** | Dismiss → previous screen. Future purchase → return to route and extend contextually |
| **Above the fold** | Outcome names + what they add |

---

### 24 Route Controls

| | |
| --- | --- |
| **User question** | Can I change this afternoon without starting over? |
| **Hierarchy** | Your afternoon · remaining time → Change the plan · Reorder stops · Add something · Add a must-see · I need food / a break · I need to finish by… · Pause · End route |
| **Primary CTA** | Change the plan |
| **Secondary CTA** | Pause / End route |
| **Optional** | Unfinished controls: hide in Release; DEV may mark “coming later” |
| **Forbidden** | Dead buttons that look live in Release |
| **Transitions** | Change / Reorder / Add → Adjust plan. Pause stays. End → Discover |
| **Above the fold** | Remaining time + Change the plan |

---

## QA fixtures (deterministic)

| Id | State |
| --- | --- |
| A | In-Rome free guest, location near Pantheon, 2 hours, architecture + hidden, mix style |
| B | Remote planner, physical location outside Rome, 4–7 days, half day available, history + art — no traveler-to-Rome walk minutes |
| C | Entitled Rome user, complete entitlement, active route |
| D | Mystery unrevealed |
| E | Mystery revealed |

Use these for screenshots so cloud captures do not hide product problems behind random state.

Validate layout at 390×844, 393×852, 430×932.
