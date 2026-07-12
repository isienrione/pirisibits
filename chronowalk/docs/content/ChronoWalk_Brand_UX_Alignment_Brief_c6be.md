# ChronoWalk — Brand + UX Alignment Brief
### For Figma Make · Version B ("Nat Geo + A24"), 30-screen prototype

**How to use this:** paste section by section, in order. Section 1 (Foundation) changes the tokens everything else depends on — do that first, let it propagate, then move to Components, then Screens. Don't paste the whole document in one shot; Figma Make handles staged instructions better than a single giant one.

---

## 1. Foundation — global tokens

### 1.1 Typography

Replace all current typefaces (Fraunces, DM Sans, or whatever mixed set is currently live) with:

| Role | Typeface | Weight | Notes |
|---|---|---|---|
| Display (hero headlines, "Where will history take you today?") | Playfair Display | 500 | Italic for the emotional word only — never the full line |
| Title (screen titles, "The Colosseum") | Playfair Display | 500 | Italic when it's a proper noun being revealed ("The *Glory* of the Pantheon") |
| Body (narration, descriptions) | Inter | 400 | Line height 1.6–1.7, never below 14px |
| Label / caption / UI chrome | Inter | 500 | Uppercase, letter-spacing 0.06em, 11–12px only |

Type scale: Display 32–40px / Title 22–26px / Body 15–16px / Caption 11–12px. Large typography is encouraged per brand doc — don't shrink headlines to fit; shrink the container instead.

### 1.2 Color

Replace the current palette entirely (delete Sand `#F2E5C6`, Char `#1A1410`, Teal `#4E8A82`, Olive `#8A8450`, Terra `#BA5038`, Gold `#C89430` — these are off-brand, do not blend them with the set below):

| Token | Hex | Primary use |
|---|---|---|
| Stone | `#F2EFE9` | Explorer-mode background, light surfaces |
| Ink | `#101820` | Dark surfaces, text-on-light |
| Teal | `#2CA6A4` | Primary accent — active states, compass, links, active tab |
| Moss | `#6BA57A` | Secondary accent — used sparingly, route/status |
| Terracotta | `#E06A3B` | Primary CTA fill, Rome's city accent |
| Gold | `#D4A86A` | Companion/Story accent, Living Beacon, thresholds, arrival moments |

Rule: no more than 2 accent colors visible on a single screen besides Stone/Ink. If a screen currently uses 4+ accent colors (several of the Companion-mode screens do), consolidate.

### 1.3 Spacing, radius, materials

- Outdoor/walking screens: minimum 24pt edge margins (per HIG spec) — nothing sits closer to the screen edge than that during Companion mode.
- Corner radius: 16px for photo cards and sheets, 10px for buttons and chips, full pill (999px) for tags/badges only.
- White space is generous by default — if a screen feels "full," the fix is fewer elements, not smaller margins.
- No glass, no gradients, no glossy surfaces. Matte, flat, photograph-led.

### 1.4 Iconography

Thin-line/outline style throughout, single consistent stroke weight (~1.5px). No filled icons, no emoji, no mixed icon families — audit the current file, it currently mixes at least two icon sets across the Explorer and Companion screens.

### 1.5 Photography

- Full-bleed, natural light, real depth of field — no stock-photo flatness.
- Explorer mode: golden hour or daylight bias. Companion/Story mode: can go dusk/night (this is where the moody Nat Geo + A24 treatment belongs — it belongs to *Story*, not to every screen).
- Photography sets the layout, never the reverse — don't crop a photo to fit a pre-built card shape; build the card around what the photo needs.

### 1.6 Motion (per mode — currently under-specified in the build)

| Mode | Motion character |
|---|---|
| Explorer | Slow, cinematic cross-dissolves between screens. Nothing snaps. |
| Companion / Journey (walking) | Near-static. Position updates and compass bearing shifts only — no screen transitions competing for attention while someone is mid-street. |
| Story | Immersive — parallax on hero images, gentle scroll-linked reveals. |
| Reconstruction (Threshold) | The drag interaction itself should feel handcrafted, not mechanical: as the handle crosses center, add a brief desaturation-to-color crossfade on the "now" side and a soft haptic tick (if the platform supports it) at the crossing point. This is what makes a slider "magical" instead of a generic before/after — the mechanism can stay, but the feeling around it needs texture your current build doesn't have.

---

## 2. The mode system — the structural fix everything else depends on

Every screen in the file needs an explicit mode tag, and that tag determines its entire visual temperature. Right now roughly two-thirds of the Explorer-mode screens are wearing Companion/Story's dark treatment, which is the single biggest thing flattening the identity into one mood. Assign every screen to exactly one of these:

| Mode | Feel | Background | Applies to |
|---|---|---|---|
| **Explorer** | Bright, warm, editorial, Airbnb/Apple TV | Stone | Explore Home, City—Rome, Tour Detail, Preparation, Onboarding, Permissions, Subscription, Onboarding Philosophy, First City Picker, Editorial Collection, Search |
| **Companion** | Minimal, calm, nearly invisible | Ink, very little UI | Walking Compass, Approaching, Off-Route, Observation State, Pause + Resume, GPS Lost—Recovery, Phone Locked |
| **Story / Immersion** | Dark, rich, cinematic | Ink, full-bleed photography, gold accents | Arrival, Story Screen, Reconstruction, Audio Player, Journey Complete |

Live Map, Reorder Stops Sheet: treat as Companion-adjacent utility — Ink background, but slightly more UI density is acceptable since these are functional, not ambient, moments.

If any of the ~6 screens beyond this sidebar list (the file says 30 screens, roughly 24 are visible in the current navigation) aren't covered above, classify them into one of these three modes using the same logic before styling them — don't leave any screen unassigned.

---

## 3. Component-level corrections

Your own Architecture doc names 14 reusable components. Fix at the component level, not the screen level, so the fix propagates everywhere the component is used:

- **Editorial Hero** — currently inconsistent crop ratios across screens. Standardize to full-bleed, minimum 60% of viewport height on Explorer, with a single gradient-free scrim (solid Ink at low opacity, not a gradient) for text legibility.
- **Living Beacon / Living Compass** — this is the one component that's already correctly built (Companion Mode screen). Use it as the reference for how minimal the rest of the file should feel.
- **Threshold** — see 1.6 above. Drag mechanism stays, texture and feedback need work.
- **Immersive Audio Player** — currently reads as a podcast-app player (waveform scrubber, round transport controls, tabbed Chapters/Transcript/Extras). Simplify: remove the waveform, reduce transport to a single play/pause plus a thin progress line, move Chapters/Transcript/Extras behind a single "more" affordance rather than a persistent tab row. This screen should feel like an accessory to the walk, not the main event.
- **Journey Card / Waypoint Card** — currently at least one instance ("Also Available" list on Begin Journey) is a plain text list row with no photography. Every instance of this component must carry an image — no exceptions, per "photography defines layouts."
- **Quote Block** — already well executed on Journey Complete (Journey Letter). Reuse this exact treatment anywhere else narration is pulled out as a pull-quote.
- **Photo Gallery** — the 3-image collage on Journey Complete is a hard-edged template collage. Rebuild as one full-bleed hero image with a secondary strip of 2–3 smaller images below it, not an overlapping stack.
- **Confidence Chip / Route Chip** — audit for consistent pill radius and single-accent coloring (currently some chips use 2 colors in one pill, which competes with the "one emotional purpose per screen" rule).
- **Bottom Sheet** — confirm consistent Ink/Stone treatment matching the mode of the screen it appears over, not a fixed color regardless of context.

---

## 4. Screen-by-screen pass

### Explorer Mode (11 screens)
Apply Stone background, Playfair Display headline treatment, Teal/Terracotta accents. Specific notes:

- **01 Explore Home** — currently the night-Colosseum "Version B" mood shot. Rebuild bright: daylight or golden-hour hero, Stone background beneath the fold, terracotta CTA. Keep the search bar, "Continue in Rome" progress card, and city-picker row structure as-is — only the color/type/light-direction changes.
- **02 City—Rome, 03 Tour Detail, 04 Preparation** — same correction. Preparation specifically should read as "reduce friction" per your Screen Philosophy doc — audit for any step that isn't strictly necessary before a walk starts.
- **13 Onboarding, 14 Permissions, 24 Subscription, 25 Onboarding Philosophy, 26 First City Picker, 27 Editorial Collection, 28 Search** — bring to Stone/bright treatment. These are currently the least-seen screens in review, so give them an explicit before/after screenshot when done — easy to miss a straggler here.

### Companion Mode (13 screens)
Keep Ink background, minimize chrome further where possible.

- **05 Walking Compass** — already close to correct. Confirm typeface swap only.
- **06 Approaching, 07 Arrival · Pantheon** — Arrival should be the quietest screen in the whole app ("everything slows, one sentence" per your Signature Moments doc). Check nothing besides the arrival sentence and the beacon animation is competing for attention.
- **08 Audio Player** — see component note above.
- **09 Reconstruction** — see Threshold note above.
- **10 Live Map, 11 Off-Route, 21 Observation State, 22 Pause + Resume, 23 GPS Lost—Recovery, 30 Phone Locked** — these are edge-case/utility states. Confirm they don't introduce new UI patterns not already in the component library — reuse existing chips, sheets, and typography rather than inventing new treatments for error states.
- **12 Journey Complete** — see Photo Gallery and Quote Block notes above. Also: replace the 3-column stat block (stories/km/hours) with those numbers woven into the Journey Letter's typography rather than a separate dashboard row — completion is emotional, not statistical, per your own doc.
- **29 Reorder Stops Sheet** — functional screen, keep dense, but correct type/color tokens.

---

## 5. Flows (8 journeys) — cross-screen consistency

The transition from Explorer into Companion mode (tapping "Start Walk") is currently a hard cut in most flows. Since Explorer is bright and Companion is dark, that transition is the biggest single mode-shift in the product — it deserves its own signature moment, not a default screen swap. Suggest: a brief dissolve through black (0.4–0.6s) as the app "steps back" and hands control to the city, consistent with the "technology disappears" principle. Apply this same transition treatment everywhere a flow crosses from Explorer into Companion or Story mode.

---

## 6. QA checklist — run this on every corrected screen

Before calling a screen done, per your own Creative Direction brief:

- Does this increase curiosity?
- Does this increase confidence?
- Could less interface create a better experience?
- Does photography dominate?
- Could this belong to another travel app?
- Would someone recognize this as ChronoWalk without the logo?
- Will the traveler remember the city more vividly because of this screen?

If any answer is no, it's not done yet.

---

## 7. Preserve — do not change

- Existing screen layouts, information hierarchy, and content structure
- CTA placement and copy
- Compass/beacon iconography already in use
- The drag-to-compare Reconstruction mechanism (texture it, don't replace it)
- The Companion Mode walking screen (already close to correct — use as reference)
