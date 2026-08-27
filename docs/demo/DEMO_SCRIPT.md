# Demo script — 5–7 minutes

Environment: Expo development build or `pnpm --filter @chronowalk/traveler start`. This Cloud Agent has **no iOS/Android simulator**; walk the flow on a device/simulator locally.

The copy never claims City Engine intelligence. Look for `DEMO_ONLY` on proposal screens.

## 1. Portada (30s)

App opens on **A01 Portada**, not Diagnostics. Tap **Begin**.

## 2. Onboarding (60–90s)

Five decisions, one per screen: interests → style → mobility → time (**120 minutes**) → location.

On **A08**, you may **Plan without location**. Location is not requested at launch.

Tap **Compose the afternoon**. **K01** shows sequence fragments, then the draft.

## 3. Proposal (60s)

**B01** shows one draft: “Borrador para tus 120 minutos”. Open the **score (B04)**.

You should see a tall Hero, compact Discovery, one-line micros, walks without cards, and a **lateral sealed** item. Times list `target / experience / walking / buffer / total / Δ / timeFit`.

**Why this (B05)** is structured `WhyReason` lines, including the losing Roma Historica alternative from `romePacing.js`.

**Adjust (B06)** → 60 then 180. The draft identity changes. Return to 120.

## 4. Walk + arrival (45s)

**Walk this draft**. **C01** is D0: next place, no collage. Tap **I’m here**.

**C03**: **Confirm I’m here**, then **Begin the experience**. They are separate. Begin stays disabled until confirm.

## 5. Hero / Discovery / Mystery / Reveal (90s)

Hero cover (**D01**) uses the look-cue. Enter runtime (**D02**), complete, fork later.

To hit Mystery quickly: Settings (from Home) → DEV → `Sim` not required. From **B04** scroll to the lateral item, or after a completion open **E01** and choose **Take the later room now**.

**D07** title is “A room the Forum does not contain”. No Largo / Caesar / Pompey identity. **Reveal now** → **D08** shows the sourced title. **Then/Now** uses provenance captions; if a still is only a path, the interaction still runs.

## 6. Adaptation + resume (45s)

**E01** dominant option + two alternatives + follow the plan. **K02** then **E03** shows the delta (time Δ omitted when walking minutes are unpublished).

Kill and reopen the app: **C07** restores the cursor. Continue or close.

## 7. Failure states (45s)

Settings → DEV:

| Sim | Screen |
| --- | --- |
| `gps-weak` then Walk | **J03** |
| `permission-denied` | denied copy on **C01** |
| `no-token` then Map | paper plot, not a blank crash |
| `offline` | **J01**, persisted route remains |
| `planning` | no distance-from-you |

**Gallery** lists every registered Gate S screen with `functional` / `visual-draft` / `not-started`. **L01 Detail Hunt** is visual-draft.

Diagnostics is only from Settings while `__DEV__`.
