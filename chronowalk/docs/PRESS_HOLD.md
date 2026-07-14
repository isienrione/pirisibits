# Press & Hold — ChronoWalk signature interaction

Intention: **“I am unlocking history.”**  
Not: “I am pressing a button.”

Canonical implementation: `Threshold.jsx` + `PressHoldOrb` + `interaction/pressHoldSpec.js`.

---

## Durations

| Token | ms | Role |
|---|---:|---|
| `HOLD_PRESSURE_IN_MS` | 160 | Immediate pressure (scale / depth) |
| `HOLD_MID_MS` | 1000 | Mid-charge haptic / glow accent |
| `HOLD_COMMIT_MS` | 2000 | Latch threshold — history unlocked |
| `HOLD_MS` | 2400 | Full Now→Then visual + sound charge |
| `HOLD_COMMIT_FINISH_MS` | 400 | Snap finish after commit while held |
| `HOLD_RELEASE_MS` | 900 | Incomplete release settle to Now |
| `HOLD_RELEASE_SNAP_MS` | 520 | Orb / glow collapse |
| `HOLD_IDLE_BREATHE_MS` | 2600 | Idle affordance breathe |

Source: `src/interaction/pressHoldSpec.js`.

---

## Easing curves

| Curve | CSS | JS | Used for |
|---|---|---|---|
| Progress charge | `cubic-bezier(0.33, 0, 0.2, 1)` | `easeHoldProgress` | Reveal clip, progress ring, sound ramp |
| Release settle | `cubic-bezier(0.22, 1, 0.36, 1)` | `easeHoldRelease` (ease-out quint) | Pull-back to Now, orb collapse |
| Pressure-in | `cubic-bezier(0.2, 0.8, 0.2, 1)` | `easeHoldPressure` | Instant press squash |

No bounce. No spring overshoot. No gamey pulse pop.

---

## Haptic timing

From press (`t = 0`):

| Beat | t (ms) | Kind | Feel |
|---|---:|---|---|
| Press | 0 | `holdPress` | Light impact — finger meets stone |
| Mid | 1000 | `holdMid` | Soft selection tick — charge deepening |
| Commit | 2000 | `holdUnlock` | Success + heavy — history unlocked |
| Cancel | on early release (≥280ms held) | `holdCancel` | Light damp — no unlock |

Wired via `useHoldHaptics` → `utils/haptics.js`.  
Disabled when `prefers-reduced-motion: reduce`.

---

## Sound timing

Ambience crossfade is frame-locked to the visual charge:

| Event | Ramp |
|---|---|
| Press | Now → Then over `HOLD_MS` (2400) — **starts at t=0**, no delay |
| Commit finish | Then confirm over `HOLD_COMMIT_FINISH_MS` (400) |
| Release (incomplete) | Then → Now over `HOLD_RELEASE_MS` (900) |

Implementation: `ThresholdAudioCrossfade.rampToThen / rampToNow`.

---

## Visual layers (60fps)

Prefer transform / opacity / filter only:

1. **Pressure** — orb scale compress then charge grow  
2. **Progress** — SVG stroke-dashoffset ring (no layout)  
3. **Glow** — radial gold, opacity tied to progress  
4. **Blur / depth** — soft depth disk + media canvas blur/brightness  
5. **Release** — eased dash collapse + atmosphere fade  

`will-change` applied only while holding. Single rAF loop drives reveal + haptic clock.

---

## Copy

| State | Line |
|---|---|
| Idle | Hold to unlock history |
| Charging | Unlocking history… |
| Unlocked | History unlocked |
| Return | Tap to return to today |

---

## Call sites

| Surface | Role |
|---|---|
| `Threshold.jsx` | Canonical hold engine |
| `ThresholdHoldHint` / `PressHoldOrb` | Idle + active affordance |
| `ThresholdRevealInvite` | First-time education copy |
| `C6ImmersivePlayer` | Under-title hint on reconstructions |
