# iPhone Device QA — B1/Lantern Prototype (Day 5)

**Who:** Founder, on a physical iPhone. Headless/desktop testing cannot prove performance;
nothing below is claimed as proven until you run it.

**Setup (2 min)**
1. Open the Replit app → this project → Preview → select the Canvas/mockup artifact, or
   open the preview URL in Safari directly.
2. Navigate to the B1 shell preview (the canvas iframe or
   `/__mockup/preview/b1-shell/B1Shell`).
3. Confirm the fps HUD is visible top-right. Note your iPhone model + iOS version.
4. Do one full pass indoors, then repeat steps 5–9 outdoors in daylight.

Deterministic states for retesting: append `?mode=b1&reveal=1`, `?mode=control`,
`?mode=lantern`, `?mode=lantern&full=1` to the URL.

---

## Tests (do in order; record PASS/FAIL + notes)

**1. Image loading**
- Cold-load the page on cellular (airplane-mode toggle first to clear connection reuse).
- PASS: modern photo visible < 3 s; reveal shows reconstruction with no black/blank
  frames or visible progressive loading during interaction.
- FAIL: any missing image, alt-text placeholder, or reveal showing unloaded content.

**2. Touch responsiveness (all 3 modes)**
- Tap each mode button; drag on the stage in B1; tap-then-drag in Lantern; scrub the
  slider in Control/B1. Repeat fast and slow.
- PASS: every touch acts within a perceptible instant (< ~100 ms feel); no dead taps;
  no double-activation.
- FAIL: any tap that visibly lags, is ignored, or triggers the wrong control.

**3. Lantern reveal latency**
- In Lantern, touch a new spot 10 times (vary location, include screen edges).
- PASS: the circle ignites AT your finger essentially instantly every time and glides
  smoothly when you drag; release leaves it in place.
- FAIL: circle appears somewhere else first, lags > ~150 ms feel, or jumps on release.

**4. FPS / jank**
- Watch the HUD while: dragging B1 parallax hard side-to-side 10 s; dragging the lantern
  in circles 10 s; scrubbing the slider fast 10 s.
- PASS: HUD ≥ 55 fps sustained on a recent iPhone (≥ 45 on older devices), no visible
  stutter or frame hitches during any gesture.
- FAIL: sustained < 45 fps, or visible hitching even with acceptable numbers.

**5. Accidental edge-swipe navigation**
- Start lantern drags FROM the left and right screen edges, 5× each. Drag the B1 stage
  from the edges. Also swipe up from the bottom mid-gesture once.
- PASS: no accidental Safari back/forward navigation, no app-switch, page never scrolls
  or rubber-bands during stage gestures.
- FAIL: any navigation gesture fires while interacting with the stage.

**6. One-handed reach**
- Hold the phone one-handed (both hands separately if possible). Thumb-only: switch
  modes, scrub the slider, ignite + drag the lantern to all four quadrants.
- PASS: every control usable by thumb without regripping; lantern reaches the top
  corners without strain (remember: touch anywhere re-ignites it there — no need to drag
  the whole way).
- FAIL: any control or screen region that forces a regrip or second hand.

**7. Slider feel (Control + B1)**
- Scrub slowly end-to-end, then flick. Try grabbing it mid-track.
- PASS: thumb tracks your finger exactly, crossfade is smooth and continuous, no
  snapping or dead zones; "Reveal 315"/"Back to today" button always works.
- FAIL: jumpy thumb, laggy crossfade, or mis-grabs.

**8. Glare / legibility (OUTDOORS, daylight)**
- At max brightness in sunlight: can you see the lantern rim, the hint text, the mode
  buttons, and the fps HUD? Is the reconstruction readable through glare?
- PASS: lantern boundary and all controls clearly visible; amber rim distinguishable.
- FAIL: any control or the lantern edge invisible in glare.

**9. Reduced-motion fallback**
- Settings → Accessibility → Motion → Reduce Motion ON. Reload. Repeat quick versions of
  tests 2, 3, 7.
- PASS: parallax is disabled (no plane drift), reveals become instant/simple fades,
  everything still functions; "Reveal all" works in Lantern.
- FAIL: motion still present, or anything breaks.

---

## Report back
For each of the 9: PASS/FAIL + one line of notes. Plus: iPhone model, iOS version,
indoor vs outdoor differences, and anything that felt wrong even if it "passed."
Special attention: anything that affects ONE mode more than the others — that is an
X-VPG validity problem, not just a bug.
