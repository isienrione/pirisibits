# Gate 2 — Decision-Grade Experiment Matrix

Every experiment carries the 27 fields from the founder brief. Thresholds reference the frozen HPS v0 instrument (`HPS_V0_FROZEN_INSTRUMENT.md`); "standard HPS thresholds" = Pass ΔHPS ≥ +1.0 & forced choice ≥ 70%; Kill ΔHPS < +0.4 or FC < 55%; Ambiguous = one pre-declared iteration then re-test once, second ambiguous = kill for investment.

Effort scale: S ≤ 2 founder-days, M ≤ 1 founder-week, L ≤ 3 founder-weeks (with AI tooling). Costs are out-of-pocket cash, excluding founder time and the shared Rome trip budget (trip costed once in BUILD_ORDER file).

---

## X-A1 — Narrated audio baseline
1. **ID:** X-A1
2. **Decision unlocked:** Is well-produced *flat* narration already enough to beat existing audio guides — i.e., what is the true audio floor we must exceed?
3. **Hypothesis:** Cinematic scripted narration (single voice, music bed, SFX) at a stop produces ΔHPS ≥ +1.0 vs. a standard audioguide-style track of the same facts.
4. **Control:** Neutral "museum audioguide" version of the same content (same claims, flat delivery, no sound design).
5. **Prototype:** None beyond an audio player page (throwaway web player with position-free playback).
6. **Fake/WoZ:** Everything except the audio itself — playback can be manually triggered by facilitator.
7. **Must be real:** Script quality, voice performance, mix. This is a content test, not a tech test.
8. **Assets:** 1 stop dossier → claim ledger → 2 scripts (test + control), VO (AI voice + one human read for the voice A/B), music/SFX licenses.
9. **Engineering:** ~0. Static player.
10. **Rome required:** No (Phase 1 stand-in site; confirmation pass rides Rome trip).
11. **Sample:** n = 10–12 within-subject, counterbalanced.
12. **Procedure:** Participant stands at stand-in site, hears both versions (order randomized), HPS after each, forced choice, +24h narrative.
13. **Primary metric:** ΔHPS (core).
14. **Secondary:** EW subscale; AI-voice vs human-voice forced choice; +24h narrative score.
15. **HPS used:** Full core + EW focus.
16. **Success:** Standard.
17. **Kill:** Standard. (A kill here means audio quality alone isn't a differentiator → raises the stakes on A2/A3/B-track.)
18. **Ambiguous rule:** Standard (iteration = script/voice redirection only, no new mechanics).
19. **Effort:** S–M (mostly writing/production).
20. **Cash:** $200–600 (VO, music licensing, small participant incentives).
21. **Dependencies:** Claim ledger for the stop (shared with X-D0).
22. **Parallel with:** Everything; shares nothing exclusive.
23. **Tech risk:** None meaningful.
24. **UX risk:** Ceiling effect — good narration may already score high, compressing headroom for A2/A3.
25. **If it fails, we learn:** The floor is high; presence needs mechanics beyond production value — reallocates budget to A2/A3/B.
26. **If passes:** A1 becomes the audio control for all higher rungs; production pipeline validated.
27. **If fails:** Keep A1 as control anyway; deprioritize pure-narration content spend.

## X-A2 — Positional / scene-based audio
1. **ID:** X-A2
2. **Hypothesis-decision:** Does location-triggered scene audio (walking into zones changes the scene) add presence over A1's static narration?
3. **Hypothesis:** A2 ≥ +0.7 ΔHPS over A1 at the same stop, driven by SP subscale.
4. **Control:** X-A1 winner version.
5. **Prototype:** Throwaway mobile web/TestFlight page with GPS-zone or facilitator-triggered scene switching.
6. **Fake/WoZ:** Triggering may be facilitator-driven (WoZ) — precision GPS not required for the presence question.
7. **Must be real:** Scene transitions must be seamless in audio (crossfades, continuity); content per zone real.
8. **Assets:** 3–4 audio scenes for one stop; zone map.
9. **Engineering:** S (trigger scaffold, or none if WoZ).
10. **Rome:** No.
11. **Sample:** Same cohort as A1 where possible (n = 10–12).
12. **Procedure:** Walk-through with scenes vs. standing narration; HPS after each; forced choice.
13. **Primary:** ΔHPS vs A1, SP subscale reported separately.
14. **Secondary:** Dwell time, movement pattern (did people explore?).
15. **HPS:** Core + SP.
16. **Success:** ΔHPS ≥ +0.7 & FC ≥ 65% (lower bar than standard: this is an increment over an already-good rung).
17. **Kill:** ΔHPS < +0.3.
18. **Ambiguous:** Standard rule.
19. **Effort:** M.
20. **Cash:** $200–500.
21. **Deps:** X-A1 assets.
22. **Parallel:** All B/C/D/E/F work.
23. **Tech risk:** Trigger jank breaking continuity (mitigated by WoZ).
24. **UX risk:** People stand still at viewpoints; zones may never trigger.
25. **Fail learning:** Positional structure isn't where audio value lives → simplifies the audio engine requirement massively (Track E implication).
26. **Pass →** A3 justified; positional audio becomes a pack-format requirement.
27. **Fail →** Ship A1-style audio; A3 tested only as head-tracked layer if cheap.

## X-A3 — Spatial / head-tracked audio ("Walking Score" incl. A4 mixing ideas)
1. **ID:** X-A3
2. **Decision:** Does true spatialization (AirPods head-tracking, position/motion-reactive mix) justify its engineering and calibration cost per stop?
3. **Hypothesis:** A3 ≥ +0.7 ΔHPS over the best of A1/A2, with SP1/SP2 specifically elevated (≥ +1.0 on SP subscale).
4. **Control:** Best prior audio rung.
5. **Prototype:** Native iOS throwaway (head-tracked spatial audio requires native APIs — established capability, throwaway build does not violate stack neutrality; recorded as prototype-not-product).
6. **Fake/WoZ:** Position can be WoZ/manual; motion-reactive "Walking Score" can be a facilitator-mixed approximation first.
7. **Must be real:** Head-tracked spatialization itself — that's the thing being tested.
8. **Assets:** Spatialized mix of one flagship scene (object-based stems, not stereo bounce).
9. **Engineering:** M (native audio prototype).
10. **Rome:** Phase 1 no; **Rome confirmation pass required** (real acoustics/crowd noise — Rome-gate item).
11. **Sample:** n = 10–12 local; n = 6–8 Rome ride-along.
12. **Procedure:** Same-stop comparison vs control, including a "turn around / look up" moment authored into the scene.
13. **Primary:** ΔHPS; SP subscale.
14. **Secondary:** Behavioral gaze-up/turn events; battery/thermal notes.
15. **HPS:** Core + SP + AC (does spatial audio *reduce* attention conflict?).
16. **Success:** ΔHPS ≥ +0.7 AND SP-subscale Δ ≥ +1.0.
17. **Kill:** ΔHPS < +0.3 or spatialization indistinguishable in forced choice (< 55%).
18. **Ambiguous:** Standard.
19. **Effort:** M–L.
20. **Cash:** $300–800 (stems production, sound designer hours if needed).
21. **Deps:** A1/A2 outcomes (control selection); stems from A1 content.
22. **Parallel:** B-track fully.
23. **Tech risk:** Head-tracking drift outdoors; per-stop spatial calibration hours (A-12 risk).
24. **UX risk:** Requires AirPods-class hardware — audience constraint.
25. **Fail learning:** Spatialization is polish, not presence → big simplification of audio engine and per-stop cost model (Track F update).
26. **Pass →** Spatial audio enters X-AB cell and the pack format; calibration cost measured for Track F.
27. **Fail →** A2/A1 architecture wins; spatial reserved for flagship stops only or dropped.

## X-B1 — Cinematic Then/Now (interactive layered player)
1. **ID:** X-B1
2. **Decision:** Is a beautifully authored, screen-based then/now reveal (layered 2.5D, authored vantage) enough presence — i.e., what is the visual floor, and is it already a shippable product shape?
3. **Hypothesis:** B1 ≥ +1.0 ΔHPS vs. a static then/now photo pair of the same vantage, with HL subscale ≥ +1.5 (legibility is B1's job).
4. **Control:** Static image pair + caption (the "guidebook" baseline).
5. **Prototype:** Web-based interactive player (scrub/tilt parallax, one flagship Forum vantage in layered depth). Throwaway; also serves X-C1 base.
6. **Fake/WoZ:** Depth layers can be hand-authored (no photogrammetry); "camera" is pre-shot footage/stills, not live.
7. **Must be real:** Art quality of the reconstruction and the transition design — B1 *is* an art test.
8. **Assets:** 1 flagship vantage: current-state capture (licensable footage/photo initially), layered historical reconstruction (concept artist + AI-assisted), transition design.
9. **Engineering:** S–M (web player).
10. **Rome:** No for Phase 1 (tested on-screen anywhere); vantage-accurate on-site check rides Rome trip.
11. **Sample:** n = 10–12.
12. **Procedure:** Desk/remote session; both versions; HPS; forced choice; comprehension quiz (shared with X-C1 protocol).
13. **Primary:** ΔHPS.
14. **Secondary:** HL subscale; comprehension quiz score; replay count.
15. **HPS:** Core + HL emphasis.
16. **Success:** Standard + HL Δ ≥ +1.5.
17. **Kill:** Standard.
18. **Ambiguous:** Standard (iteration = transition/art direction only).
19. **Effort:** M (player) + art (see cash).
20. **Cash:** $1,500–4,000 (reconstruction art for one flagship vantage — deliberately near production quality; this asset is reused by B2, B5, C1, AB).
21. **Deps:** Vantage choice + claim ledger (what may be shown).
22. **Parallel:** All of Track A, D, E, F.
23. **Tech risk:** Minimal.
24. **UX risk:** "Nice postcard" failure — impressive but not present (screen problem identified in Gate 1). NV1-vs-HPS divergence check is critical here.
25. **Fail learning:** Even great authored visuals on a screen don't produce presence → the product thesis moves decisively toward camera-mediated (B2/B3) or audio-led shapes. This is cheap, decisive information.
26. **Pass →** B1 is the shippable visual floor (Tier T-B1 economics live); becomes control for B2.
27. **Fail →** B1 assets still feed B2/B5; product cannot be a "screen player" — raises B2 priority.

## X-B2 — Camera-assisted 2.5D re-completion (Forum)
1. **ID:** X-B2
2. **Decision:** Does live-camera re-completion (reconstruction composited over the live view, crowd/sky pass-through, coarse alignment) produce *materially greater* presence than B1's authored cinematic then/now — while remaining usable outdoors (glare, arms, crowds)?
3. **Hypothesis:** B2 ≥ +1.0 ΔHPS over B1 at the same vantage, driven by SP + TP subscales, with IB (interaction burden) staying ≤ 3.5/7.
4. **Control:** X-B1 at the same vantage.
5. **Prototype:** Native or Unity throwaway: live camera + pre-authored aligned overlay at 1–3 fixed vantages, coarse gyro/compass alignment, manual calibration by facilitator allowed.
6. **Fake/WoZ:** Alignment can be facilitator-calibrated per session; segmentation (crowd pass-through) can be pre-baked masks for fixed vantages; no VPS, no SLAM required.
7. **Must be real:** The live-camera feeling — user's own view being re-completed in real time; outdoor legibility of the screen.
8. **Assets:** B1 reconstruction adapted to live-view compositing for 1–3 Forum vantages; alignment guides.
9. **Engineering:** L (the heaviest Phase 0/1 build).
10. **Rome:** **Yes** for the real test; a local "desk illusion" version (pre-shot backplate standing in for camera) is a Rome-gate requirement first.
11. **Sample:** n = 8–10 on-site (travelers + brought testers).
12. **Procedure:** Same participant experiences B1 (on-screen) then B2 (live) at the same vantage, counterbalanced; HPS after each; IB and AC blocks mandatory; sun/glare conditions logged.
13. **Primary:** ΔHPS (B2 − B1).
14. **Secondary:** IB, AC scores; session-abort rate; calibration time per session.
15. **HPS:** Full instrument.
16. **Success:** ΔHPS ≥ +1.0 AND IB ≤ 3.5 AND completed sessions ≥ 80% under midday conditions.
17. **Kill:** ΔHPS < +0.4, OR IB > 4.5, OR < 60% sessions completable outdoors.
18. **Ambiguous:** Standard; iteration may address ergonomics/glare only, not add tracking tech (that's B3's question).
19. **Effort:** L.
20. **Cash:** $1,000–3,000 beyond B1 assets (compositing work, possibly freelance Unity/graphics help).
21. **Deps:** B1 assets + B1 result (as control); local desk-illusion pass (Rome gate).
22. **Parallel:** Track A fully; X-D0; Track E/F.
23. **Tech risk:** Coarse alignment feels "swimmy" and breaks illusion; outdoor screen legibility.
24. **UX risk:** Arm fatigue / feeling like photographing instead of being present (AC block catches this).
25. **Fail learning:** If B2 ≤ B1, camera mediation adds cost without presence → product converges on B1 cinematic + audio, enormous simplification of the whole roadmap (no AR dependency at all).
26. **Pass →** Category-defining candidate confirmed; B3 decides whether anchoring can remove the fixed-vantage constraint; Tier T-B2 economics activated.
27. **Fail →** B1+A becomes the product spine; B3/B4 deprioritized to yearly re-checks.

## X-B3 — VPS/anchoring infrastructure probe
1. **ID:** X-B3
2. **Decision:** Is world-anchored tracking reliable enough at the exact flagship Rome sites to *depend on* it in the product? **Infrastructure validation, not an experience test** — no HPS.
3. **Hypothesis:** At least one provider achieves lock ≤ 10 s, drift < 0.5 m over 3 min, and ≥ 90% session survival at ≥ 2 of 3 flagship stops across morning/midday/crowded conditions.
4. **Control:** N/A (measurement against absolute engineering thresholds, per provider per stop).
5. **Prototype:** Instrumented probe app: 3 providers (e.g., ARKit GeoAnchors, Google ARCore Geospatial, Niantic Lightship — final list confirmed at build time) behind one logging harness; places a fixed test anchor set and logs continuously.
6. **Fake/WoZ:** Nothing — the entire point is real infrastructure behavior.
7. **Must be real:** Provider SDKs, real stops, real conditions, automatic logging (Rome-gate requirement).
8. **Assets:** Anchor definitions per stop; none artistic.
9. **Engineering:** M–L (3 SDK integrations + logging).
10. **Rome:** **Yes, absolutely** (the defining Rome-only experiment).
11. **Sample:** No participants; ≥ 6 sessions × 3 stops × 3 providers × ≥ 2 condition windows.
12. **Procedure:** Scripted measurement walk per stop; automatic logs (lock time, drift samples, tracking-loss events, thermal/battery); repeated across days of Trip 1.
13. **Primary:** % sessions meeting lock/drift/survival thresholds, per provider per stop.
14. **Secondary:** Battery/thermal; coverage gaps at exact vantages; relocalization time after loss.
15. **HPS:** None.
16. **Success:** Hypothesis thresholds met by ≥ 1 provider at ≥ 2 stops.
17. **Kill:** No provider reaches thresholds at any flagship stop.
18. **Ambiguous:** One provider works at one stop only → anchoring becomes a *flagship-stop-only* capability in the decision tree, not a platform assumption; no re-run needed.
19. **Effort:** M–L.
20. **Cash:** $0–500 (SDK tiers/keys).
21. **Deps:** None on other experiments; must be fully instrumented before trip (Rome gate).
22. **Parallel:** Builds alongside everything; field runs share Trip 1 days.
23. **Tech risk:** This *is* the risk measurement. Meta-risk: provider coverage changes over time → re-probe yearly regardless of outcome.
24. **UX risk:** None (no users).
25. **Fail learning:** Definitive evidence to build the product without anchored AR — kills a whole expensive branch cleanly.
26. **Pass →** B2's fixed-vantage constraint can be lifted in Gate 3 prototypes; splats (B4) become worth testing.
27. **Fail →** B2 fixed-vantage becomes the camera ceiling; B4 killed by dependency; revisit in 12 months.

## X-B4 — Photoreal splat probe
1. **ID:** X-B4
2. **Decision:** Do free-viewpoint photoreal reconstructions (Gaussian splats) create user value *beyond* pre-rendered/constrained-view alternatives — or are they indistinguishable from cheaper video?
3. **Hypothesis (deliberately skeptical):** At a constrained handheld viewpoint, users cannot distinguish splat value: forced choice splat vs. pre-rendered flythrough of the same reconstruction < 65% — i.e., default expectation is NO added value unless free viewpoint is genuinely exercised.
4. **Control:** Pre-rendered video of the same reconstruction, same duration.
5. **Prototype:** Splat viewer (existing OSS viewers acceptable) with one reconstructed scene; A/B against rendered video.
6. **Fake/WoZ:** Scene can be a non-Rome stand-in monument first.
7. **Must be real:** The splat itself and free-viewpoint interaction on a phone.
8. **Assets:** One captured/reconstructed scene (capture rig or purchased dataset).
9. **Engineering:** M.
10. **Rome:** Capture ideally Rome (Trip 1 ride-along); test itself is desk-based.
11. **Sample:** n = 10–12 remote/local.
12. **Procedure:** Both versions, forced choice + HPS-lite (SP, TP, EW); explicitly measure whether participants *move* the viewpoint at all.
13. **Primary:** Forced choice + % participants meaningfully exercising free viewpoint (> 30° translation/orbit).
14. **Secondary:** ΔHPS-lite; device performance.
15. **HPS:** SP/TP/EW subset.
16. **Success (i.e., splats earn investment):** FC ≥ 70% for splat AND ≥ 60% of users exercise free viewpoint AND SP Δ ≥ +0.7. All three required.
17. **Kill:** FC < 65% or free-viewpoint use < 30% — splats deferred entirely.
18. **Ambiguous:** Standard rule, but conditioned on B3: if B3 failed, B4 is auto-killed regardless (no anchoring → no in-situ free viewpoint).
19. **Effort:** M.
20. **Cash:** $500–2,000 (capture or dataset).
21. **Deps:** B3 outcome (for investment decision); capture ride-along on Trip 1.
22. **Parallel:** Everything.
23. **Tech risk:** Mobile splat performance/thermal.
24. **UX risk:** Free viewpoint without purpose = aimless; needs authored reason to move.
25. **Fail learning:** Confirms pre-rendered/2.5D pipeline sufficiency → large permanent cost saving in Track F.
26. **Pass →** Splats enter Tier T-B4 flagship pipeline (Gate 3+), only where B3 anchoring works.
27. **Fail →** Removed from roadmap; yearly re-check note.

## X-B5 — "The Lantern" (aimed reveal metaphor) — MOVED EARLY per founder
1. **ID:** X-B5
2. **Decision:** Does *active aimed discovery* (phone as lantern revealing the past where pointed) create more presence than *passive reveal* of the same content — independent of visual fidelity?
3. **Hypothesis:** Lantern interaction ≥ +0.7 ΔHPS over passive full-reveal of identical (rough) assets, with EW and SP elevated, and IB ≤ 3.5.
4. **Control:** Same assets, passive automatic reveal (B1-style transition).
5. **Prototype:** Gyro-aimed masked-reveal over a pre-shot backplate (desk/local version) — rough B1 assets, low fidelity acceptable *by design*. Phase 1 build; refined on-site variant rides B2's Rome sessions.
6. **Fake/WoZ:** Backplate instead of live camera in Phase 1; alignment approximate; beam mask hand-tuned.
7. **Must be real:** The aiming interaction and its responsiveness (< 100 ms mask latency).
8. **Assets:** Reuses B1 reconstruction layers; beam/mask design.
9. **Engineering:** S–M (marginal on B1 player).
10. **Rome:** No for Phase 1 (this is the founder-directed early test); on-site variant piggybacks Trip 1.
11. **Sample:** n = 10–12.
12. **Procedure:** Within-subject Lantern vs passive reveal, counterbalanced; HPS; forced choice; behavioral: % of scene voluntarily explored, session length.
13. **Primary:** ΔHPS (Lantern − passive).
14. **Secondary:** Voluntary exploration %, replay, IB.
15. **HPS:** Core + EW + IB.
16. **Success:** ΔHPS ≥ +0.7 AND FC ≥ 65% AND IB ≤ 3.5.
17. **Kill:** ΔHPS < +0.3 or IB > 4.5 (aiming is a chore).
18. **Ambiguous:** Standard; iteration limited to beam feel/latency, not content.
19. **Effort:** S–M.
20. **Cash:** ~$0 marginal (rides B1 assets).
21. **Deps:** B1 player + first rough assets (NOT final art — explicitly allowed rough).
22. **Parallel:** Track A, D, E, F; even B2 build.
23. **Tech risk:** Gyro-aim jitter making the beam feel detached.
24. **UX risk:** Novelty confound (highest NV1 risk in the program — second-exposure rule mandatory).
25. **Fail learning:** Interaction metaphors don't beat authored reveals → invest in authorship, not mechanics; simplifies engine needs.
26. **Pass →** Lantern becomes a core interaction candidate; integrated into B2 Rome sessions and X-AB variant; claim-confidence-as-light design begins.
27. **Fail →** Passive authored reveal wins; Lantern archived as flagship garnish at most.

## X-AB — Factorial combination cell (founder hypothesis)
1. **ID:** X-AB
2. **Decision:** Is the breakthrough the *combination* — true synergy beyond additive audio + visual effects?
3. **Hypothesis:** 2×2 factorial at one flagship vantage: cells = Control (plain placard-style info), A-only (best audio rung), B-only (best visual rung), AB (both). Synergy hypothesis: HPS(AB) − HPS(Control) > [HPS(A) − HPS(Control)] + [HPS(B) − HPS(Control)] (super-additive interaction), or at minimum AB ≥ best single + 0.5.
4. **Control:** Plain-info cell (the "current baseline experience" — placard/basic guide text).
5. **Prototype:** Composition of already-built winners; no new tech.
6. **Fake/WoZ:** Whatever was WoZ in the component cells remains WoZ identically across cells (constant).
7. **Must be real:** Identical content claims across all four cells (only the medium varies) — otherwise the comparison is meaningless.
8. **Assets:** Reuses A-track and B-track winning assets at one shared vantage.
9. **Engineering:** S (integration only).
10. **Rome:** Preferred on-site (Trip 1, after component cells); a Phase 1 desk version runs earlier as a leading indicator.
11. **Sample:** n = 12–16 (largest cell count in program; within-subject across 4 cells, Latin-square ordering; fatigue managed with breaks).
12. **Procedure:** 4 cells, randomized order, HPS after each, final ranking + forced choice, +24h narrative.
13. **Primary:** Interaction term: ΔAB vs (ΔA + ΔB).
14. **Secondary:** Which subscale carries the synergy (prediction: TP).
15. **HPS:** Full instrument, all cells.
16. **Success:** Super-additivity ≥ +0.5 beyond additive prediction, or AB ≥ best single + 0.5 with FC ≥ 70% for AB.
17. **Kill (of the synergy thesis, not the product):** AB ≤ best single component + 0.2 → combination is merely additive; product still ships both, but "synergy" stops being the strategic bet.
18. **Ambiguous:** Standard.
19. **Effort:** S.
20. **Cash:** ~$0 marginal + participant incentives.
21. **Deps:** Best-rung outcomes from Track A and Track B (must run after component results).
22. **Parallel:** Nothing upstream of it; scheduling-critical.
23. **Tech risk:** None new.
24. **UX risk:** Session fatigue across 4 cells inflating noise.
25. **Fail learning:** Even "merely additive" tells us to optimize tracks independently — a simpler org and roadmap.
26. **Pass →** The combined experience is the product's spine; Gate 3 prototype = the AB cell productized.
27. **Fail →** Lead with the strongest single track; the other becomes enhancement tier.

## X-C1 — Multi-era comprehension
1. **ID:** X-C1
2. **Decision:** Does multi-era (4 authored eras) beat binary then/now for *legibility* — and is free-scrubbing worse than authored steps?
3. **Hypothesis:** Authored 4-era ≥ +1.0 on HL subscale vs binary; free-scrub ≤ authored (confusion hypothesis).
4. **Control:** Binary then/now (B1).
5. **Prototype:** B1 player extended with era stepper + free-scrub mode.
6. **Fake/WoZ:** Intermediate eras can be lower fidelity than the flagship era.
7. **Must be real:** Historical correctness of each era (ledger-approved).
8. **Assets:** 3 additional era layers for the B1 vantage (rougher grade).
9. **Engineering:** S on top of B1.
10. **Rome:** No.
11. **Sample:** n = 10–12, 3 within-subject cells.
12. **Procedure:** Comprehension quiz is co-primary here (what was this place in era X?); HPS-HL; forced choice.
13. **Primary:** HL subscale + quiz accuracy.
14. **Secondary:** Core HPS; time-in-mode for free-scrub.
15. **HPS:** HL emphasis.
16. **Success:** HL Δ ≥ +1.0 AND quiz Δ ≥ +20 pts vs binary.
17. **Kill:** HL Δ < +0.3 — multi-era becomes flagship-only garnish, huge Track F saving.
18. **Ambiguous:** Standard.
19. **Effort:** M (mostly art).
20. **Cash:** $800–2,000 (extra era layers, rough grade).
21. **Deps:** B1 player + vantage.
22. **Parallel:** A-track, D, E, F.
23. **Tech risk:** None.
24. **UX risk:** Era confusion; scrub as toy.
25. **Fail learning:** Content depth ≠ era count; cost model per stop drops sharply.
26. **Pass →** Multi-era enters pack format & Track F per-tier costs.
27. **Fail →** Binary then/now standard; eras reserved for flagships.

## X-D0 — Ledger-constrained Q&A eval harness
1. **ID:** X-D0
2. **Decision:** Can retrieval-constrained AI answer visitor questions with ZERO unsupported historical claims — the non-negotiable for runtime AI speaking history?
3. **Hypothesis:** Constrained pipeline achieves 0 unsupported claims over a 200-question adversarial eval set, with ≥ 80% useful-answer rate (refusals allowed but scored).
4. **Control:** Same model unconstrained (to quantify what the ledger buys us).
5. **Prototype:** Offline eval harness (notebook-grade): claim ledger for 1 stop, retrieval layer, grader pass + human spot-check.
6. **Fake/WoZ:** No users at all — fully desk-based.
7. **Must be real:** The eval set (including adversarial/trap questions) and grading rigor.
8. **Assets:** Claim ledger for flagship stop (shared with A1/B1); 200-question set.
9. **Engineering:** S–M.
10. **Rome:** No.
11. **Sample:** N/A.
12. **Procedure:** Run both pipelines over the set; blind-grade unsupported-claim count; iterate constrained pipeline max twice.
13. **Primary:** Unsupported claims (must be 0).
14. **Secondary:** Useful-answer %, refusal %, latency.
15. **HPS:** None (TR items later, in D3-era user tests).
16. **Success:** 0 unsupported / ≥ 80% useful.
17. **Kill:** > 2 unsupported after 2 iterations → runtime free-form Q&A is cut from the product (pre-authored Q&A only); this is the pre-declared zero-hallucination kill.
18. **Ambiguous:** 1–2 unsupported: one more iteration + expanded eval set; recurrence = kill.
19. **Effort:** S–M.
20. **Cash:** < $200 (inference).
21. **Deps:** Claim ledger (first real ledger build — also unblocks A1 scripts).
22. **Parallel:** Everything; earliest possible start.
23. **Tech risk:** Grader reliability (mitigate: human spot-check 20%).
24. **UX risk:** None yet.
25. **Fail learning:** Product scope clarity: curated content only — cheaper, still differentiated by rigor.
26. **Pass →** D3 viewpoint-aware narration and in-app Q&A enter Gate 3 scope; "rigor as a feature" marketing thesis validated.
27. **Fail →** Q&A cut; ledger still powers all authored content.

## D2 — Sightline maps (before CV)
1. **ID:** D2
2. **Decision:** Can hand-authored sightline/vantage maps deliver "it knows what I'm looking at" value without computer vision?
3. **Hypothesis:** Facilitator-triggered viewpoint-aware lines (WoZ from a sightline map) rate ≥ 5.5/7 on a "it understood where I was looking" item and lift TR/SP vs generic narration.
4. **Control:** Same content, position-generic delivery.
5. **Prototype:** Sightline map document + WoZ trigger sheet; rides A2/A3 sessions.
6. **Fake/WoZ:** All triggering (that's the point — map validity, not tech).
7. **Must be real:** The sightline map's accuracy at the stand-in site.
8. **Assets:** Sightline map for 1–2 stops.
9. **Engineering:** ~0.
10. **Rome:** Map for Rome stops authored on Trip 1 (ride-along).
11. **Sample:** Shares A-track cohort.
12. **Procedure:** Embedded in audio sessions; two added Likert items + interview probe.
13. **Primary:** "Understood my viewpoint" item ≥ 5.5.
14. **Secondary:** SP/TR deltas.
15. **HPS:** SP + TR + custom item.
16. **Success:** ≥ 5.5 mean and FC preference ≥ 65% vs generic.
17. **Kill:** < 4.5 — viewpoint-awareness not worth pipeline cost.
18. **Ambiguous:** Standard.
19. **Effort:** S.
20. **Cash:** ~$0.
21. **Deps:** A2 sessions to ride on.
22. **Parallel:** Everything.
23. **Tech risk:** None (WoZ).
24. **UX risk:** WoZ over-performs vs what tech can later deliver — record trigger timing precision needed.
25. **Fail learning:** Cuts a whole CV/sightline pipeline from the roadmap.
26. **Pass →** Sightline maps enter pack format; D3 justified.
27. **Fail →** Position-generic narration standard.

## D3 — Viewpoint-aware narration
1. **ID:** D3
2. **Decision:** Does automated viewpoint-aware narration (compass/coarse position + sightline map, no CV) retain the WoZ value from D2?
3. **Hypothesis:** Automated triggering retains ≥ 80% of D2's item score.
4. **Control:** D2 WoZ condition.
5. **Prototype:** Trigger engine on the A2 scaffold using sightline map + heading.
6. **Fake/WoZ:** Nothing (this is the de-WoZ step).
7. **Must be real:** Trigger timing/accuracy.
8. **Assets:** D2 maps.
9. **Engineering:** M.
10. **Rome:** Confirmation on Trip 1 or 2.
11. **Sample:** n = 8–10.
12–18. Procedure/metrics/thresholds mirror D2 with the 80%-retention rule; kill if false-trigger rate > 20% or item < 4.5.
19. **Effort:** M. 20. **Cash:** < $300. 21. **Deps:** D2 pass. 22. **Parallel:** B-track. 23. **Tech risk:** heading noise near ruins (magnetometer). 24. **UX risk:** wrong-trigger trust damage (TR item watch). 25. **Fail learning:** viewpoint-awareness needs CV or dies — priced accordingly. 26. **Pass →** pack-format feature. 27. **Fail →** revert to zone-level triggering (A2).

## D4 — Wizard-of-Oz re-routing / adaptive path
1. **ID:** D4
2. **Decision:** Does adaptive routing (skip crowds, reorder stops, adapt to time budget) matter enough to visitors to justify building it?
3. **Hypothesis:** In WoZ walks, adaptive routing improves overall-tour satisfaction ≥ +1.0 (single 7-pt item) and reduces reported friction vs fixed route.
4. **Control:** Fixed published route, same content.
5. **Prototype:** None — human "router" (facilitator with decision script).
6. **Fake/WoZ:** Everything.
7. **Must be real:** The decision script's rules (they become the spec if it works).
8. **Assets:** Routing decision script.
9. **Engineering:** 0.
10. **Rome:** Best on Trip 1/2 ride-along (real crowds are the point); local dry-run acceptable first.
11. **Sample:** n = 8–10 walks.
12–18. Satisfaction + friction items; success ≥ +1.0; kill < +0.3; standard ambiguity.
19. **Effort:** S. 20. **Cash:** ~$0. 21. **Deps:** None. 22. **Parallel:** Everything. 23. **Tech risk:** none yet. 24. **UX risk:** overriding user intent feels controlling (interview probe). 25. **Fail learning:** static routes fine → simpler product. 26. **Pass →** routing rules enter Gate 3 scope as authored logic (not ML). 27. **Fail →** fixed curated routes.

## Track E — Stack bench probes (RN module tax / pack-format spike / KMP overhead)
1. **ID:** E-1/E-2/E-3
2. **Decision:** Feed the end-of-Gate-2 stack decision with measured, not assumed, numbers.
3. **Hypotheses:** E-1: RN/Expo can host the winning native modules (spatial audio, camera compositing) with < 20% added integration effort vs pure native. E-2: a city-pack format (content spec + runtime) can drive the B1 player and A2 audio scaffold from pure data. E-3: KMP shared core adds < 15% overhead to the throwaway prototypes' logic layer.
4. **Control:** Pure-native equivalents already being built as prototypes.
5. **Prototype:** Three time-boxed spikes (≤ 3 days each), throwaway.
6. **Fake/WoZ:** Everything except the measured integration itself.
7. **Must be real:** The actual winning modules from A/B tracks (spikes run AFTER track winners are known, late Phase 1).
8. **Assets:** None. 9. **Engineering:** M total. 10. **Rome:** No. 11. **Sample:** N/A.
12. **Procedure:** Timed implementation logs + defect notes; identical feature slice per candidate.
13. **Primary:** Integration hours + blocker count.
14. **Secondary:** Perf parity (frame time, audio latency).
15. **HPS:** None.
16. **Success/Kill:** No pass/fail — outputs feed the decision procedure in `docs/gate1/GATE1_DECISION_TREE.md`; a candidate is *eliminated* only if a required capability is impossible or > 2× effort.
18. **Ambiguous:** More spike time is NOT granted; ambiguity recorded as risk against that candidate.
19. **Effort:** M. 20. **Cash:** ~$0. 21. **Deps:** Track A/B winners known. 22. **Parallel:** With X-AB and Rome prep. 23. **Tech risk:** spike results overgeneralized — logged as caveat. 24. **UX risk:** none. 25. **Fail learning:** any hard elimination is pure signal. 26/27. **Next:** stack decision at Gate 2 close, per decision tree.

## Track F — Production economics validation
1. **ID:** F-1
2. **Decision:** Replace Gate 1's estimated cost-per-stop tiers with measured actuals from every asset built in Gate 2.
3. **Hypothesis:** Measured flagship-vantage cost lands within the Gate 1 T-B1/T-B2 bands ($ and hours); calibration hours per spatial-audio stop < 8 h.
4. **Control:** Gate 1 estimates (`docs/gate1/PRODUCTION_ECONOMICS_BY_TIER.md`).
5. **Prototype:** A cost ledger (spreadsheet) — every Gate 2 asset logs hours + cash + rework.
6. **Fake/WoZ:** Nothing. 7. **Must be real:** honest hour tracking, including founder hours.
8–11. N/A / trivial.
12. **Procedure:** Log at asset completion; reconcile at each phase end.
13. **Primary:** $/stop and h/stop per tier, measured.
14. **Secondary:** Rework ratio (art iterations per approved asset).
15. **HPS:** None.
16. **Success:** Within 1.5× of Gate 1 band. 17. **Kill (of a tier):** > 3× band after process learning → tier restricted to flagships or cut. 18. **Ambiguous:** 1.5–3× → one process iteration (templates, AI-assist) then re-measure on next asset.
19. **Effort:** S ongoing. 20. **Cash:** $0. 21. **Deps:** every other track feeds it. 22. **Parallel:** always-on. 23–25. Risk: unlogged founder hours corrupting the model — log discipline is the mitigation. 26/27. Outputs re-price the Gate 1 tier table and the 100-city model.

---

## Cross-cutting notes
- **HPS v0 freeze** precedes ALL user-facing cells (Rome-gate item; see `HPS_V0_FROZEN_INSTRUMENT.md`).
- All prototypes are throwaway; nothing here selects the stack (Track E + decision tree do that at gate close).
- Any experiment may be stopped early only by its pre-declared kill rule — never by enthusiasm for another cell.
