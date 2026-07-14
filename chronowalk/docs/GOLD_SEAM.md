# Gold Seam — ChronoWalk signature brand element

The Gold Seam is ChronoWalk’s signature brand mark: a thin gold line that
appears only during **meaningful moments**. It is never decorative chrome.

Token color: `var(--gold)` / `T.gold` (`#D4AF37`), glow via `--seam-glow`.

## Principles

1. **Meaningful only** — loading, unlock, arrival, act/chapter change, GPS ready.
2. **Theme aware** — uses CSS `--gold` / `--seam-glow`; override with `accent`.
3. **Lightweight** — CSS transforms + opacity; no frame loops unless `progress`.
4. **Reduced motion** — `prefers-reduced-motion` disables motion; static seam remains.
5. **Configurable** — prefer `moment` presets; override any field via props.

## API

```jsx
import { GoldSeam, GOLD_SEAM_MOMENTS } from '../redesign/ui/index.js'

<GoldSeam moment="arrival" />
<GoldSeam moment="loading" length={32} />
<GoldSeam variant="horizontal" motion="drawAcross" length={48} onComplete={fn} />
```

| Prop | Type | Role |
|---|---|---|
| `moment` | preset key | Resolves variant, motion, duration, layout |
| `variant` | `vertical` \| `horizontal` \| `progress` \| `tick` \| `flash` | Override shape |
| `motion` | `none` \| `breathe` \| `drawDown` \| `drawAcross` \| `flash` \| `pulse` | Override animation |
| `accent` | CSS color | Defaults to brand gold |
| `thickness` | number | Line weight (px) |
| `length` | number \| string | Tick / flash / horizontal length |
| `glow` | boolean | Soft halo |
| `pct` | 0–1 | Progress fill only |
| `play` | boolean | Pause without unmounting |
| `loop` | boolean | Repeat animation |
| `duration` / `delay` | ms | Timing |
| `leadingDot` | boolean | Draw-down “keyhead” (purchase / unlock) |
| `layout` | `fill` \| `inline` \| `overlay` | Positioning recipe |
| `onComplete` | fn | Fires once when non-looping motion finishes |

Presets live in `src/redesign/ui/goldSeamPresets.js`.
CSS keyframes live in `src/redesign/redesign.css` (`cwGoldSeam*`).

## Animation system

| Motion | Technique | Typical moment |
|---|---|---|
| `breathe` | opacity pulse | loading |
| `drawDown` | `scaleY` from top (+ optional leading dot) | purchase / tour unlock / arrival tick |
| `drawAcross` | `scaleX` from left | chapter transition |
| `flash` | quick `scaleX` bloom | GPS acquired / audio unlocked |
| `pulse` | opacity + slight `scaleY` | act transition |
| `none` | static | reduced motion / progress drive |

Legacy `Seam` re-exports a breathing fill line for older call sites. Prefer
`GoldSeam` + a moment for new work. **Do not** replace structural route spines
(My Tour / Stops continuous act lines) with moment seams — those are wayfinding.

---

## Documented usages

| Moment | Preset | Where | Trigger |
|---|---|---|---|
| **Loading** | `loading` | `RedesignMyTourScreen.jsx`, `RedesignStopsScreen.jsx` | Manifest loading state |
| **Chapter transition** | `chapterTransition` | `C6ImmersivePlayer.jsx` continuity panel | Story complete → continue CTA |
| **Arrival** | `arrival` | `C4ArrivalMoment.jsx`, `WalkingCompanionScreen.jsx` | Arrived UI / arrival card |
| **GPS acquired** | `gpsAcquired` | `RedesignBeginFlow.jsx` | Location permission `granted` before journey start |
| **Purchase success** | `purchaseSuccess` | `A3AccessConfirmed.jsx` | Access confirmed after purchase |
| **Tour unlocked** | `tourUnlocked` | Same ceremony as purchase — preset available; A3 is the live unlock surface (“Rome is yours”) | Access / entitlement granted |
| **Audio unlocked** | `audioUnlocked` | `RedesignJourneyWelcome.jsx` via `JourneyShell.jsx`; also `RedesignAudioUnlock.jsx` | Audio context unlock ceremony (~850ms) |
| **Act transition** | `actTransition` | `C8cActComplete.jsx` | Act complete closing seam |

### Intentionally not Gold Seam moments

| Surface | Why |
|---|---|
| My Tour / Stops continuous act spine | Structural wayfinding, not a moment |
| Journal diptych spines (`E1`) | Editorial structure |
| Landing editorial figure (`LandingEditorialBand` → legacy `Seam`) | Brand punctuation on marketing; leave until landing migrates |
| `G3SystemStates` / prototype `C1` / `C5` fill seams | Prototype / system demos |
| Threshold slider seam (`Threshold.jsx`) | Interaction chrome tied to reveal percent |

---

## Adding a new moment

1. Add a preset to `GOLD_SEAM_MOMENTS` in `goldSeamPresets.js`.
2. Mount `<GoldSeam moment="…" />` only when the moment is true.
3. Document the row in this file’s usage table.
4. Prefer CSS motion; keep JS out of the rAF path unless driving `pct`.
