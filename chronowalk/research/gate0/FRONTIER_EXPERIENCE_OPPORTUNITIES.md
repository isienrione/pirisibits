# FRONTIER_EXPERIENCE_OPPORTUNITIES.md
ChronoWalk 2.0 — Gate 0 · August 2026

2026 frontier landscape research, evaluated in three bands per the frontier mandate: **robust baseline / practical frontier / flagship experimental**. Capability labels: `established` · `needs prototyping` · `expensive` · `device-dependent` · `speculative` · `not recommended`.

## 1. Precise city-scale positioning

| Capability | 2026 status | Label |
|---|---|---|
| GPS + heading + geofenced triggers | Universal; 3–15 m urban accuracy, worse in canyons (Forum area is fine, narrow centro streets aren't) | `established` — robust baseline |
| ARKit Location Anchors (Apple) | Production API, but city coverage list is limited; Rome coverage must be verified on the ground | `established` + `device-dependent` — verify coverage |
| ARCore Geospatial API / VPS (Google, works on iOS) | Production; Street-View-derived VPS gives sub-meter position + orientation where coverage exists; per-location availability check API | `established` (API) + `needs prototyping` (Rome site-by-site reliability, crowds, sun glare) |
| Niantic Spatial VPS2 | Production SDK (Unity/Swift/Kotlin), strong at specific scanned locations; ex-Pokémon Go infrastructure now sold as Niantic Spatial platform | `established` (platform) + `needs prototyping` + vendor-dependency caution |
| UWB / beacons at specific sites | Only with venue partnerships (e.g., inside Colosseum) | `speculative` for v1 — partnership-gated |

**Read:** anchored outdoor AR at known flagship stops is now *practical frontier*, not research. Whole-city continuous AR remains `not recommended` (battery, coverage gaps, attention cost).

## 2. Visual reconstruction & rendering

| Capability | 2026 status | Label |
|---|---|---|
| Pre-rendered video/parallax "reveal" composited on camera | Trivially robust, historically controllable | `established` — baseline for Tier B |
| Real-time 3D overlays (RealityKit/SceneKit/Unity) with stylized (non-photoreal) reconstruction | Mature; stylization sidesteps both uncertainty-honesty and uncanny-valley problems | `established` |
| Gaussian splatting on-device (MetalSplatter; Mobile-GS, ICLR 2026; Seele, CVPR 2026) | Real-time mobile rendering demonstrated; capture→cleanup→historical *re-creation* pipeline is the hard part (splats capture what exists; ChronoWalk needs what *no longer* exists — requires 3D artistry rendered into splat or hybrid formats) | `needs prototyping` + `expensive` (per-site asset cost) — flagship experimental |
| Generative AI video/imagery of historical scenes | Powerful for pre-rendered assets; must pass claim-ledger review like any dramatization | `established` as *production tool*, `not recommended` as unreviewed runtime generation |
| Outdoor lighting-consistent AR (auto-matching sun/shadows) | Active research (CleAR 2025 etc.); imperfect outdoors | `speculative` — design around it (dusk scenes, stylization) rather than solving it |

## 3. Audio (the most underrated frontier)

| Capability | 2026 status | Label |
|---|---|---|
| Studio-grade sound design + directed narration | Timeless craft; the #1 presence lever per audio-drama evidence | `established` — robust baseline |
| Head-tracked spatial audio (AirPods + CMHeadphoneMotionManager) | Production API; "the procession passes on your left" while phone stays pocketed | `established` + `device-dependent` (AirPods-class) — **highest presence-per-engineering-dollar candidate** |
| Location-adaptive mixing (walking pace, approach vectors, time of day) | Straightforward engineering on top of established APIs | `needs prototyping` (design, not tech, risk) |
| AI multilingual voice (ElevenLabs-class) with emotional direction | Mature and cheap relative to studio dubbing; per-language QA still human | `established` — pipeline decision, with human editorial gate per Playbook |
| Real-time conversational guide ("ask the city anything") | LLMs can do it; rigor cannot be guaranteed live → violates claim-ledger invariant unless constrained to reviewed content | `needs prototyping` with retrieval locked to the claim ledger; unconstrained: `not recommended` |

## 4. On-device intelligence

| Capability | 2026 status | Label |
|---|---|---|
| Apple Foundation Models framework (on-device LLM, structured output, tool calling; expanded WWDC26) | Production; enables offline personalization, recap generation, Q&A over *bundled reviewed content* | `established` + `device-dependent` (Apple Intelligence devices) |
| On-device segmentation/depth (Vision, LiDAR) | Production; people-occlusion for AR, sky segmentation for reveals | `established` on Pro-class devices; `device-dependent` |
| Adaptive routing (pace/interest/heat/crowds) | Feasible now; Playbook lists it as future — keep post-slice | `needs prototyping`, defer |

## 5. Competitive frame (2026)

- **Commodity tier:** AI-generated audio tour apps proliferating (Wikipedia→LLM→TTS). Cheap, shallow, eroding price expectations while lowering quality expectations — an opportunity for a visibly superior product.
- **Platform tier:** Google Geospatial creator tooling and Niantic Spatial are commoditizing *anchoring tech* — good for ChronoWalk (buy, don't build) but means tech alone is no moat. The moat is editorial rigor + narrative craft + Knowledge Graph + brand (consistent with Playbook Ch. 42, risk 4).
- **Heritage/AR pilots:** museum and site-specific AR reconstructions exist but are venue-bound, not traveler-journey products. Nobody owns "city understanding" as a category.

## Top opportunities (ranked by presence-per-cost)

1. **Pocketed-phone spatial-audio presence (Tier A+).** Head-tracked 3D soundscapes at flagship stops. Established tech, huge differentiation, zero social awkwardness.
2. **Anchored Reveal at 1–2 flagship stops (Tier B).** VPS-class anchoring + pre-authored reveal. The marketing moment and the App Store screenshot.
3. **Claim-ledger-constrained on-device Q&A.** "Ask about this place" answering only from reviewed dossiers — rigor as a feature, offline-capable via Foundation Models.
4. **One Deep Reconstruction showcase (Tier C).** A single splat/hybrid photoreal moment (e.g., Pantheon interior across time) as the category-defining artifact.
5. **AI-voice multilingual pipeline.** Not user-facing tech, but collapses the cost of the 80%-quality-in-every-language rule.
