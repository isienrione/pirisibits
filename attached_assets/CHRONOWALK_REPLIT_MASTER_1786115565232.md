# CHRONOWALK — COMPLETE REPLIT GREENFIELD FOUNDER PACK



---

# FILE: 00_README_FIRST.md

# CHRONOWALK — REPLIT GREENFIELD FOUNDER PACK

## Purpose of this folder

This folder is the operating brief for a **greenfield rebuild of ChronoWalk**.

The attached Founder Playbook remains the highest-level source of truth for the company, brand, product philosophy, editorial integrity, expansion principles, and long-term ambition.

These markdown files do **not** replace the Founder Playbook. They translate it into implementation-grade instructions for an AI software/product agent so that important product intent does not disappear between conversations, prompts, prototypes, or technical choices.

## Source-of-truth hierarchy

When documents conflict, use this order:

1. **Founder Playbook** — company constitution and permanent product principles.
2. **This Founder Pack** — implementation interpretation of the Playbook for the greenfield build.
3. **Explicit founder decisions made during the active build.**
4. **Existing ChronoWalk implementation and artifacts** — evidence and references only, never automatic requirements.
5. **Agent preferences, defaults, templates, or convenience** — lowest authority.

If there is uncertainty, **stop and surface the conflict instead of silently choosing**.

---

# The single most important instruction

ChronoWalk is **not an AI-generated audio-guide app**.

It is a **Historical Immersion Platform** designed to create a feeling of historical presence while preserving the freedom of independent travel.

The product transformation is:

**ruin → room**  
**place → story**  
**walking → discovery**  
**information → presence**  
**sightseeing → city understanding**

The city is the protagonist.  
History is the experience.  
Technology is the mechanism.

A user should not finish thinking, “That was a clever app.”

They should finish thinking:

**“I will never look at this place the same way again.”**

---

# Mandatory reading order for Replit / any implementation agent

Before writing production code:

1. Read the Founder Playbook completely.
2. Read `01_GREENFIELD_BUILD_BRIEF.md`.
3. Read `02_PRODUCT_EXPERIENCE_SPEC.md`.
4. Read `03_TECHNICAL_ARCHITECTURE_AND_PLATFORM.md`.
5. Read `04_CONTENT_AUDIO_VISUAL_PRODUCTION_SYSTEM.md`.
6. Read `05_CHRONOWALK_FOUNDRY_CITY_FACTORY_AND_QA.md`.
7. Read `06_AGENT_WORKING_PROTOCOL_AND_BUILD_GATES.md`.

Do not jump directly into implementation.

---

# What this project is allowed to change

Almost every current implementation choice is replaceable.

The new build may change:

- information architecture
- visual design
- app navigation
- technical stack
- route architecture
- content model
- maps
- audio player
- onboarding
- commerce flow
- Threshold implementation
- reconstruction technology
- use of camera
- use of AR
- location behavior
- offline strategy
- personalization
- historical Q&A
- content production pipeline
- CMS
- internal tools
- current Rome stop list
- exact number of stops per city
- existing media assets
- existing audio
- existing code

What it may **not** casually change:

- historical rigor
- premium quality bar
- human narrative standard
- traveler autonomy
- location-specific storytelling
- historical presence as North Star
- the city remaining the protagonist
- technology serving the story rather than becoming the attraction
- quality preceding scale
- the ambition to become a repeatable multi-city platform rather than a collection of tours

---

# Reference-artifact rule

Existing ChronoWalk screenshots, audio, maps, reconstructions, landing pages, routes, and code may be supplied.

Apply this instruction literally:

> **These are reference artifacts, NOT implementation requirements.**
>
> Identify what is excellent and preserve its underlying principle.  
> Identify what is mediocre and replace it.  
> Do not reproduce weaknesses merely for visual consistency.

Never interpret “reference” as “copy this screen.”

---

# Greenfield ambition

Build as if the product team had access to:

- a world-class consumer product designer
- a senior mobile/web engineer
- a GIS/location engineer
- a museum interpretation specialist
- a historical researcher
- a narrative nonfiction editor
- an audio producer
- a sound designer
- a reconstruction art director
- a computer-vision / spatial-computing engineer
- a growth-aware product strategist

The goal is not maximum feature count.

The goal is an experience whose **included features are executed at commercial-product quality**.

---

# Expansion target

The platform must be architected from day one to support **100+ cities**.

The initial strategic destination includes at least:

- Rome
- Florence
- Venice
- Paris
- London
- Barcelona
- Amsterdam
- Prague
- Lisbon
- New York

However:

**Do not build ten mediocre cities to prove scale.**

First prove extraordinary quality in a narrow vertical slice. Then prove repeatability. Then scale.

Architecture should be ready for 100 cities even when content exists for only one.

---

# Definition of success for this rebuild

A successful greenfield ChronoWalk should simultaneously be:

- more immersive than a traditional audio guide
- more independent than a human group tour
- more editorially controlled than an open marketplace
- more emotionally memorable than Wikipedia/Google/AI answers
- more useful in the physical city than a travel blog
- more human than obvious AI-generated travel content
- technically resilient outdoors
- fast enough to use spontaneously
- scalable without making every new city a software project
- rigorous enough that trust becomes an accumulated brand asset

The goal is not to automate tours.

**The goal is to automate the production of extraordinary tours without automating away judgment.**


---

# FILE: 01_GREENFIELD_BUILD_BRIEF.md

# CHRONOWALK — GREENFIELD BUILD BRIEF

## 1. Assignment

Rebuild ChronoWalk from first principles.

Do not recreate the current product by default.

Treat the existing ChronoWalk implementation as accumulated research from a previous generation of the product, not as the technical specification.

ChronoWalk is a **Historical Immersion Platform** whose job is to help a person physically standing in a city understand, imagine, and emotionally experience the invisible history occupying the same space.

The core user feeling is not “I learned facts.”

It is:

**“The past suddenly became present here.”**

---

# 2. Product thesis

ChronoWalk exists because there is a gap between:

- what a traveler can physically see
- what happened there
- what the place once looked, sounded, and felt like
- what the traveler is able to imagine without help

ChronoWalk closes that gap using the smallest combination of story, location, sound, image, reconstruction, interaction, and technology required to produce **historical presence**.

It is not sufficient to explain a monument correctly.

The user’s perception must change.

---

# 3. Job to be done

The traveler is effectively saying:

- Help me understand what I am looking at.
- Help me explore freely without losing depth.
- Help me make better use of limited travel time.
- Help me notice things I would otherwise miss.
- Help me feel part of the place rather than outside it.
- Help me return home with stories, not merely photographs.
- Help me feel confident that I did not miss the essential meaning of the city.

ChronoWalk does not sell audio files.

It sells **context, presence, confidence, discovery, and emotional access to another time**.

---

# 4. Product invariants

The following are permanent unless the Founder explicitly changes them.

## 4.1 The city is the protagonist

The interface must never become more interesting than the city.

The best technology often disappears.

If the user spends the experience admiring the app rather than observing the physical place, the product has failed.

## 4.2 History must be felt

Information alone is insufficient.

Each meaningful stop should alter something about the traveler’s perception.

## 4.3 Freedom is part of the product

The user must be able to:

- begin flexibly
- pause
- resume
- skip
- change pace
- stop for coffee
- improvise
- wander
- rejoin the story
- complete only part of an experience without feeling punished

Freedom must not imply losing context or progress.

## 4.4 Historical rigor is a feature

Emotion must never be built on falsehood.

Clearly distinguish:

- accepted fact
- probable interpretation
- hypothesis
- debated interpretation
- legend
- reconstruction assumption
- dramatized device

## 4.5 Technology serves story

Do not add AR, AI, camera effects, gamification, or 3D because they are fashionable.

Add them only if they materially increase historical presence, orientation, accessibility, or traveler freedom.

## 4.6 Quality precedes scale

Ten cities at generic quality are strategically worse than one city that defines the category.

## 4.7 The whole journey is product

ChronoWalk begins before the first narration and ends after the final stop.

Discovery, trust, purchase, access, preparation, arrival, orientation, immersion, completion, memory, recommendation, and return all belong to the product.

---

# 5. Explicit permission to surpass the current ChronoWalk

The agent may challenge and replace current implementations.

Do not preserve a feature merely because it exists.

The relevant question is:

**What underlying user or product principle was this feature trying to achieve, and can we achieve it materially better now?**

Examples:

- The current Then/Now interaction may be replaced by a camera-assisted spatial reveal.
- A static route map may become contextual navigation.
- A fixed route may become a story graph with optional sequencing.
- Existing Rome stop counts do not constrain future cities.
- Current audio may be regenerated if a superior narration/sound system can be created.
- Existing reconstructions may be regenerated if a more credible and historically traceable pipeline is available.

---

# 6. Reference-artifact rule

Apply exactly:

> **These are reference artifacts, NOT implementation requirements.**
>
> Identify what is excellent and preserve its underlying principle.  
> Identify what is mediocre and replace it.  
> Do not reproduce weaknesses merely for visual consistency.

When reviewing an existing artifact, classify it as:

- **KEEP PRINCIPLE**
- **KEEP EXECUTION**
- **REINTERPRET**
- **REPLACE**
- **REMOVE**

Document why.

---

# 7. Product quality benchmark

Do not benchmark only against audio-tour applications.

Benchmark different dimensions against the best relevant products and media:

- consumer-app interaction quality
- museum-quality interpretation
- narrative nonfiction
- excellent travel writing
- cinematic audio production
- high-end mapping/navigation
- spatial computing experiences
- premium editorial brands

ChronoWalk should feel:

- intelligent
- intimate
- cinematic
- trustworthy
- effortless
- place-specific
- surprising
- calm
- premium
- human

It must not feel:

- generic
- templated
- encyclopedic
- adjective-heavy
- verbose
- “AI generated”
- robotic
- childish
- over-gamified
- like a 2012 museum audio guide
- like ChatGPT wearing historical costumes
- like a collection of independent MP3s

---

# 8. The core experience loop

The ideal loop is:

**WALK**  
→ notice something  
→ understand where to stand / look  
→ ChronoWalk reveals why it matters  
→ hear a human story  
→ recover something invisible  
→ experience a visual and/or sonic transformation  
→ understand the physical place differently  
→ continue walking

The phone should repeatedly return the user’s attention to the city.

---

# 9. “Prototype in breadth, not in quality”

The first serious implementation should be a **three-stop Rome vertical slice**, not a ten-city demo.

Recommended test set:

### Pantheon
Tests a largely surviving building, architectural context, continuity, interior/exterior relationship.

### Roman Forum
Tests ruins that demand mental reconstruction, spatial interpretation, layered history, and orientation.

### Colosseum
Tests an iconic monument, multiple historical phases, crowd-scale imagination, and flagship immersive treatment.

This slice is narrow in scope but must be **commercial-product quality**.

A user experiencing these three stops should reasonably believe they are using a premium paid travel product.

Do not use “prototype” as permission for sloppy interface, placeholder copy, robotic audio, fake history, broken responsive behavior, or generic reconstruction art.

---

# 10. First-minute requirement

ChronoWalk’s differentiation must be demonstrated early.

The first minutes must contain a credible “wow” moment that proves:

**This is not just an audio guide.**

Possible methods include:

- perceptual alignment of present and past
- a spatial camera reveal
- an extraordinary location-specific story timed to what is visible
- reconstruction that suddenly makes ruins legible
- restrained sound archaeology that changes how the site feels

Do not delay the product’s magic until stop six.

---

# 11. Historical presence, not technological spectacle

A more advanced experience is not automatically a better experience.

A simple interaction that creates a powerful sense of historical presence is preferable to sophisticated 3D that is fragile, distracting, inaccurate, or difficult to scale.

When evaluating features, ask:

1. Does it make the place easier to understand?
2. Does it increase presence?
3. Does it preserve freedom?
4. Does it work outdoors on real phones?
5. Does it scale?
6. Is historical confidence sufficient?
7. Does it call attention to the city or to itself?

---

# 12. Long-term target

The real product is not just the consumer app.

The long-term system is:

**ChronoWalk Engine**  
+ **ChronoWalk Foundry / CMS**  
+ **Historical Knowledge Graph**  
+ **Research & evidence system**  
+ **Narrative production system**  
+ **Audio production system**  
+ **Reconstruction pipeline**  
+ **Localization system**  
+ **QA system**  
+ **Consumer experience**

The consumer app is the visible tip of a larger production platform.

---

# 13. Commercial reality

The build must be sellable, not merely impressive.

Every major feature should be evaluated on:

- user value
- reliability
- performance
- content cost
- marginal city-production cost
- QA burden
- platform compatibility
- conversion impact
- retention / repurchase potential
- support burden

A technically beautiful feature that makes city expansion economically impossible is not automatically strategic.

---

# 14. Ten-city ambition without ten-city slop

Design architecture for at least:

Rome, Florence, Venice, Paris, London, Barcelona, Amsterdam, Prague, Lisbon, New York.

Do not force the same number of stops onto every city.

The story determines the route.

Florence may need 16. Paris may need 28. Venice may need 19.

The content model must support:

- multiple routes per city
- overlapping stops
- different route lengths
- optional branches
- express experiences
- neighborhood experiences
- thematic experiences
- different periods
- paid/free previews
- future personalized routing

---

# 15. Anti-ChronoWalk

Never allow the product to become:

- AI-generated travel content at scale
- Wikipedia read aloud
- a low-cost audio marketplace
- generic beige luxury travel UI
- empty cinematic spectacle
- historically overconfident fantasy
- constant phone interaction
- points/badges/streaks layered onto every behavior
- a chatbot as the main experience
- a navigation app with history bolted on
- a visual-effects demo with weak narrative
- identical city templates with landmarks swapped

**Consistency means standards and system, not sameness.**


---

# FILE: 02_PRODUCT_EXPERIENCE_SPEC.md

# CHRONOWALK — PRODUCT & EXPERIENCE SPECIFICATION

# 1. Experience objective

ChronoWalk should make a traveler feel accompanied by an extraordinarily knowledgeable human presence without forcing the logistics of a human group tour.

The product must help the traveler:

- orient physically
- notice
- imagine
- understand
- feel
- continue naturally

The user should spend more time looking at the city than at the phone.

---

# 2. Outdoor-first UX constraints

Design for actual travel conditions:

- bright sunlight
- one-handed use
- walking
- intermittent attention
- noisy environments
- headphones / earbuds
- low battery
- weak or expensive connectivity
- roaming constraints
- interruptions
- locked-screen listening
- older phones
- varying screen sizes
- tourists unfamiliar with local streets
- users who are tired, hungry, late, distracted, or carrying bags

Do not design as if the user were sitting at a desk with perfect Wi-Fi.

---

# 3. Interaction principles

## 3.1 One-thumb operation
Critical actions should be easy to reach and obvious.

## 3.2 Screen-off value
The product should remain useful when the phone is in a pocket.

## 3.3 Audio directs attention
Narration should use the physical environment:

- “Look above the arch.”
- “Turn toward the columns.”
- “Take three steps to your left.”
- “Notice the blocked doorway.”
- “Keep the fountain behind you.”

The script is written for a person standing somewhere specific, not for a generic listener.

## 3.4 Orientation is discreet but unequivocal
The user should always be able to answer:

- Where am I?
- Am I at the right place?
- Where should I look?
- What is next?
- How far away is it?
- Can I skip it?
- How do I rejoin?

## 3.5 No punishment for wandering
ChronoWalk must recover gracefully if the traveler deviates.

Preferred promise:

**Start anywhere. Wander freely. Never lose your place.**

---

# 4. Proposed product modes

The architecture should be compatible with three experiential modes, even if they are not all implemented initially.

## Explorer
Browse nearby stories, city content, routes, and discoveries.

## Companion
Active walking experience:
- audio
- progress
- subtle direction
- distance
- map on demand
- optional haptics
- Threshold / reconstruction interactions

## Memory
Post-walk layer:
- places completed
- stories remembered
- images/reconstructions revisited
- route summary
- saved moments
- sharing
- next-city invitation

Avoid making these modes visually heavy if a simpler information architecture achieves the same result.

---

# 5. Journey model

Design across the full lifecycle:

**DISCOVER → IMAGINE → BUY → ANTICIPATE → ARRIVE → DISCOVER → UNDERSTAND → FEEL → CONTINUE → COMPLETE → REMEMBER → SHARE → RETURN**

Do not optimize only the in-tour player.

---

# 6. Threshold — the visual transformation system

“Threshold” is the family name for interactions that collapse the distance between the visible present and the invisible past.

The existing Then/Now slider is a first-generation implementation, not a permanent technical constraint.

The product should investigate three tiers.

---

## Tier A — Cinematic Threshold

Baseline that can scale widely.

Possible implementation:

- precisely framed present-day image or short video
- historically reconstructed matching view
- press / hold / drag transformation
- matched geometry
- elegant transition
- depth layers / parallax where useful
- restrained environmental animation
- optional historical sound transition
- no cheap “AI morph” artifacts

Goal:

The user immediately understands:
**“This is the same place.”**

Not:
**“This is a pretty ancient picture.”**

---

## Tier B — Spatial Threshold

Preferred ambitious direction for flagship use.

Use the phone camera.

Flow concept:

1. User opens the stop.
2. App asks them to face the monument.
3. A translucent alignment guide helps find the intended viewpoint.
4. Alignment becomes stable enough.
5. Interface presents a simple invitation:

**“Hold to restore Rome.”**

6. User presses and holds.
7. The historical reconstruction appears spatially over the contemporary scene.
8. Releasing can restore the present or allow controlled comparison.
9. Narration and subtle sound may synchronize with the reveal.

Important product principle:

**It does not have to be geometrically perfect AR to feel magical.**

A premium-feeling camera-assisted spatial reveal may create most of the emotional value **without requiring perfectly georeferenced, navigable 3D models for hundreds of monuments**.

This matters enormously for scalability.

The experience may use:

- guided camera pose
- perspective-matched assets
- homography / planar alignment
- feature matching
- visual anchors
- device orientation
- depth estimation when available
- segmented overlays
- WebGL/WebGPU compositing
- lightweight 3D
- camera-aware parallax

Choose the least complex technique that produces a convincing result.

Do not falsely market 2.5D compositing as full AR if it is not.

---

## Tier C — True 3D / AR Reconstruction

Experimental / flagship tier.

Candidates may include:

- Colosseum
- Roman Forum
- Acropolis
- Notre-Dame
- Tower of London
- other iconic sites where spatial reconstruction creates exceptional value

Possible features:

- anchored 3D geometry
- viewpoint movement
- spatial occlusion
- scale understanding
- layered eras
- guided reconstruction phases

This tier must not become a universal requirement unless:

- quality is demonstrably high
- historical review is feasible
- mobile performance is acceptable
- asset production is economically scalable
- maintenance burden is understood

ChronoWalk must not accidentally become a 3D-production studio whose unit economics make city expansion impossible.

---

# 7. Reconstruction UX rules

Every reconstruction must answer:

- What date / period is represented?
- Where is the viewer standing?
- Which elements are certain?
- Which are inferred?
- Which are artistic approximations?
- Is the modern scene aligned accurately enough to support the intended claim?

Where uncertainty matters, communicate it elegantly.

Examples:
- “Probable appearance, c. AD 125.”
- “Roof color reconstructed from surviving evidence.”
- “The exact decoration is debated.”

Do not interrupt the emotional moment with academic footnotes, but make evidence accessible.

---

# 8. Audio experience

Audio should feel like a brilliant, warm person beside the traveler.

Not:
- a lecturer
- a synthetic narrator
- a tourism ad
- an audiobook disconnected from location

The narrator is:
- intelligent
- conversational
- observant
- occasionally funny
- emotionally precise
- historically disciplined
- confident without pretending certainty

The voice should leave room for the city.

Silence is a tool.

---

# 9. Sound archaeology

Use sound design selectively to help reconstruct what disappeared.

Examples:
- crowd murmur
- water
- footsteps
- bells
- market texture
- distant animals
- workshop sounds
- ceremonial procession
- political crowd
- interior reverberation

This should not become theatrical wallpaper.

Use only when:
- evidence supports the atmosphere
- it helps scale, density, function, or emotion
- it does not obscure narration
- it sounds premium
- it does not feel like a theme park

The intended effect is **sound archaeology**, not radio drama.

---

# 10. Narrative rhythm

A route is a work, not a playlist.

It should contain:

- opening
- progression
- contrast
- tension
- breathing space
- human scale
- moments of wonder
- occasional humor
- climax
- resolution
- closure

Do not maintain maximum intensity.

A traveler needs:
- monumental moments
- quieter moments
- practical moments
- transitions
- pauses
- recovery

---

# 11. Narrative style rules

Prefer:
- concrete observations
- sensory orientation
- human motives
- tension
- consequence
- surprising connections
- visual evidence
- spatial language
- memorable images
- uncertainty stated honestly

Avoid:
- “Welcome to…”
- “Imagine stepping back in time…”
- “Picture this…”
- “Nestled in…”
- “This magnificent…”
- “A testament to…”
- stacks of dates
- lists of emperors
- generic “rich history”
- adjective-heavy travel copy
- pseudo-poetic AI filler
- facts unrelated to what the traveler can see or feel

A date belongs when it clarifies the story, not because research found it.

---

# 12. Recommended story shape for a stop

Not every stop must use the same template, but a strong default is:

1. **Orient** — where to stand / what to look at
2. **Hook** — why this matters now
3. **Observation** — use visible evidence
4. **Human story / conflict**
5. **Reveal** — explain something invisible
6. **Threshold / sonic / spatial transformation**
7. **Meaning** — why this changed the city / world / people
8. **Return to present**
9. **Transition** — move naturally toward what comes next

The user should repeatedly feel:
**“Oh — now I see it.”**

---

# 13. Historical Q&A / conversational AI

A future contextual assistant may answer questions about the current stop.

It must not become the main product.

Requirements:
- answer only from approved knowledge / retrieval sources
- clearly indicate uncertainty
- know the current stop / era / route context
- avoid hallucinated anecdotes
- optionally suggest “deeper layer” content
- keep responses concise outdoors
- never interrupt active narration unsolicited

The best AI feature may be invisible infrastructure rather than a visible chatbot.

---

# 14. Personalization

Future personalization may adapt:
- route length
- interests
- available time
- walking ability
- starting point
- closing hours
- weather
- crowd density
- history interests
- food / rest needs
- child/family context

But personalization must preserve editorial coherence.

Do not convert ChronoWalk into a random stop recommender.

A personalized route should still feel authored.

---

# 15. Maps & navigation

Maps should be:
- contextual
- elegant
- legible outdoors
- available on demand
- secondary to the city

Potential features:
- current stop
- next stop
- route line
- optional alternatives
- distance
- estimated walk time
- completed stops
- rejoin route
- nearby meaningful stop
- clear ticket/access notes

Avoid clutter.

---

# 16. Offline & connectivity

Design for:
- initial download before walking
- media caching
- route data caching
- map fallback
- content availability without continuous connectivity
- robust progress save
- clear storage/data expectations
- graceful degradation

Never promise “offline” if critical functionality silently depends on live connectivity.

---

# 17. Accessibility

Support where feasible:
- transcripts
- captions
- screen-reader labels
- reduced motion
- text scaling
- visual alternatives to sound
- audio alternatives to visual-only information
- high outdoor contrast
- route accessibility notes
- optional slower narration / playback speed
- language switching

Accessibility should not feel bolted on.

---

# 18. Product behavior after completion

Completion should create:
- a sense of journey closure
- a concise memory artifact
- a reason to share
- a reason to return
- a bridge to another city or route

Avoid cheap gamification.

A meaningful completion memory is better than confetti.


---

# FILE: 03_TECHNICAL_ARCHITECTURE_AND_PLATFORM.md

# CHRONOWALK — TECHNICAL ARCHITECTURE & PLATFORM REQUIREMENTS

# 1. Architecture principle

ChronoWalk must be **city-agnostic**.

No core component may assume Rome.

Adding Florence should be primarily a content/asset operation, not a software-development project.

Never create a pattern such as:

- `RomePage.tsx`
- `FlorencePage.tsx`
- `ParisPage.tsx`

with duplicated city logic.

Instead build a generic rendering system driven by structured content.

---

# 2. Platform model

Recommended conceptual hierarchy:

```text
Platform
└── City
    ├── City metadata
    ├── Experiences / Routes
    │   ├── Route metadata
    │   ├── Route graph / sequence
    │   └── Stop references
    ├── Stops
    │   ├── Place / coordinates
    │   ├── Orientation
    │   ├── Story modules
    │   ├── Audio assets
    │   ├── Reconstruction assets
    │   ├── Threshold configuration
    │   ├── Evidence / sources
    │   ├── accessibility
    │   └── localization
    ├── Practical city content
    └── Commerce / entitlement metadata
```

A stop may belong to multiple routes.

A route must not own duplicated copies of a stop.

---

# 3. Content should be data, not application code

Represent content in a database or CMS with versioning.

Core entities should include at minimum:

- `cities`
- `experiences`
- `routes`
- `route_nodes`
- `stops`
- `stop_variants`
- `story_modules`
- `audio_assets`
- `visual_assets`
- `reconstruction_assets`
- `threshold_configs`
- `historical_claims`
- `sources`
- `claim_source_links`
- `editorial_reviews`
- `localizations`
- `pronunciations`
- `access_notes`
- `commerce_products`
- `entitlements`
- `users`
- `progress`
- `downloads`
- `feedback`
- `analytics_events`
- `content_versions`

Exact schema can change, but the separation of concerns should remain.

---

# 4. Historical claim model

Do not bury factual integrity inside a prose blob.

Each important historical claim should be capable of carrying:

- claim text
- entity references
- period / date
- source references
- source quality
- confidence
- controversy status
- interpretation category
- notes
- reviewer
- review date
- allowed narrative wording
- visual implications
- affected assets

Suggested confidence classes:

- `accepted`
- `strongly_supported`
- `probable`
- `debated`
- `hypothesis`
- `legend`
- `dramatic_device`

This enables:
- fact checking
- reconstruction review
- correction propagation
- future Q&A
- citations
- Knowledge Graph development

---

# 5. Knowledge Graph direction

Long-term graph relationships may include:

- person ↔ place
- event ↔ place
- person ↔ event
- era ↔ city
- building ↔ architect
- artwork ↔ museum
- object ↔ excavation
- route ↔ theme
- stop ↔ question
- story ↔ primary source
- city ↔ other city
- concept ↔ multiple eras

Do not overengineer a graph database prematurely.

But design identifiers and relationships so migration into graph-like retrieval is possible.

---

# 6. Route architecture

Do not assume every route is a fixed linear list.

Support:
- linear route
- loop
- optional branches
- optional stops
- multiple valid starting points
- route re-entry
- express route
- neighborhood route
- thematic route
- full-city route

Future adaptive routing should be possible without rewriting the core content model.

A route can be authored as a graph while presented simply to the user.

---

# 7. Progress

Progress should persist robustly where supported.

Track:
- started experiences
- completed stops
- audio position
- route position
- optional skipped stops
- saved moments
- content version
- last interaction
- offline sync state

Do not force checkout again for already entitled content.

Group purchases may unlock the same experience for multiple users/devices, but do not promise perfect synchronized progress unless technically guaranteed.

---

# 8. Offline architecture

The product must tolerate unreliable mobile networks.

Consider:
- service worker
- asset manifest
- route-scoped downloads
- progressive media caching
- resumable download
- cache versioning
- storage quota handling
- content invalidation
- map fallback
- failure recovery
- clear user-visible download state

The initial download may require connectivity.

Once prepared, the walking experience should degrade gracefully.

---

# 9. Media delivery

Use:
- CDN
- responsive images
- modern formats
- adaptive audio where helpful
- signed/public URLs according to entitlement needs
- prefetch near-next assets
- lazy-load noncritical visuals
- cache-control
- checksums/version IDs

Do not make a user download an entire city if they purchased one route unless there is a deliberate UX reason.

---

# 10. Location system

The location layer should support:

- GPS
- user heading
- distance
- geofence-ish stop arrival
- manual override
- degraded GPS
- urban canyon behavior
- clear privacy permissions
- battery-aware polling
- “I am here” correction
- map re-entry

Avoid brittle automation that starts narration merely because GPS drift crosses a radius.

Location should assist, not control the traveler.

---

# 11. Camera / spatial system

Build a capability layer, not a single hard-coded AR feature.

Potential interfaces:

```text
threshold_engine
  ├── image_compare
  ├── aligned_image_reveal
  ├── camera_guided_overlay
  ├── homography_overlay
  ├── depth_aware_composite
  ├── webgl_scene
  └── true_ar_scene
```

Each stop declares which technique it supports.

This enables:
- universal fallback
- progressive enhancement
- flagship spatial experiences
- cheaper content for low-value stops
- graceful device compatibility

---

# 12. Progressive enhancement

No flagship experience should become unusable on unsupported devices.

Example:

1. True AR available → use it.
2. Camera overlay available → use spatial Threshold.
3. Camera unavailable → use aligned cinematic Then/Now.
4. Low bandwidth → use optimized still comparison.
5. Accessibility reduced motion → static controlled compare.

The historical story remains intact across tiers.

---

# 13. Reconstruction asset schema

Each reconstruction asset should include:

- asset ID
- location
- period represented
- date range
- viewpoint
- camera parameters if relevant
- modern reference image
- reconstruction version
- evidence links
- confidence notes
- uncertain elements
- art-direction notes
- reviewer
- approval state
- license/provenance
- device tiers supported

A gorgeous reconstruction without provenance is unfinished.

---

# 14. Audio architecture

Audio objects should support:

- narrator
- language
- locale
- script version
- TTS/voice model provenance if applicable internally
- pronunciation dictionary version
- mastering version
- duration
- transcript
- chapters/cues
- spatial or sound-design layers
- loudness metadata
- offline state
- QA state

Keep production metadata internal if it would detract from the consumer experience.

---

# 15. Localization

Do not hard-code English copy throughout components.

Architecture should support:
- UI localization
- city-content localization
- localized audio
- localized pronunciation
- culture-specific wording
- different text/audio lengths
- fallback language
- per-locale QA

Translation quality must be evaluated as product quality, not merely language correctness.

---

# 16. Commerce

Keep commerce separate from city content.

Concepts:
- products
- price plans
- bundles
- entitlements
- free previews
- multi-user access
- refunds/revocations
- purchase restoration

A route is content.

A product is a commercial package granting access to content.

Do not conflate them.

---

# 17. Analytics

Track useful product signals, not vanity telemetry.

Examples:
- discovery → purchase funnel
- download success
- tour started
- stop started/completed
- stop skipped
- audio completion
- Threshold opened/completed/repeated
- spatial alignment failure
- navigation correction
- route abandonment
- resumed later
- completion
- share
- next-city interest
- question asked
- offline failure
- content issue reported

Privacy and battery usage matter.

---

# 18. Historical Presence measurement

Support future measurement of:
- “the place came alive”
- “I could imagine how it was”
- “I see this place differently now”
- “I would recommend ChronoWalk because of that feeling”

Combine qualitative feedback with behavior.

Do not reduce presence to a simplistic engagement score.

---

# 19. Internal tooling

The internal platform should eventually allow a founder/editor to:

- create city
- create route
- create stop
- attach coordinates
- upload modern visual
- create/view research dossier
- review claims
- draft story
- review script
- generate/manage audio
- generate/manage reconstructions
- configure Threshold type
- preview mobile experience
- manage localizations
- run QA
- publish
- roll back
- update
- inspect user feedback

This becomes **ChronoWalk Foundry**.

---

# 20. Security, privacy, reliability

Minimum expectations:
- no secrets in client code
- robust entitlement validation
- secure webhook handling
- least-privilege storage
- input validation
- rate limits for costly AI endpoints
- user-data minimization
- location privacy clarity
- no silent collection of unnecessary precise movement history
- error monitoring
- versioned migrations
- backups
- content rollback
- graceful failures

---

# 21. PWA vs native

Do not assume native is automatically superior.

Use the least complex platform that provides the required experience.

A PWA/web-first approach is valid where it supports:
- discovery
- zero-install access
- payments
- audio
- offline
- maps
- camera
- acceptable performance

Native or app-store packaging should be introduced when it provides a clear product, distribution, reliability, or platform advantage.

---

# 22. Technical decision rule

For every major architecture choice, document:

- user problem
- proposed approach
- alternative considered
- quality impact
- scale impact
- city-production impact
- operating cost
- risk
- fallback
- reason selected

Avoid complexity without demonstrated product value.


---

# FILE: 04_CONTENT_AUDIO_VISUAL_PRODUCTION_SYSTEM.md

# CHRONOWALK — CONTENT, AUDIO & VISUAL PRODUCTION SYSTEM

# 1. Core rule

AI may be part of the production infrastructure.

**AI must never become the aesthetic.**

The traveler should not experience:
- AI fluff
- robotic narration
- hallucinated history
- repetitive structure
- generic ancient-city imagery
- uncanny faces
- synthetic “epic” travel language
- obvious prompt artifacts

The consumer should have no reason to think:
**“This was cheaply generated.”**

---

# 2. Production pipeline

Never use:

**Wikipedia → LLM → TTS → publish**

Required high-level pipeline:

**Research → Evidence → Claims → Story architecture → Script → Historical audit → Spoken-language edit → Audio production → Visual/reconstruction production → Integrated QA → Beta → Publish**

The system should automate repetitive work between gates while preserving editorial judgment.

---

# 3. Evidence dossier

Every stop should have a structured evidence dossier before final narration.

Suggested sections:

## Place basics
- names / variants
- coordinates
- what survives today
- relevant historical periods
- physical orientation

## Historical timeline
Only events relevant enough to the stop.

## Key claims
For each:
- statement
- sources
- confidence
- disagreement
- narrative usefulness

## People
- role
- motives where evidenced
- relationship to place
- primary/secondary source context

## Physical reconstruction evidence
- archaeology
- plans
- excavations
- surviving fabric
- historical drawings
- comparative structures
- scholarly reconstructions
- uncertainties

## Traveler reality
- where user can stand
- sightlines
- crowds
- ticket restrictions
- closures
- best viewpoint
- sound environment
- accessibility

## Story opportunities
- central tension
- human hook
- surprising detail
- visible evidence
- potential Threshold
- possible sound archaeology

---

# 4. Historical-source hierarchy

Prefer, depending on the claim:

1. peer-reviewed scholarship / academic books
2. archaeological reports / official heritage authorities
3. museum / archive / university sources
4. reliable specialist scholarship
5. high-quality institutional interpretation
6. reputable general history
7. secondary web sources for orientation only
8. Wikipedia as discovery / starting point, never sole authority for significant claims
9. user forums only for traveler logistics or lived experience, never historical authority

For disputed history, preserve disagreement.

---

# 5. Claim ledger

Important claims should be machine-trackable.

Never allow an elegant sentence to outrank evidence.

When a source correction changes a claim, the system should identify:
- scripts affected
- reconstructions affected
- captions affected
- Q&A answers affected
- translations affected

This is one reason structured claims matter.

---

# 6. Writing standard

The narration should feel like a brilliant human companion.

Reference qualities:
- Mary Beard: intellectual rigor and willingness to expose uncertainty
- Anthony Bourdain: human specificity, texture, lack of reverence for empty cliché
- Rick Steves: traveler companionship, practical warmth, physical orientation

Do not imitate any living or deceased author’s exact prose style. Preserve the useful qualities above.

---

# 7. Forbidden writing habits

Never default to:

- “Welcome to…”
- “Imagine stepping back in time…”
- “Picture this…”
- “Nestled in…”
- “This magnificent…”
- “A testament to…”
- “rich tapestry”
- “vibrant history”
- “stands as a reminder”
- “echoes of the past”
- “where history comes alive” as empty marketing language

Also avoid:
- adjective chains
- inflated importance
- false certainty
- artificial cliffhangers
- constant rhetorical questions
- identical hooks at every stop
- generic dramatic pauses
- encyclopedic biography
- chronology dumps

---

# 8. Humanization rule

Historical figures should appear as people with:
- incentives
- fears
- constraints
- rivalries
- ambitions
- mistakes
- consequences

Do not turn people into Wikipedia metadata.

---

# 9. Place-specific rule

The narration must repeatedly exploit the fact that the user is physically there.

Every 30–60 seconds, where natural, reconnect to:
- what they can see
- where they are standing
- scale
- direction
- sound
- distance
- surviving evidence
- relationship between present and past

If the narration could be listened to equally well from a couch, it is not using ChronoWalk’s advantage enough.

---

# 10. Spoken-language edit

A good article is not automatically good narration.

Final audio copy should:
- use shorter clauses
- avoid nested parentheticals
- reduce proper-noun overload
- repeat orientation when necessary
- contain breath points
- allow silence
- sound natural aloud
- avoid tongue-twisting sequences
- control number/date density
- use pronunciation notes

Always perform a spoken-language pass after factual approval.

---

# 11. Audio generation / voice direction

Use the highest-quality available voice system that can meet the standard.

The target is not “good TTS.”

The target is:
**credible human narration where the synthetic production method is not salient.**

Voice criteria:
- warmth
- microvariation
- believable breath/pacing
- emotional restraint
- natural emphasis
- good proper-noun pronunciation
- no recurring synthetic cadence
- no overacting
- no “documentary trailer” tone

Allow multiple voices by language or city when editorially justified, but maintain brand-level quality consistency.

---

# 12. Pronunciation system

Maintain a pronunciation dictionary for:
- Latin
- Italian
- French
- names
- places
- archaeological terms
- local-language words

Pronunciation must be reviewed.

Do not let a premium experience fail because a famous name is obviously mispronounced.

---

# 13. Audio mastering

Standardize:
- loudness
- noise floor
- EQ
- compression
- peak handling
- transitions
- stereo/mono considerations
- intelligibility in streets
- headphone performance

Sound design must sit behind narration.

Test on ordinary consumer earbuds outdoors, not only studio headphones.

---

# 14. Soundscape production

Use as narrative evidence, not decoration.

A sound layer should answer a question such as:
- How crowded was this space?
- How enclosed did it feel?
- What activity dominated?
- What did water change?
- What ritual rhythm existed?
- How different was the acoustic environment?

Where evidence is uncertain, avoid falsely precise sound claims.

---

# 15. Modern visual generation / acquisition

Modern imagery should look like credible premium travel photography, not AI stock art.

Requirements:
- plausible camera/lens behavior
- realistic people
- varied body language
- real street imperfections
- natural texture
- correct monument geometry
- correct urban context
- non-template composition
- believable lighting
- no repeated backpack traveler trope
- no fake signage / garbled text

For alignment-based Thresholds, visual accuracy outranks “pretty.”

Real photography should be preferred where practical and licensing permits.

---

# 16. Historical reconstruction art direction

Historical reconstructions must be:

- evidence-led
- period-specific
- geographically correct
- architecturally credible
- visually aligned to the intended viewpoint
- explicit about uncertainty
- free of generic “ancient world” clichés

Avoid:
- random togas
- fantasy gold everywhere
- oversaturated sunsets
- cinematic smoke without reason
- impossible pristine marble
- generic Roman crowds
- costume inaccuracies
- architectural elements invented for drama
- mixing periods

---

# 17. Reconstruction production levels

## Level 1 — Evidence-aligned still
High-quality matching reconstruction.

## Level 2 — Layered cinematic scene
Depth layers, subtle motion, sound.

## Level 3 — Camera-assisted overlay
Perspective matched to live camera.

## Level 4 — Spatial / lightweight 3D
Limited viewpoint movement.

## Level 5 — Full flagship AR
True 3D anchoring and interaction where justified.

Do not assign the same production level to every stop.

Spend the highest cost where it creates the highest historical-presence return.

---

# 18. Camera-assisted reveal concept

A target flagship interaction:

**User raises camera → aligns with monument → “Hold to restore Rome.” → press-and-hold reveals reconstructed architecture over the present scene.**

The overlay may include:
- restored missing walls
- rooflines
- statuary
- color
- crowd density
- circulation
- fire/water/fabric where appropriate
- subtle ambience

The objective is not technical purity.

The objective is:
**the user immediately understands how the lost environment occupied the exact space in front of them.**

Again:

**It does not need to be geometrically perfect full AR to feel magical.**

Do not overbuild when 2.5D/computer-vision alignment produces 80–90% of the emotional effect at dramatically lower production cost.

---

# 19. Historical reconstruction QA

Before approval, validate:
- period
- viewpoint
- proportions
- known surviving geometry
- materials
- decoration
- clothing
- landscape
- street level
- neighboring structures
- iconography
- weather/lighting assumptions where relevant
- uncertainty
- visual artifacts
- modern/historical alignment

A reconstruction is not approved merely because it is beautiful.

---

# 20. Visual provenance

Store:
- source images
- reference drawings
- archaeological plans
- generation/edit history
- model/tool used internally
- prompts where useful
- manual edits
- license information
- reviewer
- approval date

Prompts and workflows are company intellectual property.

---

# 21. AI quality control

AI may:
- summarize sources
- compare accounts
- surface contradictions
- draft scripts
- propose hooks
- create first-pass metadata
- generate candidate visuals
- generate candidate audio
- perform style checks
- detect repetition
- flag claims for review

AI may not be the final authority for:
- sensitive historical claims
- interpretation hierarchy
- final narrative selection
- final reconstruction approval
- emotional arc
- publication quality

---

# 22. Anti-slop tests

Reject a stop if:

- its script could be swapped into another landmark with minor noun changes
- its narration sounds generated
- it relies on generic adjectives
- the reconstruction is attractive but not evidence-traceable
- the audio cadence repeats identically across stops
- the story contains no perceptual transformation
- the “wow” comes from effects rather than meaning
- the stop exists only because it is famous
- the user learns facts but sees the same place afterward

---

# 23. Final content bar

The target reaction is not:

“Very informative.”

It is:

**“I would never have understood that without this.”**


---

# FILE: 05_CHRONOWALK_FOUNDRY_CITY_FACTORY_AND_QA.md

# CHRONOWALK — FOUNDRY, CITY FACTORY & QA SYSTEM

# 1. Strategic objective

The company should not scale by manually recreating every city.

It should build the best repeatable system for transforming a city’s history into an immersive walking experience.

The hidden asset is the production system.

Call the internal system:

# ChronoWalk Foundry

Foundry is the operational layer through which cities are researched, authored, produced, reviewed, localized, published, and improved.

---

# 2. Foundry workflow

Recommended status model:

1. Backlog
2. Prioritized
3. City research
4. Candidate stop universe
5. Route architecture
6. Stop research dossiers
7. Claim review
8. Story architecture
9. Script
10. Historical QA
11. Audio production
12. Visual/reconstruction production
13. Technical integration
14. Integrated QA
15. Beta
16. Approved
17. Published
18. Continuous optimization

The exact labels may change, but every city and stop must have visible state.

No important work should live only in the founder’s memory.

---

# 3. City creation workflow

A useful future internal interaction:

`Create City → Florence`

Foundry helps create a candidate universe of places.

Each candidate is scored on dimensions such as:

- historical importance
- visual transformation potential
- story potential
- geographic fit
- walkability
- traveler demand
- ticket dependency
- opening-hour fragility
- crowd conditions
- hidden-gem value
- Threshold potential
- sound potential
- route coherence
- production cost
- competitive differentiation

The founder/editor then chooses the authored experience.

AI proposes.

Editorial judgment decides.

---

# 4. Stop selection principle

Famous does not equal necessary.

Each stop must justify its existence by doing at least one of:

- revealing something invisible
- transforming perception
- advancing the route’s narrative
- introducing a key character
- creating contrast
- creating rest
- solving orientation
- producing a powerful historical-presence moment
- connecting eras
- explaining the city’s logic

Prefer fewer stronger stops to bloated coverage.

---

# 5. Route architecture before script

Do not start writing stop scripts before the experience architecture exists.

Design:
- starting options
- sequence
- distance
- pacing
- peaks
- rests
- practical interruptions
- optional branches
- ticketed/non-ticketed dependencies
- day/night differences
- narrative progression
- first-minute promise
- climax
- ending

Then write.

---

# 6. City-independence test

Before adding city #2, run this test:

**Can Florence be created without adding Florence-specific logic to core app components?**

If no, architecture is not finished.

Allowed city-specific data:
- assets
- coordinates
- text
- story
- audio
- route graph
- historical metadata
- local practical rules

Not acceptable:
- duplicated UI
- copied page components
- bespoke checkout logic
- hard-coded city branches throughout the app

---

# 7. Three-stop vertical slice gate

Before building full Rome, complete:

- Pantheon
- Roman Forum
- Colosseum

or another explicitly approved trio with equivalent technical diversity.

Acceptance:
- premium visual quality
- human narration
- evidence-backed history
- real mobile performance
- outdoor usability
- offline/degraded-network behavior
- orientation
- at least one convincing Threshold
- analytics
- progress
- restart/resume
- accessibility baseline

Only after this works should the architecture be generalized further.

---

# 8. Second-city test

The second city validates the **system**.

Success means:
- less time to produce
- less engineering
- less manual repetition
- equal or better quality
- fewer errors
- reusable pipelines
- reusable prompts
- reusable QA
- city-agnostic UI
- reliable localization

The second city is more strategically important than simply adding more Rome stops.

---

# 9. Ten-city scaling sequence

Do not mass-generate ten cities simultaneously.

Suggested operational sequence:

### Phase A
Three-stop Rome vertical slice.

### Phase B
Production-ready Rome city experience.

### Phase C
One second city — preferably structurally different enough to stress the system.

### Phase D
Refactor Foundry based on real friction.

### Phase E
Wave expansion.

Target set may include:
- Florence
- Venice
- Paris
- London
- Barcelona
- Amsterdam
- Prague
- Lisbon
- New York

Only accelerate once the quality system holds.

---

# 10. Historical QA gate

Every published stop must have:

- claim dossier
- sources
- confidence classifications
- reviewed script
- disputed claims handled honestly
- reconstruction review
- pronunciation review
- translations reviewed
- known uncertainty recorded

No “probably fine.”

---

# 11. Technical QA gate

Test:
- links
- media loading
- audio sync
- progress
- GPS
- navigation
- downloads
- offline behavior
- cache invalidation
- multiple devices
- common mobile browsers
- screen sizes
- low-power conditions
- interruptions
- resume
- accessibility
- payment entitlement
- refund/revocation
- analytics
- error recovery

---

# 12. Experience QA gate

Ask testers:

- Did you know where to stand?
- Did you know where to look?
- Did the first minutes justify the product?
- Did any section feel boring?
- Did any narration sound synthetic?
- Did you ever feel trapped by the route?
- Did you look at the phone too much?
- Did the Threshold help you understand the site?
- Did anything feel historically fake?
- Was any reconstruction confusing?
- Which moment would you tell a friend about?
- Did you see the place differently afterward?

The final question matters more than “Was the app easy to use?”

---

# 13. Historical Presence Score

Treat this as an editorial North Star, not a vanity metric.

Signals may include:

- “the place came alive”
- “I could picture how it was”
- “I see this differently now”
- “I understood what I was looking at”
- “I would recommend it for that feeling”
- replay of reveal moments
- completion
- sharing
- memorable-moment recall

Do not optimize toward addictive engagement.

---

# 14. The 80% / expansion gate concept

Do not authorize aggressive expansion until the current city demonstrates:

- strong reviews
- low critical incident rate
- stable content
- acceptable economics
- repeatable production
- quality consistency

A city that weakens trust damages the platform.

---

# 15. Continuous optimization

A city is never permanently “done.”

Monitor:
- urban changes
- closures
- construction
- access rules
- new archaeological findings
- corrected scholarship
- reviews
- confusion points
- abandoned stops
- GPS failures
- outdated images
- audio complaints
- localization issues

Changes should feed back into:
- research
- prompts
- checklists
- architecture
- future city production

---

# 16. Prompt library as IP

Maintain versioned reusable prompts for:

- city research
- traveler research
- stop discovery
- source comparison
- claim extraction
- contradiction detection
- story architecture
- script drafting
- spoken-language editing
- style QA
- reconstruction briefs
- visual generation
- audio direction
- pronunciation
- localization
- SEO
- OTA content
- technical QA
- historical QA

Never let critical production logic disappear inside isolated AI chats.

---

# 17. Automation principle

Before adding manual work:

1. Can the task be eliminated?
2. Can it be simplified?
3. Can it be automated?
4. Only then: should a human repeatedly do it?

But do not automate editorial judgment merely because it is expensive.

The purpose of automation is to move human attention toward the things that create differentiated quality.

---

# 18. Foundry dashboard

A useful internal dashboard should eventually show:

- city status
- route status
- stop status
- blocked items
- unresolved claims
- missing sources
- unapproved reconstructions
- audio QA status
- localization status
- technical QA status
- beta feedback
- publication readiness
- production cost/time
- revision history

A founder should be able to answer in under a minute:
- What ships next?
- What is blocked?
- Why?
- What is the quality risk?
- What requires human judgment?

---

# 19. Asset/version control

Never overwrite important approved content without history.

Version:
- scripts
- claims
- audio
- reconstructions
- route graphs
- UI content
- translations
- Threshold configs

Enable rollback.

---

# 20. Quality over throughput

The metric is not:
**cities generated per week.**

The metric is:
**extraordinary cities produced with declining marginal effort and no loss of trust.**


---

# FILE: 06_AGENT_WORKING_PROTOCOL_AND_BUILD_GATES.md

# CHRONOWALK — REPLIT AGENT WORKING PROTOCOL & BUILD GATES

# 1. Role

Act as a senior multidisciplinary product-and-engineering team.

Do not behave like a code-completion assistant waiting for exact UI instructions.

At the same time, do not silently substitute your taste for founder intent.

Your job is to:
- understand the product philosophy
- challenge weak legacy assumptions
- propose superior solutions
- distinguish evidence from speculation
- build incrementally
- preserve quality
- document decisions
- stop at gates

---

# 2. Before coding

First produce analysis documents.

Required outputs before implementation:

- `PRODUCT_THESIS.md`
- `INVARIANTS_AND_REPLACEABLE_ASSUMPTIONS.md`
- `CURRENT_PRODUCT_CRITIQUE.md`
- `PRODUCT_ARCHITECTURE.md`
- `CONTENT_PIPELINE.md`
- `HISTORICAL_INTEGRITY_SYSTEM.md`
- `VISUAL_RECONSTRUCTION_OPTIONS.md`
- `AUDIO_PRODUCTION_SYSTEM.md`
- `CITY_SCALING_ARCHITECTURE.md`
- `TECHNICAL_RISKS.md`
- `CHRONOWALK_2_PRODUCT_PROPOSAL.md`

Then stop for approval.

---

# 3. Required conceptual separation

For every feature proposal, label it as:

- **POSSIBLE NOW / LOW RISK**
- **POSSIBLE NOW / NEEDS PROTOTYPING**
- **TECHNICALLY POSSIBLE BUT EXPENSIVE**
- **DEPENDENT ON DEVICE / PLATFORM**
- **SPECULATIVE**
- **NOT RECOMMENDED**

Never turn speculative technology into a promise.

---

# 4. Assumption register

Maintain:

`ASSUMPTIONS.md`

For every significant assumption:
- assumption
- why it matters
- evidence
- confidence
- validation method
- status

Do not hide uncertainty.

---

# 5. Decision log

Maintain:

`DECISIONS.md`

For each important decision:
- date
- question
- options
- chosen option
- why
- tradeoffs
- reversibility
- related files/features

This prevents future agents from losing context.

---

# 6. Product debt log

Maintain:

`PRODUCT_DEBT.md`

Track:
- knowingly deferred quality
- temporary fallbacks
- prototype shortcuts
- unverified assumptions
- missing accessibility
- historical review gaps
- known media artifacts
- unsupported devices

Prototype debt must be visible.

---

# 7. Gate 0 — Understanding

Do not code.

Read Founder Playbook and Founder Pack.

Return:
- your understanding of ChronoWalk
- what must never change
- what may be reinvented
- what existing assumptions you challenge
- what “historical presence” means operationally

Stop.

---

# 8. Gate 1 — Product concepts

Propose three levels:

## Conservative / highly achievable
A premium, scalable implementation with low technical fragility.

## Ambitious
Meaningfully more spatial, adaptive, cinematic.

## “Feels impossible until you see it”
A frontier concept using camera/computer vision/spatial interaction where technically credible.

For each:
- user experience
- technical approach
- quality upside
- scalability
- production cost
- risk
- fallback
- what must be validated

Stop.

---

# 9. Gate 2 — Threshold experiment

Prototype the most important differentiated interaction before building large amounts of surrounding UI.

Test at least:
- aligned cinematic Then/Now
- camera-assisted spatial reveal
- if justified, lightweight 3D/AR

The critical camera concept to test is:

**Align scene → “Hold to restore Rome.” → reveal the reconstructed historical environment over the present view.**

Remember:

**It does not have to be geometrically perfect AR to feel magical.**

A convincing premium illusion using robust alignment can be a better product than fragile true AR.

Document:
- implementation
- supported devices
- failure cases
- performance
- content production burden
- historical alignment requirements
- user magic / presence
- fallback

Stop.

---

# 10. Gate 3 — Three-stop vertical slice

Build only the approved three-stop Rome slice.

This is:
**a prototype in breadth, not in quality.**

Everything included must feel product-ready.

Do not use:
- placeholder narration
- generic AI images
- lorem ipsum
- stock template cards
- fake testimonials
- fake analytics
- unverified history

Stop after:
- functional build
- QA report
- mobile screenshots
- architecture review
- unresolved issues
- production-cost estimate

---

# 11. Gate 4 — External-quality test

Before scaling:
- real-device test
- outdoor test
- weak-network/offline test
- audio test on normal earbuds
- historical review
- non-technical-user test
- perception test: “Did the place change for you?”

Do not scale because the code works.

Scale because the experience works.

---

# 12. Gate 5 — Generalize the engine

Only after the vertical slice:

Generalize:
- city schema
- route schema
- stop schema
- content loading
- media system
- progress
- localization
- Threshold engine
- offline
- commerce
- analytics

No Rome-specific assumptions may remain in the core.

Stop.

---

# 13. Gate 6 — Foundry

Build internal tooling for content operations.

Minimum useful Foundry:
- create city
- create route
- create stop
- evidence dossier
- claims
- script
- audio asset
- visual asset
- reconstruction review
- Threshold config
- localization
- preview
- QA status
- publish

Stop.

---

# 14. Gate 7 — Complete Rome

Use the production system to build Rome.

Do not manually bypass Foundry for speed if doing so would invalidate the repeatability test.

Rome should prove:
- consumer quality
- content quality
- production pipeline
- QA
- operations

Stop.

---

# 15. Gate 8 — Second city

Build a second city through the same system.

Measure:
- engineering changes required
- time per stop
- cost per stop
- QA burden
- content reuse
- tool friction
- localization friction
- quality difference

If city #2 requires major bespoke app work, refactor.

Stop.

---

# 16. Gate 9 — Expansion wave

Only now prepare multi-city expansion.

Do not press one button and generate 200 stops.

Use Foundry and quality gates.

---

# 17. Design-review behavior

When multiple visual directions are plausible:
- create controlled alternatives
- explain what each optimizes
- compare against product principles
- do not change unrelated approved details
- do not drift brand identity during local fixes

Avoid “fix one thing, accidentally redesign everything.”

---

# 18. Change-isolation rule

When instructed to alter one specific detail:

**Preserve all unrelated approved structure, content, ordering, behavior, and visual decisions unless the change technically requires otherwise.**

If a requested change has side effects, state them before applying.

---

# 19. No accidental legacy copying

When using existing product screens:

> These are reference artifacts, NOT implementation requirements.
>
> Identify what is excellent and preserve its underlying principle.  
> Identify what is mediocre and replace it.  
> Do not reproduce weaknesses merely for visual consistency.

Do not pixel-copy legacy UI unless explicitly instructed.

---

# 20. No AI aesthetic

Do not optimize for how much can be generated automatically.

Optimize for how much can be generated automatically **without the user perceiving automation as quality loss**.

If generated output looks synthetic:
- regenerate
- change method
- manually edit
- use real source material
- reduce automation

Never publish “good enough because AI did it quickly.”

---

# 21. Historical-integrity behavior

If evidence is weak:
- do not invent
- do not smooth over disagreement
- downgrade certainty
- ask for review
- exclude the claim if necessary

If a reconstruction requires unsupported detail, prefer:
- ambiguity
- partial reconstruction
- atmospheric absence
- transparent uncertainty

over confident fantasy.

---

# 22. Technical sophistication rule

Do not equate sophistication with complexity.

A robust system that feels magical is more sophisticated than fragile technical theater.

Use progressive enhancement.

Always provide a lower-tech fallback when possible.

---

# 23. Performance budget mindset

Every immersive feature must be evaluated for:
- load time
- memory
- battery
- heat
- camera usage
- network
- asset size
- responsiveness

Travelers have finite batteries and expensive days.

A feature that drains the phone undermines the experience.

---

# 24. Reporting format after each gate

Return:

## What was completed
## What changed
## What was intentionally not changed
## Evidence / tests
## Known limitations
## Historical/content uncertainties
## Product risks
## Technical risks
## Decisions requiring founder approval
## Recommended next gate
## Files changed

Do not bury risks inside prose.

---

# 25. Definition of “done”

A feature is not done because:
- it compiles
- it renders
- it looks good on desktop
- the agent says “implemented”
- a generated asset exists

It is done when it has:
- correct product behavior
- mobile quality
- real-device plausibility
- error states
- accessibility consideration
- performance consideration
- offline/degraded behavior where relevant
- content integrity
- tests appropriate to risk
- no known critical regression

---

# 26. North Star reminder

The final test for every major decision is:

**Does this help a traveler physically standing in the city feel that the invisible past has returned to the space around them — without sacrificing freedom, trust, or the city itself?**

If not, reconsider it.
