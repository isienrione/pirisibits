# MOBILE_CAPABILITY_MATRIX.md
ChronoWalk 2.0 — Gate 1 · Track E · August 2026

Architecture candidates evaluated against **actual ChronoWalk requirements**. Per founder correction #2: **no winner is selected here.** The Gate 0 SwiftUI leaning is downgraded to one hypothesis among several; the decision is made after the experiments reveal what the winning experience requires (see GATE1_DECISION_TREE.md).

## Candidates

- **N** — Native Swift/SwiftUI + RealityKit/ARKit (Kotlin/Compose later for Android)
- **RN** — React Native / Expo (New Architecture) + native modules for AR/audio/CV
- **FL** — Flutter (Impeller) + platform plugins
- **KMP** — Kotlin Multiplatform shared core + fully native UI/experience per platform
- **SHELL** — Native experience shells + shared backend/content/domain layer (language-agnostic: the "shared core" is the city-pack format, content runtime spec, and server — not shared app code)
- **HYB** — Recommended hybrid to evaluate: SHELL + optional Unity-as-a-Library (or native Metal module) mounted only for Tier B3/B4 moments

## Capability matrix

Scale: ●●● first-class · ●●○ good with effort · ●○○ possible but painful · ○○○ poor/blocked.

| Requirement | N | RN | FL | KMP | SHELL | HYB |
|---|---|---|---|---|---|---|
| iOS experience ceiling | ●●● | ●●○ | ●●○ | ●●● | ●●● | ●●● |
| Android portability (no company rebuild) | ●○○ | ●●● | ●●● | ●●● | ●●○ | ●●○ |
| AR capability (ARKit/RealityKit; VPS SDKs) | ●●● | ●○○ (native mods) | ●○○ | ●●● (native side) | ●●● | ●●● |
| Computer vision (Vision/MediaPipe, segmentation, homography) | ●●● | ●○○ | ●○○ | ●●● | ●●● | ●●● |
| Camera control (precise, low-latency) | ●●● | ●●○ | ●●○ | ●●● | ●●● | ●●● |
| GPU rendering (Metal shaders, splat renderers) | ●●● | ●○○ | ●●○ (Impeller≠custom Metal) | ●●● | ●●● | ●●● (Unity path too) |
| Spatial audio + head tracking (PHASE, CMHeadphoneMotionManager) | ●●● | ●○○ | ●○○ | ●●● | ●●● | ●●● |
| Background/lock-screen audio reliability | ●●● | ●●○ | ●●○ | ●●● | ●●● | ●●● |
| Offline packs (large assets, resumable, versioned) | ●●● | ●●○ | ●●○ | ●●● | ●●● | ●●● |
| Maps/location/geofencing battery discipline | ●●● | ●●○ | ●●○ | ●●● | ●●● | ●●● |
| Sensors/haptics fidelity | ●●● | ●●○ | ●●○ | ●●● | ●●● | ●●● |
| Runtime performance / battery | ●●● | ●●○ | ●●○ | ●●● | ●●● | ●●○ (Unity moments heavy) |
| Developer velocity (solo founder + agent, iOS first) | ●●○ | ●●● | ●●○ | ●○○ | ●●○ | ●●○ |
| Replit build/maintain fit (agent-assisted, CI, previews) | ●●○ | ●●● | ●●○ | ●○○ | ●●○ | ●○○ |
| Testing complexity | ●●○ | ●●○ | ●●○ | ●○○ | ●●○ | ●○○ |
| Long-term maintenance (10-year horizon, small team) | ●●○ | ●●○ | ●●○ | ●●○ | ●●● | ●●○ |
| 100+ cities support (content-driven, city-agnostic) | ●●● | ●●● | ●●● | ●●● | ●●● | ●●● (pack format decides, not stack) |
| Advanced native features later (Foundation Models, visionOS, new APIs) | ●●● | ●○○ | ●○○ | ●●● | ●●● | ●●● |

## Honest observations (not a selection)

1. **The experiments will move this matrix.** If B2/B3-class camera experiences win, the AR/CV/GPU rows dominate and cross-platform UI layers pay a "native module tax" on exactly the features that matter. If A-class audio + B1 cinematic wins, RN/FL become far more viable than Gate 0 assumed — background audio and pre-rendered visuals are well within their reach.
2. **SHELL is under-appreciated.** The genuinely shared asset in a 100-city product is the *city-pack format + content runtime spec + Foundry/backend* — all platform-neutral regardless of UI stack. SHELL makes "Android without rebuilding the company" a property of the content system rather than the app framework, and defers zero experience quality. Its cost: two native experience codebases eventually.
3. **KMP vs. SHELL** is really "shared domain code vs. shared content spec." KMP shines when domain logic is large and complex; ChronoWalk's runtime domain logic is comparatively thin (pack loading, triggers, state) while its *content* is huge — which weakens KMP's usual argument here and deserves a bench probe, not an assumption.
4. **Unity enters only through HYB** (as-a-Library for B3/B4 moments, mainly if Niantic VPS2 wins X-B3 — its Swift/Kotlin SDKs may make Unity avoidable even then). Unity as the whole app remains `not recommended` (fights I1 calm-native UX; heavy runtime).
5. **RN's real role may be internal:** Foundry/CMS surfaces and test harnesses, where velocity beats polish — regardless of the consumer-app decision.
6. **Replit-fit note:** iOS native builds require Xcode infrastructure outside Replit's container (flagged since Gate 0); RN/Expo has the smoothest Replit story today. This is a real but *secondary* criterion — tooling serves the experience, not the reverse (I5).

## Bench probes to run during Gate 2 (cheap, parallel)

- E-probe 1: background-audio + head-tracking spike in RN/Expo (how bad is the module tax really?).
- E-probe 2: pack-format-first spike — define a draft city-pack schema and load it from two throwaway shells (SwiftUI, RN) to validate SHELL's premise.
- E-probe 3: KMP hello-domain shared with a SwiftUI shell — measure the toolchain overhead for a solo founder honestly.

## Decision timing

Stack selection happens at the **end of Gate 2**, when X-A/X-B outcomes define the experience requirements and the bench probes have priced the module tax. Until then, all experiment prototypes are explicitly throwaway (prototype ≠ product architecture).
