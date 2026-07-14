# ChronoWalk Motion Design System

**Rule: No animation without purpose.**  
Purpose means immersion, continuity, or feedback — never decoration.

Canonical tokens: `src/redesign/motion/tokens.js` + CSS vars in `src/design/tokens.css`.  
Primitives: `src/redesign/motion/` (`FadeReveal`, `RiseIn`, `AtmosphereDim`, `SubtleDrift`, ceremony + Gold Seam + Press Hold).

Companion docs: `ARRIVAL_CEREMONY.md`, `PRESS_HOLD.md`, `GOLD_SEAM.md`.

---

## Motion hierarchy

| Tier | Max duration | Purpose | Examples |
|---|---:|---|---|
| **Micro** | 160ms | Continuity of continuous controls | Seek fill, toggle thumb |
| **Feedback** | 220ms | Confirm the touch | Buttons, chips, escape |
| **Nav** | 520ms | Spatial continuity | Sheets, panels, phase copy |
| **Immersive** | 2400ms | Presence while walking / listening | Threshold hold, unlock flash |
| **Cinematic** | 28s | Story weight | Arrival, purchase Seam, ken-burns |

Lower tiers never “steal” cinematic timing. Cinematic never hijacks taps.

---

## Durations

| Token | ms | CSS var |
|---|---:|---|
| `instant` | 80 | `--d-instant` |
| `micro` | 160 | `--d-micro` |
| `ui` | 200 | `--d-ui` |
| `feedback` | 220 | `--d-feedback` |
| `panel` | 360 | `--d-panel` |
| `nav` | 400 | `--d-trans` |
| `sheet` | 380 | `--d-sheet` |
| `rise` | 700 | `--d-rise` |
| `reveal` | 900 | `--d-reveal` |
| `ceremony` | 1200 | `--d-cinematic` |
| `charge` | 2400 | `--d-charge` |
| `breathe` | 2800 | `--d-breathe` |
| `drift` | 28000 | (arrival only) |

Prefer **slower & calmer** when unsure. Never invent a one-off duration if a token fits.

---

## Easing curves

| Name | Curve | Use |
|---|---|---|
| **enter** | `cubic-bezier(0.22, 0.8, 0.36, 1)` | Soft entries (`--ease-enter`) |
| **standard** | `cubic-bezier(0.33, 0, 0.2, 1)` | Charge / progress (`--ease-standard`) |
| **exit** | `cubic-bezier(0.22, 1, 0.36, 1)` | Settle, sheets, rise (`--ease-exit`) |
| **pressure** | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Press-in feedback (`--ease-pressure`) |
| **breathe** | `ease-in-out` | Ambient loops only |
| **linear** | `linear` | Scrubbers / waveforms |

No bounce. No overshoot spring. No elastic “game” curves.

---

## Categories

| Category | Duration | Ease | Tier | Notes |
|---|---|---|---|---|
| Navigation | 400 | exit | nav | Tab / panel continuity |
| Arrival | ceremony beats | exit/standard | cinematic | `ceremonyTimelines.js` |
| Audio | 360 | standard | immersive | Player chrome; unlock uses Gold Seam flash |
| Loading | 2800 | breathe | immersive | Seam breathe — no spinner thrash |
| Cards | 200 | enter | feedback | Tint / border only |
| Buttons | 220 | pressure | feedback | Scale ≤ 0.985 on press |
| Maps | 360 | exit | nav | Phase copy only — map owns camera |
| Journal | 700 | exit | nav | Quiet rise-in |
| Onboarding | 380 | exit | nav | One sheet motion |
| Purchases | 2400 | standard | cinematic | Gold Seam draw-down |

Access via `MOTION_CATEGORIES` / `RiseIn category="…"`.

---

## Shared primitives

| Primitive | Role |
|---|---|
| `FadeReveal` | Opacity + lift — core enter |
| `RiseIn` | Category-aware FadeReveal |
| `AtmosphereDim` | Soft darken (arrival / hold) |
| `SubtleDrift` | Ken-burns (cinematic only) |
| `useCeremonyTimeline` | Named beat schedules |
| `GoldSeam` | Brand moments only |
| `PressHoldOrb` | Signature unlock interaction |
| `.cw-motion-pressable` | Shared press scale |

**Do not** copy opacity/translate transitions inline. Use `RiseIn` / `FadeReveal` / CSS vars.

---

## Audit (2026-07-14)

Questions applied to every motion: necessary? immersive? smoother? slower? calmer?

| Motion | Category | Verdict | Action |
|---|---|---|---|
| Arrival ceremony (dim→seam→title→CTA) | Arrival | Necessary, immersive | Keep — already systemized |
| Press & Hold charge | Immersive | Signature | Keep — see PRESS_HOLD |
| Gold Seam moments | Purchase / loading / act | Necessary when momentful | Keep — never decorative |
| Threshold clip reveal | Immersive | Core product | Keep — uses hold easing |
| Walking phase / subtitle in | Maps | Continuity | Keep — ease aligned to `--ease-exit` |
| Sheet slide (settings / transit) | Navigation | Continuity | Migrated to `--d-sheet` / `--ease-exit` |
| Primary / chip / escape press | Buttons | Feedback | Migrated to feedback tokens |
| Journey complete rise | Journal | Quiet immersion | Migrated to `RiseIn` |
| Presence pulse (act nodes, invite) | Loading / onboarding | Borderline | Kept but **slowed** invite pulse (2.8s); prefer Gold Seam for true moments |
| Pulse rings (beacon) | Maps | Decorative if overused | Keep for approach only — not arrival hero |
| Reveal-invite demo loop | Onboarding | Teaching | Keep once; respect reduced motion |
| Floating audio wave bars | Audio | Feedback while playing | Keep linear loop; no extra sparkles |
| Seam breathe on My Tour spine | — | Wayfinding structure | Keep structural (not a “moment”) |
| Landing hover transitions | Navigation | Feedback | Leave landing CSS (parallel stack); use `--d-ui` when touched |
| Aggressive slides / springs | — | Against tone | **Removed / replaced** one-off sheet spring with exit ease |

### Declined for motion system

- Card “lift on hover” as default — no
- Confetti / particle unlock — no
- Map marker bounce — no
- Spinner of indeterminate shape — prefer Seam breathe

---

## 60fps checklist

1. Animate `transform` / `opacity` (filters sparingly, only while holding).  
2. Avoid layout thrash (`top`/`height` animation except legacy seam paths).  
3. `will-change` only during active hold / ceremony.  
4. One rAF clock per interaction (hold reveal + haptic tick).  
5. Respect `prefers-reduced-motion` — compress, don’t invent alternate spectacles.

---

## Adding motion

1. Pick a **category** from the table.  
2. Use `RiseIn` / `FadeReveal` / CSS vars — no new cubic-bezier.  
3. If cinematic, extend a ceremony timeline — don’t freestyle delays.  
4. Document in this file if you add a duration token.  
5. Ask: does removing it hurt immersion or clarity? If not, don’t ship it.
