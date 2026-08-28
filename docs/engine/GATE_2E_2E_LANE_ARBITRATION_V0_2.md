# GATE 2E.2E — Lane Arbitration & Route Choice Policy V0.2

**Status:** PASS (parallel, not production)  
**Gate:** 2E.2E  
**Working branch:** `cursor/lane-arbitration-v02-b596`  
**Requested starting checkpoint:** `6907c8d6b984c2162287e58c618f8a573c307455` (not present on this GitHub remote)  
**Actual starting SHA:** `33dd6603263b51eddc228f239a7bfee5b3fb547e` (`origin/cursor/gate2e2a-scoring-tests-453b`, Gate 2E.2A)

This environment’s remote did not contain Gates 2E.2B–2D (H2 composer, ArcQuality V0.2 adapter, B0–B4). Those layers were reconstructed here as **frozen parallel modules** so arbitration can sit on a complete V0.2 stack. **V0.1 composer, search, reranker, and `computeArcQuality` were not modified.** H2 lane weights were not retuned.

Empirical dump: `docs/engine/gate-2e-2e-arbitration-qa.json`

---

## A. Core architecture

```
HARD FEASIBILITY
  → V0.2 SCORING
  → LANE-SPECIFIC SEARCH (H2)
        SIGNATURE / DISCOVERY / FLOW
  → one strong candidate per lane
  → ARCQUALITY V0.2 (adapter; core V0.1 unchanged)
  → LANE-NEUTRAL ARBITRATION
  → recommended route + optional alternatives
```

Namespace: `src/engine/routes/v0.2/arbitration/`

| File | Role |
|---|---|
| `route-arbitrator.v0.2.ts` | Common `RouteChoiceScore`, ranking, presentation |
| `arbitration-config.v0.2.ts` | Centralized hypothesis (weights, priors, thresholds) |
| `route-common-features.v0.2.ts` | Lane-neutral feature vector |
| `lane-prior.v0.2.ts` | Traveler/request prior |
| `choice-confidence.v0.2.ts` | CLEAR / MODERATE / CLOSE_CALL / INSUFFICIENT_EVIDENCE / CONSTRAINT_DOMINATED |
| `route-choice-explanation.v0.2.ts` | Deterministic why-won / why-lost (no LLM) |
| `route-character-labels.v0.2.ts` | User-facing labels from observed character |
| `route-dedup.v0.2.ts` | Near-duplicate suppression |
| `run-choice-policy.v0.2.ts` | H2 + ArcQuality + arbitration entrypoint |
| `score-distribution-audit.v0.2.ts` | ComposerScore / feature distribution diagnostics |

Supporting (frozen, not retuned this gate):

- `src/engine/routes/v0.2/composer/` — H1 unused by arbitration; H2 frozen §K weights
- `src/engine/routes/v0.2/arc-quality/` — adapter `arcQualityVersion = 0.2.hypothesis.1` + B0–B4 **legacy** blends
- `src/engine/routes/v0.2/coverage-blend.ts` — UNKNOWN ≠ 0

---

## B. Do not compare lane ComposerScores directly

Lane-specific `ComposerScore` is **within-lane search quality**, not a universal cross-lane utility.

SIGNATURE, DISCOVERY, and FLOW optimize different objective surfaces (Gate 2E.2C / contract §K weights). Their numerical distributions are not commensurate. They remain diagnostic (`composerScoreIsCrossLaneUtility: false`). They are **excluded** from `RouteChoiceScore`.

ADR: [`docs/engine/decisions/ADR-002-lane-composer-scores-are-not-cross-lane-utilities.md`](decisions/ADR-002-lane-composer-scores-are-not-cross-lane-utilities.md)

---

## C. Common route feature vector

Computed identically for every feasible lane candidate. No lane-specific composer weightings.

| Feature | Range | Notes |
|---|---|---|
| TravelerMatchRoute | 0–100 or UNKNOWN | Complete-route traveler relevance |
| IntrinsicWorthRoute | 0–100 or UNKNOWN | Mean + lower-tail IW |
| RouteMarginalValue | 0–100 or UNKNOWN | Length-normalized MRV + progression − redundancy |
| ArcQuality | 0–100 or UNKNOWN | V0.2 adapter over unchanged V0.1 evaluator |
| PhysicalEfficiency | 0–100 or UNKNOWN | Canonical physical evidence only |
| TimeFit | 0–100 | Budget utilization + overtime |
| StructuralFit | 0–100 or UNKNOWN | Traveler/request-sensitive continuous role fit |
| DiscoveryFit | 0–100 or UNKNOWN | Lane-neutral discovery experience |
| NarrativeCoherence | 0–100 or UNKNOWN | Available narrative evidence; never fabricated |
| RouteCoverageConfidence | 0–1 | Mean of component coverages |
| LanePrior | 0–100 | Modest traveler/request philosophy prior |

---

## D. TravelerMatchRoute formula

Do not blindly average node scores. One high-match POI cannot hide a weak tail.

```
TravelerMatchRoute = blendKnown(
    0.50 × dwellWeightedMeanTM      (weight = max(1, dwellMinutes))
  + 0.25 × lowerTailP20TM           (20th percentile of known stop TM)
  + 0.15 × themeCoverage            (share of themes with traveler weight ≥ 0.3 that appear)
  + 0.10 × (100 − repetitionBurden) (consecutive same structural role)
)
```

Missing TM is UNKNOWN, not 0. Breakdown returns all four terms plus `nStops` / `knownStops`.

---

## E. RouteMarginalValue formula

Do not sum raw MRV (longer routes would automatically win). Mean over sequence-dependent additions (stops after the start):

```
RouteMarginalValue = blendKnown(
    0.70 × qualityWeightedMeanMRV   (weight = max(1, stop TravelerMatch))
  + 0.20 × progressionBonus         (mean newThemeValue of additions)
  + 0.10 × (100 − repetitionBurden) (mean MRV redundancy of additions)
)
```

Single-stop routes → UNKNOWN (no additions).

---

## F. StructuralFit formula

Continuous role fits (no rigid quotas). Per-stop `anchorFit` / `pocketFit` / `microRevealFit` are averaged, then blended with traveler-sensitive weights:

| Key | anchor | pocket | micro |
|---|---|---|---|
| D1 | 0.18 | 0.40 | 0.42 |
| D2 | 0.28 | 0.32 | 0.40 |
| D3 | 0.55 | 0.25 | 0.20 |
| M1 | 0.50 | 0.30 | 0.20 |
| DISCOVERY intent | 0.20 | 0.40 | 0.40 |
| ESSENTIALS intent | 0.55 | 0.25 | 0.20 |
| THEMATIC intent | 0.35 | 0.35 | 0.30 |
| BALANCED | 0.34 | 0.33 | 0.33 |

Posture / M1 override intent when present.

---

## G. DiscoveryFit formula (lane-neutral)

Same formula for all three candidates:

```
DiscoveryFit = blendKnown(
    0.18 × discoveryDensity
  + 0.14 × surprise
  + 0.14 × pocketFit
  + 0.14 × microRevealFit
  + 0.14 × newThemeValue
  + 0.12 × structuralNovelty
  + 0.14 × (100 − redundancy)
)
```

A FLOW-generated route can have the highest DiscoveryFit. User-facing “More discoveries” follows this measurement, not originating lane.

---

## H. PhysicalEfficiency formula

Canonical physical evidence only. Originating lane is ignored.

```
PhysicalEfficiency = blendKnown(
    0.25 × dwellShare                         (dwell / totalEstimatedMin)
  + 0.20 × transitionBurden                   (1 − meanTransition / maxWalkChunk)
  + 0.15 × longestTransition                  (1 − longest / maxWalkChunk)
  + 0.15 × (1 − backtrackingPenalty)
  + 0.15 × geographicProgression              (mean MRV geographicProgression)
  + 0.10 × metroBurden                        (1 − 0.15 × transferCount)
)
```

All terms scaled to 0–100 before blending.

---

## I. ArcQuality

- Adapter only: `arcQualityVersion = 0.2.hypothesis.1`
- Core `src/engine/routes/arc-quality.ts` **unchanged**
- Enters `RouteChoiceScore` at weight **0.20**
- B0–B4 75/25 is **not** production arbitration (see Q)

---

## J. LanePrior formula

Modest traveler/request prior on a 0–100 table (not a forced winner).

```
LanePrior = (1 − 0.35) × postureTable[lane] + 0.35 × intentTable[lane]
```

M1 / express: non-DISCOVERY lanes also average posture with the M1 row before the intent blend.

| Table | SIGNATURE | DISCOVERY | FLOW |
|---|---|---|---|
| BALANCED | 72 | 58 | 68 |
| D1 | 48 | 82 | 62 |
| D2 | 60 | 80 | 58 |
| D3 | 84 | 45 | 58 |
| M1 | 80 | 40 | 78 |
| DISCOVERY intent | 50 | 86 | 60 |
| ESSENTIALS intent | 86 | 42 | 62 |
| THEMATIC intent | 58 | 58 | 58 |

Weight in `RouteChoiceScore` = **0.05**. A 25-point prior gap contributes ~1.3 choice points — enough to break ties, not enough to rescue a clearly inferior route (test 10).

---

## K–L. RouteChoiceScore + initial weights

```
RouteChoiceScore = blendKnown(
    0.30 × TravelerMatchRoute
  + 0.20 × ArcQuality
  + 0.15 × RouteMarginalValue
  + 0.12 × PhysicalEfficiency
  + 0.10 × StructuralFit
  + 0.08 × TimeFit
  + 0.05 × LanePrior
)
```

Personal relevance is the largest common term. ArcQuality improves sequencing but does not dominate personalization. LanePrior guides, does not dictate.

Raw ComposerScore is **not** a cross-lane term.

---

## M. Normalization / UNKNOWN / coverage

- Features are intrinsically 0–100 (or UNKNOWN).
- No fixture-local min-max in production-style arbitration.
- `blendKnown`: drop UNKNOWN terms, renormalize remaining weights. UNKNOWN ≠ 0.
- Coverage of a blend = `knownTermCount / totalTermCount` (not weight-share).
- `routeChoiceCoverage` is that share for the seven RouteChoiceScore terms.
- `RouteCoverageConfidence` is the mean of the eight feature coverages (TM, RMV, AQ, PE, SF, TF, DF, narrative).

---

## N. Choice confidence thresholds

Centralized in `CHOICE_CONFIDENCE_THRESHOLDS`:

| Class | Rule |
|---|---|
| CONSTRAINT_DOMINATED | `uniquePresented ≤ 1` (tight budget ≤ 45 min, or all near-duplicates) |
| INSUFFICIENT_EVIDENCE | coverage < 0.55 |
| CLEAR | margin ≥ 6 **and** coverage ≥ 0.70 |
| CLOSE_CALL | margin < 3 (with enough evidence) |
| MODERATE | margin ≥ 3 **and** coverage ≥ 0.55 |

---

## O–P. Deduplication and user-facing labels

Near-duplicate if **any** of:

- stop-set Jaccard ≥ 0.85
- ordered sequence similarity ≥ 0.80
- edge Jaccard ≥ 0.75
- character similarity ≥ 0.90 **and** stop-set ≥ 0.70

Tight budget (`timeBudgetMin ≤ 45`) → present **one** route (`CONSTRAINT_DOMINATED` / `NO_MEANINGFUL_ALTERNATIVE`).

User-facing labels derive from **observed** character, not originating lane:

- `RECOMMENDED_FOR_YOU` — winner
- `MORE_DISCOVERIES` — highest DiscoveryFit among presented (delta ≥ 3)
- `SMOOTHER_WALK` — highest PhysicalEfficiency
- `MORE_ESSENTIALS` — highest essentiality character

A FLOW candidate with greater measured DiscoveryFit is labeled “More discoveries”. Lane provenance remains a separate field.

---

## Q. B0–B4 reinterpretation

B0–B4 remain as **`LEGACY_CROSS_LANE_BLEND_EXPERIMENT`**.

They compare lane-specific ComposerScore against ArcQuality. Winner distributions from B0–B4 are **not** canonical selection after this gate. They are still emitted on every arbitration result for diagnostics.

---

## R–V / W–AB. Watch-fixture arbitration

### F1 — 60 min BALANCED (first-visitor essentials)

| Lane | stops | Composer | TM | AQ | RMV | PE | SF | DF | TF | Prior | Choice |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **SIGNATURE** | 01-02-18-03 | 76.0 | 79.7 | 49 | 32.4 | 82.6 | 63.6 | 43.5 | 100 | 79.8 | **66.8** |
| DISCOVERY | 01-19-03 | 71.8 | 72.1 | 56 | 45.8 | 82.6 | 64.0 | 55.2 | 100 | 49.6 | 66.5 |
| FLOW | 01-22-16-02 | 78.5 | 66.3 | 57 | 43.1 | 91.4 | 62.2 | 48.6 | 100 | 61.5 | 66.0 |

**Recommended:** SIGNATURE `STGO_01-02-18-03`  
**Confidence:** CLOSE_CALL (margin 0.3)  
**Alts:** DISCOVERY → MORE_DISCOVERIES; FLOW → SMOOTHER_WALK  
**Why:** strongest traveler match for this essentials-first visitor, with defensible physical quality. DISCOVERY has more DiscoveryFit (55.2 vs 43.5) and is shown as an alternative. FLOW’s higher ComposerScore (78.5) does **not** win — that score is within-lane only.

### F2 — 120 min BALANCED

All three lanes produce the same stop sequence `01-22-02-16-18-19-03`. Dedup + no meaningful alternative → **CONSTRAINT_DOMINATED**. Recommended SIGNATURE via LanePrior (79.8 vs 61.5 vs 49.6); common features otherwise identical. Choice 64.1 / 62.6 / 63.2.

### F6 — 120 min T2 culinary

| Lane | stops | Composer | TM | AQ | RMV | PE | DF | Prior | Choice |
|---|---|---|---|---|---|---|---|---|---|
| SIGNATURE | 01-22-20-35-34 | 71.4 | 55.3 | 54 | 65.8 | 85.1 | 58.0 | 59.3 | 63.5 |
| **DISCOVERY** | 01-20-35-34-91 | 69.1 | 61.5 | 60 | 64.1 | 82.5 | 59.9 | 72.3 | **66.7** |
| FLOW | 01-02-16-20-35-34 | 74.2 | 54.0 | 48 | 67.9 | 85.8 | 63.2 | 58.0 | 62.5 |

**Recommended:** DISCOVERY `STGO_01-20-35-34-91`  
**Confidence:** MODERATE (margin 3.2)  
**Why:** “strongest combination of traveler match and physical ease”. Culinary personalization survives: TravelerMatchRoute 61.5 beats SIGNATURE 55.3 and FLOW 54.0 despite FLOW’s higher ComposerScore. FLOW is labeled **MORE_DISCOVERIES** because **measured** DiscoveryFit is higher (63.2 > 59.9). SIGNATURE is MORE_ESSENTIALS.

### F8 — 120 min DISCOVERY (Route Lab label: D1 Flâneur)

**Fixture note:** F8 is labeled “D1 Flâneur” but uses `TRAVELER_FIXTURES.F_discovery_forward` with `discoveryPosture: D2`. Explicit D1 profile QA is reported separately under AC.

| Lane | stops | Composer | TM | AQ | RMV | PE | SF | DF | Prior | Choice |
|---|---|---|---|---|---|---|---|---|---|---|
| SIGNATURE | 01-22-19-18-06-03 | 68.8 | 38.9 | 58 | 74.5 | 79.8 | 57.4 | 68.4 | 56.5 | 60.6 |
| **DISCOVERY** | 01-02-92-19-03-18-06 | 64.9 | 40.1 | 55 | 76.2 | 83.7 | 58.0 | 70.6 | 82.1 | **62.4** |
| FLOW | 01-02-22-19-92-18-03 | 72.3 | 32.3 | 56 | 73.3 | 83.3 | 56.7 | 67.3 | 58.7 | 58.5 |

**Recommended:** DISCOVERY  
**Confidence:** CLOSE_CALL (margin 1.8 vs SIGNATURE)  
FLOW is dropped as a near-duplicate alternative (stop-set overlap).  
**Why:** “strongest combination of discovery value and physical ease”. Highest DiscoveryFit (70.6), slightly higher TM, better PE than SIGNATURE. FLOW has the highest ComposerScore (72.3) and still loses on common utility (TM 32.3). DISCOVERY lane is **not required** to win; here the measured discovery/traveler combination is strongest. LanePrior gap (82.1 vs 56.5) contributes ~1.3 choice points; DISCOVERY still leads without it.

### F9 — 120 min D2 Detective

SIGNATURE and DISCOVERY share the same stops `01-22-16-04-19-18-03`; FLOW is a near-permutation. **CONSTRAINT_DOMINATED**, no fake alternatives. Recommended DISCOVERY via prior (choice 64.6 vs 63.4 vs 62.3). NarrativeCoherence uses ArcQuality thematic/curiosity/question terms; question-resolution is not fabricated as extra value. Coverage remains high because ArcQuality still returns a number — the limitation is **data**, not a fake D2 win.

### F15 — 45 min tight (Express / ESSENTIALS)

| Lane | stops | Composer | TM | AQ | RMV | PE | DF | Prior | Choice |
|---|---|---|---|---|---|---|---|---|---|
| SIGNATURE | 01-22-02 | 78.3 | 69.0 | 48 | 35.5 | 87.0 | 38.6 | 83.4 | 64.6 |
| DISCOVERY | 01-02-16 | 73.5 | 67.6 | 56 | 41.5 | 90.7 | 50.6 | 44.0 | 64.9 |
| **FLOW** | 01-02-16 | 80.4 | 67.6 | 56 | 41.5 | 90.7 | 50.6 | 65.9 | **66.0** |

DISCOVERY and FLOW are the same stop-set. Tight budget ≤ 45 → **one** presented route. **CONSTRAINT_DOMINATED / NO_MEANINGFUL_ALTERNATIVE.** Recommended FLOW.

---

## W. Deduplication

See O. F2/F9 collapse to one presented route. F8 drops FLOW. F15 keeps one route by tight-budget policy even when SIGNATURE’s three-stop set is not a Jaccard-duplicate.

---

## X–AE. Profile QA (120 min, STGO_01 start)

| Profile | Rec lane | DiscoveryFit | Essentiality | PE | TM | Choice |
|---|---|---|---|---|---|---|
| BALANCED | DISCOVERY | 58.5 | 69.2 | 82.1 | 71.2 | 66.3 |
| T1A | DISCOVERY | 58.5 | 68.3 | 84.0 | 68.0 | 65.6 |
| T2 | DISCOVERY | 59.9 | 61.2 | 82.5 | 60.7 | 66.4 |
| T3 | DISCOVERY | 64.0 | 68.5 | 76.4 | 63.1 | 65.2 |
| D1 | DISCOVERY | **70.7** | 63.2 | 84.5 | 32.3 | 60.2 |
| D2 | DISCOVERY | 65.6 | 67.2 | 84.2 | 53.7 | 64.6 |
| D3 | SIGNATURE | 53.9 | **69.2** | 82.1 | 62.7 | 64.2 |
| M1 | SIGNATURE | 58.5 | 69.2 | 82.1 | **76.0** | 68.5 |

Healthy: D1 highest DiscoveryFit; D3/M1 SIGNATURE (essentiality / compact high-value TM); T2 culinary TM path via DISCOVERY. Not optimized for lane equality.

**Recommended-lane distribution (F1–F18 default fixtures):** SIGNATURE 8, DISCOVERY 9, FLOW 1.

---

## Y. B0 0/18 Discovery diagnosis

**Not caused by ArcQuality.** B0 = 100% Composer / 0% ArcQuality is FLOW **18/18**, DISCOVERY **0/18**.

| Hypothesis | Evidence |
|---|---|
| 1. ComposerScore scales are not comparable | **TRUE.** Means 73.1 / 68.6 / 75.7 (spread 7.1) |
| 2. FLOW systematically higher baseline | **TRUE.** Mean 75.7, min 72.3 |
| 3. SIGNATURE higher baseline vs DISCOVERY | **TRUE.** Mean 73.1 vs 68.6 |
| 4. Discovery objective compressed | **TRUE.** Mean 68.6, max 73.5, stdev 2.29 |
| 5. Discovery candidates genuinely worse on common utility | **FALSE as a blanket claim.** After arbitration DISCOVERY wins **9/18**. The 0/18 was a scoring-scale artifact. |
| 6. Fixture bias against discovery | **PARTIAL.** Many BALANCED / ESSENTIALS / M1 fixtures. Explicit D1 and F8 still prefer the stronger measured-discovery route. |

**Do not treat 0/18 as a bug to fix by retuning H2.**

---

## Z. ComposerScore distributions (F1–F18)

| Lane | n | mean | median | stdev | min | max |
|---|---|---|---|---|---|---|
| SIGNATURE | 18 | 73.1 | 73.2 | 2.52 | 68.8 | 78.3 |
| DISCOVERY | 18 | 68.6 | 68.9 | 2.29 | 64.9 | 73.5 |
| FLOW | 18 | 75.7 | 75.6 | 2.02 | 72.3 | 80.4 |

Direct cross-lane comparison is invalid: different objectives, different baselines.

Common-feature means (F1–F18):

| Feature | SIGNATURE | DISCOVERY | FLOW |
|---|---|---|---|
| TravelerMatchRoute | 58.3 | 60.1 | 55.9 |
| ArcQuality | 54.6 | 55.7 | 54.1 |
| RouteMarginalValue | 50.3 | 53.0 | 51.5 |
| PhysicalEfficiency | 82.6 | 82.0 | 83.7 |
| StructuralFit | 60.1 | 60.2 | 60.1 |
| DiscoveryFit | 56.4 | 59.4 | 58.1 |
| TimeFit | 100 | 100 | 100 |

FLOW is slightly more physically efficient on average. DISCOVERY has higher mean DiscoveryFit and RMV. TM is similar. These common-feature gaps are much smaller than the ComposerScore baseline gap — another reason ComposerScore is not a cross-lane utility.

---

## AA–AB. Route Lab + explainability

Route Lab adds **CHOICE POLICY V0.2**: originating lane, user-facing character, common features, RouteChoiceScore, coverage, RECOMMENDED / alternatives, WHY THIS ROUTE WON / WHY THE OTHERS DIDN'T.

Explanations are deterministic templates. No runtime LLM. Discovery-intent / D1 explanations prefer mentioning discovery value; thematic prefers traveler match; M1 prefers physical ease.

---

## AC. Composer freeze

H2 lane weights frozen at contract §K:

| Lane | IW | TM | MRV | TV | PE |
|---|---|---|---|---|---|
| SIGNATURE | 0.25 | 0.25 | 0.20 | 0.15 | 0.15 |
| DISCOVERY | 0.10 | 0.30 | 0.35 | 0.15 | 0.10 |
| FLOW | 0.15 | 0.20 | 0.20 | 0.20 | 0.25 |

No MRV / ArcQuality / semantic data changes for tuning. This gate isolates arbitration.

---

## AD. Tests

`src/lib/__tests__/gate2e2e.laneArbitration.test.ts` covers items 1–21 plus F1–F18 distribution, H1 unused, F6 TM, F9 narrative, labels not hardwired to lane, Route Lab markers.

---

## AE–AQ. Regression

| Surface | Result |
|---|---|
| V0.1 composer/search/reranker | unchanged vs start SHA |
| V0.2 scoring (2E.2A) | additive only |
| ArcQuality core | unchanged (adapter only) |
| physical / narrative graphs | unchanged |
| editorial / curator | unchanged |
| inventory | 104 |
| Launch30 | 30 |
| STGO_33 / STGO_104 | cannot appear in recommended or alternatives |
| secrets | none |

---

## AF–AH. Suspicious behavior / limitations

- F1 is an honest CLOSE_CALL (0.3 pts).
- D1 TravelerMatchRoute is low (~32) because D1 themes (barrios, arte local) are scarce on the civic start cluster. DiscoveryFit still correctly ranks D1.
- F8’s Route Lab **label** says D1 but the traveler fixture is D2. Documented; explicit D1 profile QA is the true D1 probe.
- F2/F9: lanes collapse to identical or near-identical sequences (search, not scoring).
- F15: 45-minute Express — collapse is legitimate.
- Narrative graph still cannot support D2 question-resolution as distinct evidence; do not fabricate it.
- PhysicalEfficiency is often similar across lanes that share geography.
- ArcQuality on short civic walks is often in the 48–60 band; it improves sequencing but does not dominate TM.

---

## AG. Flags

```
ROUTE_ARBITRATION_V0_2_PARALLEL_READY=true
ROUTE_ARBITRATION_V0_2_PRODUCTION=false
ROUTE_COMPOSER_V0_2_PRODUCTION=false
ARCQUALITY_V0_2_PRODUCTION=false
PHYSICAL_ROUTE_GENERATION_ENABLED=false
```

---

## AH. Commit

`feat(engine): add v0.2 route lane arbitration`

**DO NOT PUSH** to `chronowalk3.0`. **DO NOT CUT OVER V0.2.** **DO NOT TUNE H2.** **DO NOT TUNE ARCQUALITY.**
