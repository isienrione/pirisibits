# Traveler v1 — visual QA

Inspected by looking at the generated PNGs (not by TypeScript). Rendered on **Expo web** at 390×844, with extra checks at 393×852 and 430×932. No iOS simulator in this environment.

Contact sheet: `docs/demo/visual/TRAVELER_V1_CONTACT_SHEET.png`

## Baseline vs v1

Baseline (`docs/demo/visual/baseline/`) is the pre-pass skeleton: D0–D3 labels, Georgia/system type, `DEMO_ONLY` / mixed Spanish, PhotoPlaceholder blocks, empty beige/obsidian fields.

v1 (`docs/demo/visual/traveler-v1/`) uses Fraunces, DM Sans, Barlow Condensed, Rome photography from `chronowalk/public`, traveler English, and a Home / Map / Saved / Settings shell on non-immersive screens.

## Screen-by-screen

| ID | Read | Notes |
| --- | --- | --- |
| A01 Welcome | Pass | Full-bleed Rome dusk. Value line is readable. Begin is on-canvas. |
| A03 Interests | Pass | Five-step ticks, antiquity selected, Continue enabled. Spacious, not bureaucratic. |
| B01 Home | Pass | Colosseum dominates. Duration is honest (“walking times are approximate”). Start is primary; Why / Adjust are quiet. Arc preview is visible. Shell present. |
| B04 Sequence | Pass with caveat | Treatments have different weight (hero / walk / closer look / reveal / later). Primary “Walk this afternoon” is above the fold. Mystery “Later” peeks at the bottom — scroll to read the sealed title. |
| C01 Walking | Pass | Street photography, next place, one dominant action, Map · List subordinate. No distance in planning mode — copy is “Keep to the stones”, not a GPS dump. |
| C03 Arrival | Pass | Confirm is distinct from Begin (Begin is quiet until confirm). Photo is the Colosseum, not a placeholder. Extra ivory below the actions is leftover space, not a second module. |
| D01 Hero cover | Pass | Cinematic low-angle Colosseum. “Look up” is literal. Enter is visible. |
| D02 Hero runtime | Pass | Interior still, look cue, listening bar, spoken line, Continue. Audio chrome is visual, not a real player. |
| D05 Discovery | Pass | Compact vs hero: smaller photo, “A closer look”, short line. |
| D07 Mystery sealed | Pass | Spoiler-safe title only. No Largo photograph. Take me / Reveal it now. |
| D08 Mystery revealed | Pass | Largo di Torre Argentina, real still, “This is where Caesar died.” |
| D09 Then/Now | Pass with caveat | Signature hold interaction is labelled. Then reconstruction sits as a stamp. Default Now is a low-angle exterior, so the sky leads; hold (not visible in a still) swaps to then. Preview uses the Colosseum pair — Vesta in the score has a now still only. |
| E01 Fork | Pass | One recommended move plus two alternatives, traveler English. No “cursor” / “micros”. |
| E03 Recomposed | Pass | Explains that the later room is next. Unpublished walking minutes are admitted, not invented. |
| F01 Map | Pass with caveat | Forum photograph with sourced points. Honest that street map is off. Not Mapbox. |
| I01 Settings | Pass | Traveler controls first. Developer information (gallery, diagnostics, sims) is clearly a separate block. “City Engine” appears only here. |

## Extra viewports

A01, B01, C01, D01, D09 at 393×852 and 430×932: primary actions remain in frame. Taller phones show more sky on Colosseum covers (the source still is a low-angle exterior). No clipped buttons observed.

## Corrected during inspection

- Replaced a sky-cropped Colosseum threshold still with the portrait exterior poster.
- Moved “Walk this afternoon” above the score so the CTA is not below the fold.
- Walking uses street photography instead of a sky crop.
- Fork copy no longer mentions micros, cursor, or drafts.
- Tab bar is text + active tick (Roman numerals removed).
- Map copy no longer talks about tokens on the consumer surface.

## Remaining visible limits

- No live Mapbox. Paper plot on a Forum still.
- Audio “Listening” bar is a treatment, not decoded audio.
- Then/Now hold cannot be shown in a static PNG; the stamp + instruction carry the idea.
- Temple of Vesta has no distinct then still in the Rome archive used here.
- L01 Detail Hunt is still a visual draft.
- Settings developer block is intentionally technical.

## Not claimed

Typecheck and unit tests passing is not visual completion. This file exists because the PNGs were opened and judged.
