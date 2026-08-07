# MOBILE_PLATFORM_OPTIONS.md
ChronoWalk 2.0 — Gate 0 · August 2026

Platform/stack options for an iOS-first, Android-next, camera- and audio-intensive product. **No stack is chosen here** — this is the decision landscape for Gate 1, informed by 2026 research.

## Requirements the stack must serve

1. Flawless background/lock-screen audio + head-tracked spatial audio (CoreAudio/AVFoundation, CMHeadphoneMotionManager).
2. Precise location + heading + geofencing with battery discipline.
3. Camera AR for Tier B/C: ARKit, VPS SDKs (ARCore Geospatial has an iOS SDK; Niantic Spatial ships Unity/Swift/Kotlin), possibly Metal-level splat rendering.
4. Robust offline packs (content, audio, maps, reconstruction assets).
5. Android within a realistic horizon without a full rewrite (Playbook: Android next).
6. Small-team maintainability (founder + automation + contractors — I8/I9).

## Options

### A. Native SwiftUI/Swift, iOS-only first; Kotlin later for Android
- **For:** first-class access to every differentiating API (spatial audio head tracking, ARKit, Foundation Models on-device LLM, Metal splat renderers like MetalSplatter, background audio edge cases). Best performance, battery, and polish ceiling. The frontier features *are* the product.
- **Against:** Android becomes a second codebase later; slower initial velocity than the founder's web experience base.
- Label: `established`; highest experience ceiling, highest duplication cost later.

### B. Shared core + native shells (Kotlin Multiplatform, or Swift-first core)
- **For:** 2026's strongest "native UX without rewrite" pattern — business logic, content model, sync, claim-ledger client in shared Kotlin; UI, AR, audio fully native per platform. KMP is production-mature in 2026 with strong momentum for exactly this app profile (native-heavy features + shared domain).
- **Against:** two UIs still built twice; KMP toolchain adds complexity for a solo founder; benefits arrive mostly when Android starts.
- Label: `established` (2026), best long-term structural fit *if* Android is truly near-term.

### C. React Native (New Architecture) / Expo
- **For:** founder velocity (JS/web heritage), one codebase, Expo tooling maturity, good enough for the non-AR 90% of screens; native modules can host ARKit/audio code.
- **Against:** every differentiating feature (spatial audio tracking, VPS AR, splat rendering, background audio reliability) lives in custom native modules — the "escape hatch" becomes the main hatch. Risky fit for a product whose soul is native-frontier.
- Label: `established` generally; `needs prototyping` → likely `not recommended` for *this* product's core, viable for companion/CMS surfaces.

### D. Flutter (Impeller)
- **For:** excellent rendering performance and single codebase.
- **Against:** same native-plugin burden as C for AR/audio frontier, plus Dart adds a language the ecosystem (AR SDKs, splat renderers) doesn't prioritize.
- Label: `established` generally; `not recommended` for the core here.

### E. Unity (as app or embedded)
- **For:** Niantic Spatial's primary SDK target; best tooling for Tier C 3D content.
- **Against:** Unity-as-whole-app fights the calm, native, city-first UX (I1); heavy runtime; licensing.
- **Middle path:** Unity-as-a-Library or native RealityKit/Metal for 3D moments only — keep as an *embedding* option, not an app platform.
- Label: `established` tech; `needs prototyping` as embedded module; `not recommended` as the app.

## Honest framing of the real tradeoff

The choice is between **experience ceiling (A/B)** and **founder velocity (C)**. Because the entire thesis is that presence quality is the moat — and every presence lever is a native API — Gate 0's analysis *leans* A (SwiftUI now) with B (shared-core) as the structural evolution when Android starts, and C retained for internal tools/Foundry surfaces. **This is a leaning, not a decision.** The decision belongs to Gate 1, after the experience prototypes reveal how much native depth Tier A/B actually require.

## Also noted

- The user currently works from the Replit iOS app; native iOS scaffolding/builds will require the desktop environment when building begins (flagged earlier — does not affect Gate 0/1 analysis).
- Whatever the stack, architecture must stay city-agnostic (I7): the app is an engine that loads city packs; no city ever appears in code.
