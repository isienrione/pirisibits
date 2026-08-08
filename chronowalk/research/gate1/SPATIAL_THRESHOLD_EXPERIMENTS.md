# SPATIAL_THRESHOLD_EXPERIMENTS.md
ChronoWalk 2.0 — Gate 1 · Track B · August 2026

Track B is **equally important to Track A** (founder correction #1). It tests whether visual/spatial reconstruction creates historical presence that audio alone cannot — across five candidate experiences, plus one combination cell.

---

## X-B1 — Premium Cinematic Then/Now

1. **Hypothesis:** a perfectly matched present/historical viewpoint with a tactile transition (press/drag/hold) creates a presence jolt exceeding narration alone, without any camera/AR machinery.
2. **User experience:** at a marked vantage, the screen shows the *exact* view in front of the tester (pre-captured, matched focal length). They press/drag/hold; the past resolves with parallax depth layers, subtle motion (smoke, birds, banners), and environmental sound swelling.
3. **Technical implementation:** matched photography + authored reconstruction art, decomposed into 3–6 depth layers with gyroscope parallax; GPU crossfade compositing; three interaction variants (slow-press "restore" · drag time-wipe · dwell auto-resolve).
4. **Must build:** one flagship vantage asset (Forum overlook recommended) + a lightweight interactive player.
5. **Can fake:** viewpoint matching via a painted footprint marker ("stand here") — no CV at all; motion via authored loops, not simulation.
6. **Device requirements:** any modern phone.
7. **Rome required?** Asset capture: yes (or licensed matched photography). Interaction testing: no — directional testing works anywhere with a locally captured vantage; the *real* read needs the real place (Phase 2 ride-along).
8. **Historical assets:** one ledger-reviewed reconstruction painting/render per vantage, layered.
9. **Implementation difficulty:** Low.
10. **Content difficulty:** Medium–High per vantage (reconstruction art is the cost).
11. **Technical failure mode:** none serious.
12. **Experience failure mode:** "nice postcard" — impressive for 10 seconds, no presence; misalignment between screen and world breaking the illusion (footprint discipline matters).
13. **Battery/performance:** negligible.
14. **Android implications:** fully portable.
15. **Success metric:** HPS v0 vs. the same content as narration-only control; interaction-variant forced choice; unprompted "I saw it" narratives.
16. **Kill criterion:** if B1 cannot beat audio-only control on Q1/forced-choice, screen-based visual reveals are demoted and Track B's hopes concentrate on B2/B3 (live-camera modes) — the failure would say *screens* are the problem, not visuals.
17. **Architecture informed:** almost none (deliberately) — B1 is the *experience floor* for all visual tiers and the control for every other B experiment. Also seeds X-C1 (multi-era) assets.

---

## X-B2 — Camera-Assisted 2.5D Reconstruction (the Forum's aggressive test)

1. **Hypothesis:** overlaying reconstruction on the *live camera view* (not a pre-captured photo) materially increases believed presence over B1, using minimum robust technology — no full AR stack.
2. **User experience:** the app invites the tester to raise the camera at a guided vantage; on-screen guidance ("move a little left… there") aligns them; the live ruins visibly *re-complete* — held in hand, walkable within a small zone. "Hold to restore Rome" is ONE candidate interaction, tested against alternatives, not assumed.
3. **Technical implementation (minimum robust ladder, tried in order):** (a) device orientation + guided framing + homography warp of authored overlay onto live view; (b) + feature matching (learned features / SIFT-class) against a reference capture of the vantage for tighter lock; (c) + sky/people segmentation (on-device Vision) so crowds and sky pass through the reconstruction — the single biggest believability trick; (d) + monocular depth for parallax on small translations. Stop at the rung that holds.
4. **Must build:** reference captures + authored overlays for 1–2 Forum vantages; a CV prototype app; the guidance UX.
5. **Can fake:** per-vantage manual calibration (hours of hand-tuning per spot is fine — prototype vs. product rule); tracking can be orientation-only if feature lock underperforms.
6. **Device requirements:** iPhone 12+ class (Neural Engine segmentation); log performance across 2–3 generations.
7. **Rome required?** **Yes** — this is the flagship field experiment. Crowds, glare, and real ruins are the test. Pre-Rome bring-up on a local site first.
8. **Historical assets:** ledger-reviewed Forum reconstruction art matched to each vantage, with confidence-styled elements (certain=solid, hypothesis=ethereal).
9. **Implementation difficulty:** Medium–High (integration of known techniques, not research).
10. **Content difficulty:** High per vantage.
11. **Technical failure mode:** alignment jitter/drift → seasickness instead of magic; segmentation failing on dense crowds.
12. **Experience failure mode:** arm fatigue + social awkwardness; guidance friction ("stand exactly here") killing the moment before it starts.
13. **Battery/performance:** significant during use — time-boxed sessions (90–120 s), thermal logging mandatory.
14. **Android implications:** every technique has Android equivalents (MediaPipe/MLKit segmentation, sensor stack) — B2 is the most portable live-camera approach; a key Track E datum.
15. **Success metric:** HPS v0 vs. B1 at the same vantage (the *live-camera premium* is the number we're buying); % of testers achieving alignment unaided in <20 s.
16. **Kill criterion:** if B2 does not beat B1 meaningfully on presence, live-camera 2.5D is not worth its cost — Tier B collapses into B1 (cinematic) and B3 decides the high end.
17. **Architecture informed:** camera pipeline depth, on-device CV requirements, GPU compositing needs — a decisive Track E input; also defines the "calibrated vantage" content type for the Foundry.

---

## X-B3 — True Anchored AR (VPS probe)

1. **Hypothesis:** at flagship stops, world-anchored reconstruction (walk around it, it stays) is achievable with current VPS/anchoring tech at consumer quality — and its presence premium over B2 justifies its constraints.
2. **User experience:** tester raises phone; reconstruction is *anchored in the world* — they walk 10–20 m, viewpoint changes correctly, scale is monumental (Colosseum upper tiers restored above the real ruin).
3. **Technical implementation:** parallel field probes of ARKit Location Anchors (coverage check for Rome), ARCore Geospatial API on iOS (Street-View VPS), Niantic Spatial VPS2 (site scans); RealityKit rendering of a placeholder + one real asset; occlusion via LiDAR/scene depth where available.
4. **Must build:** thin probe apps per provider logging pose stability/accuracy; a field protocol (morning/noon/dusk × weekday/weekend × 3 stops).
5. **Can fake:** the reconstruction asset (a crude massing model answers the anchoring question; beauty comes later); provider abstraction (none needed yet).
6. **Device requirements:** LiDAR iPhone for occlusion arm; non-Pro iPhone as the consumer-reality arm.
7. **Rome required?** **Yes, absolutely** — VPS behavior is location-specific; this cannot be tested anywhere else.
8. **Historical assets:** massing-level model of one Colosseum/Forum element (ledger-reviewed silhouette accuracy only).
9. **Implementation difficulty:** Medium (SDK integration) but high field-logistics cost.
10. **Content difficulty:** Low for the probe; Very High for production-quality anchored assets (Track F prices this).
11. **Technical failure mode:** VPS coverage gaps/instability at exact vantages; drift at monumental scale; tracking loss in crowds.
12. **Experience failure mode:** even when stable — hollow "3D model floating on ruins" with no narrative integration; heat/battery cutting sessions short.
13. **Battery/performance:** worst of all tracks; hard data required.
14. **Android implications:** ARCore Geospatial is Android-native (good); ARKit anchors are not; Niantic is cross-platform — provider choice shapes Android portability directly.
15. **Success metric:** quantitative: anchoring stability (cm drift/min, relocalization success rate) per provider per stop per condition. Experiential (only if stability passes): HPS premium over B2.
16. **Kill criterion:** no provider stable at any flagship stop → true AR deferred (not dead: revisit yearly); B2 becomes the ceiling for camera experiences. Stability without presence premium over B2 → same conclusion, cheaper.
17. **Architecture informed:** the single biggest architecture input — native AR stack depth, Unity-as-library question (Niantic), provider abstraction, Android AR path.

---

## X-B4 — Photoreal Spatial Reconstruction (lost-environment probe)

1. **Hypothesis:** splat/neural techniques can represent a **lost** environment (not a scan of what exists) at photoreal quality renderable on-device — via authored 3D rendered *into* splat/hybrid form.
2. **User experience (target):** a held "window" or anchored moment of the intact Pantheon interior / Forum basilica — photoreal light and material, 20–40 s of awe.
3. **Technical implementation:** pipeline probe, mostly desk work: authored 3D scene (licensed/commissioned) → offline render of a camera path → train splat representation from synthetic views → render via MetalSplatter-class renderer on 2–3 iPhone generations; compare against a plain pre-rendered video of the same scene (the honest cheap alternative).
4. **Must build:** one small scene through that pipeline; fps/thermal benchmark.
5. **Can fake:** scene scope (one bay of the basilica, not the Forum); anchoring (handheld window only — B3 owns anchoring).
6. **Device requirements:** iPhone 13→16 class spread.
7. **Rome required?** No (desk probe). One field ride-along to sanity-check outdoor legibility (screen glare).
8. **Historical assets:** the authored 3D scene — the dominant cost; ledger-reviewed with confidence styling.
9. **Implementation difficulty:** High (novel pipeline integration).
10. **Content difficulty:** Very High per scene.
11. **Technical failure mode:** splat quality collapse from synthetic training views; fps/thermal failure on non-Pro devices.
12. **Experience failure mode:** the pre-rendered video looks just as good in a hand-held frame — meaning the whole pipeline buys nothing unless/until anchored free movement (B3) works.
13. **Battery/performance:** heavy; benchmark is the point.
14. **Android implications:** splat renderers exist for Vulkan/GL but device fragmentation is severe — flagship-only feature territory.
15. **Success metric:** side-by-side blind preference vs. pre-rendered video at equal content; fps ≥30 sustained 60 s on a 2-generation-old device; cost accounting for Track F.
16. **Kill criterion:** if blind preference vs. video is ~indifferent in handheld mode, B4 is shelved until B3-grade anchoring makes free viewpoint movement real (splats only pay when the viewpoint is free).
17. **Architecture informed:** whether a Metal-level rendering module is a requirement or a someday; flagship-device segmentation policy.

---

## X-B5 — Invented option: **"The Lantern"** (La Lanterna)

*A historical-reconstruction interaction neither current ChronoWalk nor the Gate 1 prompt describes.*

**Concept:** the phone becomes a lantern, not a window. The live camera view stays present-day; where the traveler *aims*, a soft beam "illuminates the past" — a bounded circle of reconstruction (torchlight logic) that moves with their aim across the ruins. History is revealed the way a flashlight explores a dark room: locally, actively, curiously. Narration responds to where they linger ("you've found the Rostra — this is where Cicero's hands were displayed").

**Why it may out-perform full-scene replacement:** (a) exploration is agency — presence through *discovery* rather than spectacle; (b) a bounded beam avoids the hardest CV problems (no full-scene alignment; errors at the beam edge are aesthetic, feathered); (c) it dignifies the present — the real ruins stay visible, the past is a layer you *search*, which is philosophically aligned with I1/I2 (the city is the protagonist; hypotheses can literally appear dimmer); (d) it creates a natural link to Track D ("what am I looking at" = where the beam rests).

1. **Hypothesis:** aimed, bounded revelation produces more engagement, longer dwell, and equal-or-better presence than whole-scene reveal (B2), at lower technical risk.
2. **User experience:** raise phone at a guided vantage; a warm beam follows aim; ruins re-complete only inside it; lingering triggers micro-stories.
3. **Technical implementation:** orientation + coarse homography (B2 rung (a)) is *sufficient* because the beam masks alignment error; overlay authored as one large registered reconstruction, revealed through the beam mask; dwell detection via aim stability.
4. **Must build:** rides entirely on X-B2's vantage assets + a beam-mask shader + dwell logic. Marginal cost is small.
5. **Can fake:** micro-story triggering via operator (Wizard-of-Oz).
6. **Device requirements:** same as B2 rung (a) — broad.
7. **Rome required?** Tests alongside X-B2 on the same field days.
8. **Historical assets:** same as B2, plus 4–6 micro-story audio beats per vantage.
9. **Implementation difficulty:** Low–Medium (on top of B2).
10. **Content difficulty:** same art as B2 + micro-beats.
11. **Technical failure mode:** aim jitter making the beam nervous (solvable: smoothing/hysteresis).
12. **Experience failure mode:** feels like a metal-detector game — searching becomes the activity and the history becomes loot (violates I1 if so; the test will show it).
13. **Battery/performance:** ~B2.
14. **Android implications:** as portable as B2 — sensors + shaders only.
15. **Success metric:** dwell time, re-aim exploration counts, HPS vs. B2 at the same vantage, forced choice B2 vs. B5.
16. **Kill criterion:** if testers rate it "fun" but presence (Q1) and comprehension (Q2) trail B2, it's a gimmick — cut without sentiment.
17. **Architecture informed:** none beyond B2 — which is precisely its virtue.

---

## X-AB — Combination cell (the founder's core intuition)

On Phase 2 field days, the best-performing B variant runs **with and without** the best-performing A audio layer at the same vantage. The founder's hypothesis — the breakthrough is the combination — gets its own measured cell rather than an assumption in either direction. Success metric: super-additivity (combined > best single on Q1 and forced choice).
