# Arrival ceremony

Arrival is a **meaningful pause**, not a status screen.

Tone: museum installation · Apple keynote · premium documentary.  
Never flashy. Never game UI.

## Sequence

When the walker reaches a stop (GPS dwell or “I’m here”):

1. **Pause** — hold still
2. **Dim** — soft atmospheric darken
3. **Ambient** — arrival cue + zone bed (if audio unlocked)
4. **Drift** — extremely slow photo motion
5. **Gold Seam** — brand mark for the moment
6. **Title** — slow reveal
7. **Copy** — supporting line
8. **CTA** — delayed primary action
9. **Secondary** — quieter follow-on actions

Timings: `src/redesign/motion/ceremonyTimelines.js` (`ARRIVAL_CEREMONY`).

## Reusable primitives

| Primitive | Path | Role |
|---|---|---|
| `useCeremonyTimeline` | `motion/useCeremonyTimeline.js` | Named beat schedule |
| `FadeReveal` | `motion/FadeReveal.jsx` | Soft opacity + lift |
| `AtmosphereDim` | `motion/AtmosphereDim.jsx` | Soft darken overlay |
| `SubtleDrift` | `motion/SubtleDrift.jsx` | Slow ken-burns |
| `GoldSeam` | `ui/GoldSeam.jsx` | Signature brand mark (`moment="arrival"`) |

## Call sites

| Surface | Behavior |
|---|---|
| `C4ArrivalMoment` | Full ceremonial arrival (JourneyShell `ARRIVED`) |
| `JourneyShell` redesign | Enters `ARRIVED` (no longer skips to story); atmosphere via `onAtmosphereStart` |
| `WalkingCompanionScreen` | “I’m here” on waypoints enters JourneyShell ceremony; transit keeps in-companion confirm |

## Reduced motion

`ARRIVAL_CEREMONY_REDUCED` fires all beats immediately; drift is disabled; content remains readable.
