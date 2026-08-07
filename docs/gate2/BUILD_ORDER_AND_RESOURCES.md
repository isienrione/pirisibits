# Gate 2 — Build Order, Dependency Graph, Resource Plan, First 7 Days

Companion to `GATE2_EXPERIMENT_MATRIX.md` and `ROME_TRIP_GATE.md`. Nothing here is implementation — it is the execution plan awaiting founder GO.

## A. PHASE 0 — start immediately, desk-based (priority order)

| # | Build | Why this order |
|---|---|---|
| 0.1 | **Freeze HPS v0** (founder review of `HPS_V0_FROZEN_INSTRUMENT.md`) | Gates every user-facing cell; zero cost; unblocks nothing else while open. |
| 0.2 | **Claim ledger for flagship Forum stop** | Single upstream dependency of A1 scripts, X-D0, and B1 art brief. First real Foundry-precursor artifact. |
| 0.3 | **X-D0 eval harness** (200-question set + constrained pipeline) | Cheapest kill/pass in the program; pure desk; validates the ledger while it's fresh. |
| 0.4 | **B1 art production** (flagship Forum vantage, layered) | Longest lead time in the program; everything visual (B2, B5, C1, AB) reuses it. Start the art brief the moment the ledger fixes what may be shown. |
| 0.5 | **B1 web player** | Small build; ready to receive art incrementally. |
| 0.6 | **X-B5 Lantern mode on the B1 player** (founder-directed early) | Marginal effort on 0.5; uses rough art drafts deliberately. |
| 0.7 | **A1 scripts + production** (test + control + AI/human voice pair) | Depends only on ledger; audio production runs parallel to art. |
| 0.8 | **A2 scene scaffold** (WoZ-triggerable) | Small; extends A1 content. |
| 0.9 | **B3 probe app** (3 SDK integrations + automatic logging) | No dependency on any other track; longest *engineering* item aimed at the Rome gate. |
| 0.10 | **B2 desk-illusion build** (backplate compositing) | Starts once B1 art has a first composited pass. |
| 0.11 | **X-C1 era layers + stepper** | After B1 player stabilizes; art is rough-grade. |
| 0.12 | **Track F cost ledger** | Opens day 1, logs every asset above. |
| 0.13 | **A3 native spatial-audio prototype** | Starts after A1 stems exist; runs parallel to 0.9–0.11. |

Deferred within Phase 0: Track E spikes (need track winners — late Phase 1), B4 viewer (conditional on B3 attitude; build only if trip capture is planned).

## B. PHASE 1 — remote/local user testing (sequencing)

1. **Wave 1 (one cohort, one stand-in site, 2 sessions/participant):** X-A1 (incl. voice A/B) → X-B5 Lantern vs passive (desk) → X-B1 vs static pair (desk/remote). These are independent; run in the same week.
2. **Wave 2:** X-A2 (with D2 sightline WoZ riding on it) → X-C1 → X-A3 (once native prototype ready).
3. **Wave 3:** Desk version of **X-AB** (leading indicator, using the best rungs so far) → D3 (only if D2 passed) → local D4 dry-run.
4. **Close of Phase 1:** Track E spikes (winners now known) → Rome gate review (`ROME_TRIP_GATE.md`) → GO/NO-GO.

## C. PHASE 2 — Rome field trip 1 (target: 4–5 field days)

**Must already be ready:** every REQUIRED Rome-gate item (see `ROME_TRIP_GATE.md`).

**Stops:** Forum (primary — B2/B5/AB/A3 vantage), Colosseum + Pantheon (B3 second/third anchor stops; audio confirmation).

| Day | Program |
|---|---|
| 1 | Logistics + B3 measurement walks all 3 stops (morning + midday windows); D2 Rome sightline map authoring. |
| 2 | B2 sessions at Forum (n≥4); calibration timing logged; B5 on-site variant with same participants. |
| 3 | B2 continued (n to ≥8) + A3 confirmation cells; B3 repeat walks (crowded window). |
| 4 | **X-AB factorial** at the Forum vantage (n≥8 of the 4-cell protocol); D4 WoZ walks between sessions. |
| 5 | Buffer/weather day; B4 capture ride-along; B3 final walks; +24h follow-ups begin. |

**Data collected:** B3 logs (lock/drift/survival per provider/stop/condition); full HPS packets for B2, B5-on-site, A3, AB; calibration + session-abort operational metrics; D2 map; D4 satisfaction items; cost ledger actuals for the trip; capture footage (B4, future backplates).

## D. PHASE 3 — Rome trip 2 (conditional)
Justified only per the abort/degrade rules in `ROME_TRIP_GATE.md` (≥1 pass or worth-iterating ambiguous among B2/AB/B3). Content: the single pre-declared iteration of any ambiguous cell; B3 re-probe of the surviving provider at remaining stops; D3 field confirmation; anything displaced by weather from Trip 1. Explicitly NOT: new experiment types.

## Dependency graph (challenged for false dependencies)

```
Ledger(0.2) ──► X-D0(0.3)
   │──► A1 scripts(0.7) ──► A2(0.8) ──► A3(0.13) ──► [audio winner]
   │──► B1 art(0.4) ──► B1 player(0.5) ──► B5(0.6)
   │                          │──► C1(0.11)
   │                          └──► B2 desk(0.10) ──► B2 Rome
B3 probe(0.9) ────────────────────────────────────► B3 Rome   (no deps!)
[audio winner] + [visual winner] ──► X-AB desk ──► X-AB Rome
[winners] ──► Track E spikes ──► stack decision (gate close)
D2 rides A2 sessions ──► D3
D4: no dependencies (WoZ only)
Track F: always-on, consumes everything
HPS freeze(0.1) gates ALL user cells (not the builds)
```

Dependencies deliberately removed:
- **Audio ⊬ visual** anywhere (founder correction #1 enforced structurally).
- **B3 depends on nothing** — it must not wait for B1/B2 art or results.
- **B5 does NOT wait for final B1 art** (rough drafts by design, per founder).
- **B1 passing does NOT gate the Rome trip** (see Rome-gate evaluation, criterion 1).
- **Trip is not gated on A3 specifically** — on whichever audio rung survived (criterion 4 amended).

## E. Resource plan — Phase 0 items

| Item | Who/what | ~Hours | Founder-doable? | AI-producible? | Specialist? | Cash |
|---|---|---|---|---|---|---|
| HPS freeze | Founder review | 2 | Yes | Draft done | No | $0 |
| Claim ledger (1 stop) | Founder + AI research w/ source verification | 15–25 | Yes (verification is founder work) | Drafting yes; citations must be human-verified | Optional historian review pass ($200–500) | $0–500 |
| X-D0 harness | AI coding agent | 10–15 | Direct the agent | Yes, mostly | No | <$200 inference |
| B1 art (flagship vantage) | Concept/recon artist + AI-assist | 30–60 art-hrs | No (quality bar) | AI drafts yes; final layered art needs an artist | **Yes — the program's one clear freelance hire** | $1.5–4k |
| B1 player | AI coding agent | 15–25 | Direct + test | Yes | No | $0 |
| B5 Lantern mode | AI coding agent | 8–15 | Direct + tune feel | Yes | No | $0 |
| A1 scripts+production | Founder script pass + AI VO + human VO session | 15–25 | Script yes | VO partially | Human VO ($150–400); optional sound designer | $200–600 |
| A2 scaffold | AI coding agent | 8–12 | Yes | Yes | No | $0 |
| B3 probe app | AI coding agent + founder field-test | 30–50 | Direct; needs device testing discipline | Yes, with founder verifying SDK behavior | Maybe 5–10 h AR-experienced freelancer if SDKs fight back | $0–800 |
| B2 desk illusion | AI agent + possibly graphics freelancer | 25–50 | Partially | Compositing partially | Likely 10–20 h graphics/Unity help | $500–1.5k |
| C1 era layers | Same artist as B1, rough grade | 20–35 art-hrs | No | AI drafts heavily usable at rough grade | Same artist | $0.8–2k |
| A3 native prototype | AI coding agent (native iOS) | 20–35 | Direct; needs AirPods testing | Yes | Audio mix: sound designer 5–10 h ($300–800) | $300–800 |
| Track F ledger | Founder | 1 + ongoing | Yes | Template yes | No | $0 |

**Phase 0 out-of-pocket total: ≈ $3,500–10,500** (dominated by reconstruction art — consistent with the Gate 1 finding that art, not tech, is the cost driver). Rome Trip 1 budgeted separately: flights/lodging/incentives/tickets ≈ $2,500–5,000 for one founder + participant incentives.

Note: native iOS prototypes (A3, possibly B2/B3) require desktop replit.com / Mac+Xcode workflows — flagged now so it doesn't surprise later.

## F. First 7 days (founder + AI agents, freelancers only when necessary)

**Day 1** — *You:* review & freeze HPS v0; pick the flagship Forum vantage (from photos/maps); open Track F ledger. *AI agents:* scaffold X-D0 harness structure; draft the 200-question eval set (incl. adversarial traps) for your pruning. *Produced:* frozen HPS, vantage decision, eval-set draft. *Unlocked:* every user cell now has its instrument; art brief has its subject.
**Day 2** — *You:* build the claim ledger — verify AI-drafted claims against sources (this is founder-judgment work); shortlist 3 reconstruction artists (brief written today). *AI:* draft ledger entries with citations; draft the artist brief from the ledger + vantage. *Produced:* ledger v1 (60–80 claims), artist brief sent. *Unlocked:* D0 can run; A1 scripts and B1 art can start.
**Day 3** — *You:* run X-D0 round 1; grade unsupported claims (spot-check the AI grader). *AI:* constrained + unconstrained pipelines over the eval set; start B1 web player scaffold. *Produced:* first D0 results table. *Unlocked:* possibly the program's first kill/pass — runtime Q&A viability.
**Day 4** — *You:* write A1 test script from the ledger (control script AI-drafted); D0 iteration if needed. *AI:* generate AI-VO takes; B1 player continues; B3 probe app skeleton (SDK #1). *Produced:* A1 scripts, first VO takes, player alpha. *Unlocked:* audio production pipeline proven end-to-end on real ledger content.
**Day 5** — *You:* select artist (calls), commission B1 vantage; book human VO. *AI:* B5 Lantern interaction on the player using placeholder art; B3 SDK #2. *Produced:* art commissioned (the long pole starts), Lantern prototype v0. *Unlocked:* B5 can be feel-tested immediately per your "move Lantern early" directive.
**Day 6** — *You:* feel-test Lantern v0, dictate beam/latency tuning; scout the local stand-in site for Phase 1. *AI:* tune Lantern; A2 WoZ scaffold; B3 SDK #3 + logging harness. *Produced:* Lantern v1, A2 scaffold, B3 skeleton complete. *Unlocked:* Phase 1 venue chosen; B3 ready for local instrumentation walks.
**Day 7** — *You:* run B3's first full local measurement walk (instrumentation shake-down); review week vs plan; write recruitment screener. *AI:* fix logging gaps found on the walk; assemble Phase 1 session kit (forms, scripts, counterbalancing sheets). *Produced:* verified B3 logs, Phase 1 kit v1. *Unlocked:* the hardest Rome-gate item (fully instrumented B3) is now de-risked to iteration, not invention.

End of week 1 state: D0 answered or in final iteration; art commissioned; audio pipeline proven; Lantern testable; B3 instrumented locally. No architecture chosen, everything throwaway.
