# X-VPG Protocol — Stimulus Standards (Day 5, frozen pending founder ratification)

Visual Presence Gradient experiment. Manipulated variable: **interaction concept only**
(Control = binary/static Then↔Now; B1 = layered cinematic reveal; B5 = Lantern active
discovery). Everything else held constant. External sessions NOT authorized yet.

---

## 1. Standardized prototype notice (FINAL WORDING)

Shown exactly once, before the participant sees ANY condition. Identical for every
participant. Never repeated inside a cell.

> **Before you begin**
>
> You are about to try early prototype reconstructions of a historical place. They were
> created to test how historical information is presented, and some visual details are
> intentionally simplified.
>
> As you use each one, focus on how well it helps you understand and imagine the place —
> not on artistic polish.

Compliance with founder constraints: identical for all participants; appears once before
all conditions; no mention of AI; no uncertainty singled out in any one cell; no expected
winner implied; no condition named; no hypothesis revealed.

## 2. Stimulus parity audit (Day 5)

**CONTENT — PASS**
- Historical claims: single source (verified ledger); no claims embedded in visuals beyond
  the shared reconstruction imagery. Narration (if used) is the single A1 track.
- Structures depicted: identical — all three modes render the same `PLANES` stack from the
  same component (`B1Shell.tsx`); there is no per-condition asset path.
- Reconstruction detail: identical by construction (see §3 fix — all depth planes are
  masked bands of one backdrop image).
- Narration: same A1 file, same voice, same timing, same loudness, same start behavior
  (starts on entering the cell) in all cells, or omitted in all cells.
- Duration: session-timed equally per cell (recommend 90 s per cell, timer identical).
- Resolution: same source images, same viewport, same device.

**VISUAL FIDELITY — PASS after Day 5 fixes**
- No condition receives better source imagery (one image set, one component).
- No condition receives extra reconstruction detail (single composite).
- No condition receives superior color grading (no per-mode filters; harmonization, if
  any, applies to the shared stack).
- Defect exposure: previously FAIL — misaligned cutout planes were concealable by
  Lantern's circular reveal but exposed by B1's full-frame reveal. Fixed Day 5 (§3):
  planes now pixel-align perfectly, so no condition hides defects that remain exposed
  in another.

**INFORMATION — PASS.** Same historical information available in every cell (same visual
composite, same optional narration; no captions or labels differ by mode).

**INTERACTION — the manipulated variable (intended).**
- Control: slider/button crossfade of the flattened composite, parallax = 0.
- B1: same composite as parallax-banded layered reveal.
- B5: same composite under a draggable circular lantern reveal.

## 3. ART-0 fixes made (Day 5, all within permitted cheap-fix list)

1. **Masks adjusted / layers derived from one source:** the separate mid/near cutout PNGs
   (temple, arch) duplicated architecture already present in the backdrop and could not be
   cheaply aligned. All three depth planes are now soft gradient-masked bands of the SAME
   `recon_backdrop.jpg` — perfect alignment, zero invented or duplicated architecture,
   zero new assets, zero spend. Cutout PNGs retired (files kept for the record).
2. **Parallax amplitude reduced** (translate 40→22 px, scale 1.06→1.035 max) so B1's
   plane motion cannot expose band seams; seams are soft gradients, not hard edges.
3. **Control flattening verified** — Control renders the identical composite with
   parallax forced to 0; it is literally the same DOM stack.
4. No ART-1, no beautification beyond artifact removal, no commissions, no new
   architecture invented.

Evidence: 390×844 screenshots of Control/B1 revealed states are visually identical
(captured Day 5); deterministic QA states available via URL params
(`?mode=control|b1|lantern&reveal=0..1&full=1`).

## 4. Residual confounds (documented, unavoidable at ART-0)

1. **Lantern novelty (NV1):** intrinsic to the concept; per founder directive, not
   eliminated — measured separately and applied as an interpretation gate (see §5).
2. **Depth-motion aesthetics:** B1's parallax is part of its concept but also adds visual
   richness Control lacks; inseparable from the manipulation itself.
3. **Reveal completeness:** Lantern participants may never see the full composite at once
   (unless they press "Reveal all"); information *access* is equal, information *uptake*
   may differ — this is the phenomenon under test, but should be noted when reading HPS.
4. **AI-generated backdrop inaccuracies:** the ART-0 reconstruction contains incidental
   geographic/architectural inaccuracy. Identical in all cells (condition-neutral), and
   the standardized notice frames simplification, but absolute presence scores should not
   be over-interpreted — only between-condition differences.
5. **Interaction burden asymmetry:** Lantern requires continuous touch; Control requires
   one gesture. Burden is part of the concept but must be measured (see veto).

## 5. Interpretation gate (founder directive, Day 5)

Lantern does NOT automatically graduate even if it wins HPS. Graduation blocked if any of:
high NV1 novelty driving the win; no legibility improvement; increased attention conflict
(AC veto instrument); significantly higher interaction burden. Goal is historical
presence, not "this interaction is cool."

## 6. Audio constant rule

X-VPG is a visual-interaction experiment. If narration is used: the exact same A1 draft
TTS track (script, voice, timing, loudness, autoplay-on-entry) in all three cells. No
audio comparisons inside X-VPG; A-track experiments remain separate.

## 7. Readiness checklist (status end of Day 5)

| Requirement | Status |
|---|---|
| Same reconstruction content across cells | ✅ (single masked-band stack) |
| Condition-specific asset artifacts removed | ✅ (Day 5 fix) |
| Narration constant | ✅ (A1 track ready; rule frozen) |
| Disclaimer constant | ✅ (final wording above) |
| Protocol frozen | ⏳ pending founder ratification of this document |
| Randomization ready | ❌ not built (condition-order Latin square needed) |
| HPS form ready | ❌ not built |
| Attention-conflict veto instrument ready | ❌ not built |
| Participant instructions ready | ❌ not written (cell-neutral script needed) |
| No condition-biased technical bug | ✅ known bugs fixed; on-device iPhone QA still owed |

**X-VPG READY = NO.** Remaining: founder ratification of protocol + notice wording;
randomization scheme; HPS form; AC veto instrument; participant instruction script;
founder's on-device iPhone QA (checklist provided Day 5).
