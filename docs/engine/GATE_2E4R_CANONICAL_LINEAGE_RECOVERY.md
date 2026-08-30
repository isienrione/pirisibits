# Gate 2E.4R — Canonical Lineage Recovery

**Status:** **STOP — `MISSING_LOCAL_HISTORY`**  
**Date:** 2026-08-30  
**Branch inspected:** `cursor/gate-2e4-experience-time-model-d85a`  
**Current tip:** `ef5304b4`  
**Incorrect 2E.4 base:** `c56b2bcc`  
**Required canonical base:** `d8f7d6c2` — **NOT RECOVERABLE in this environment**

---

## 1. Old incorrect 2E.4 base

| Field | Value |
|---|---|
| 2E.4 commit | `ef5304b4` — `feat(engine): add parallel experience-time model` |
| Parent / base | `c56b2bcc` — `feat(engine): add v0.2 route lane arbitration` |
| Remote tip equivalent | `origin/cursor/lane-arbitration-v02-b596` |
| What `c56b2bcc` is | Gate **2E.2E** lane arbitration V0.2 (parallel), **before** Gates 2E.2E.1 / 2E.3 / 2E.3.1 / 2E.3.2 |

Proven ancestry of `ef5304b4`:

```
ef5304b4  feat(engine): add parallel experience-time model   ← Gate 2E.4 (this tip)
c56b2bcc  feat(engine): add v0.2 route lane arbitration      ← Gate 2E.2E
33dd6603  Add Gate 2E.2A parallel scoring V0.2 engine modules
346b416f  Add Gate 2E.2A parallel scoring V0.2 test suite
…
```

---

## 2. Expected recent lineage (not present)

Intended chain:

```
29270b67  Gate 2E.2E.1 arbitration correctness
→ d4d7f6c1  Gate 2E.3 Founder Route Inspection Lab
→ 3da1d8bd  Gate 2E.3.1 Scenario Identity & Request-Integrity QA
→ d722f434  Gate 2E.3.2 initial time diagnostics
→ d8f7d6c2  Gate 2E.3.2 final diagnostics (enriched candidate-generation)
→ (2E.4 should start here)
```

---

## 3. Recovery search — evidence

### Per-SHA availability

| SHA | Local object | Reflog | Branch | Tag | Worktree | `git fsck` dangling | `git fetch origin <sha>` | GitHub API commit |
|---|---|---|---|---|---|---|---|---|
| `29270b67` | **N** | **N** | **N** | **N** | **N** | **N** | fatal: couldn't find remote ref | HTTP 422 No commit found |
| `d4d7f6c1` | **N** | **N** | **N** | **N** | **N** | **N** | fatal | HTTP 422 |
| `3da1d8bd` | **N** | **N** | **N** | **N** | **N** | **N** | fatal | HTTP 422 |
| `d722f434` | **N** | **N** | **N** | **N** | **N** | **N** | fatal | HTTP 422 |
| `d8f7d6c2` | **N** | **N** | **N** | **N** | **N** | **N** | fatal | HTTP 422 |

### Other searches performed

- `git log --all --decorate --oneline` — no matching SHAs; no commit messages for Founder Route Inspection Lab / Scenario Identity / time diagnostics / candidateGenerationStatus
- `git reflog --all` — only shows clone → lane-arbitration checkout → 2E.4 commit; no 2E.3.x SHAs
- `git branch -a` / `git tag` / `git worktree list` — no `gate-2e3*` / `time-diagnostics` branches; single worktree at `/workspace`
- `.git/refs` / `.git/logs` — no refs pointing at missing SHAs
- `git fsck --full` / `--unreachable` / `--lost-found` — no dangling commits containing those SHAs
- Message grep across `--all` for founder inspection / scenario identity / marginal diagnostics / arbitration correctness — **no hits** for 2E.3.x gates
- Accessible Cursor cloud agents for this principal — **no** agent branch/tip exposing `d8f7d6c2` or sibling SHAs; GitHub has no commit objects for those prefixes

**Conclusion:** The 2E.2E.1–2E.3.2 commits were never pushed to `origin` and are not present as local objects in this VM. They cannot be recovered from this environment without an external source (another machine’s reflog/worktree, backup, or explicit object transfer).

---

## 4. Feature-preservation audit (tree proof on `ef5304b4`)

Capabilities **absent** from `ef5304b4` ancestry (symbol/path grep = 0 unless noted):

| Capability | Gate | Evidence on `ef5304b4` |
|---|---|---|
| Arbitration correctness fixes (2E.2E.1) | 2E.2E.1 | No commit `29270b67`; no follow-on correctness patch atop `c56b2bcc` |
| Founder Review mode | 2E.3 | `FOUNDER_ROUTE_REVIEW_LAB` matches=0; `founderReview.ts` ABSENT |
| R1–R8 review scenarios | 2E.3 | No founder review scenario matrix in tree |
| Request fingerprints / scenario identity | 2E.3.1 | `scenarioIdentity.ts` ABSENT; `scenarioIdentityFingerprint` matches=0 |
| R1 time ledger | 2E.3.2 | `timeLedger.ts` ABSENT; `buildR1TimeLedger` matches=0 |
| Marginal insertion diagnostics | 2E.3.2 | `marginalInsertion.ts` ABSENT; `computeMarginalInsertion` matches=0 |
| `candidateGenerationStatus` / WHY NOT THIS POI? enrichment | 2E.3.2 | `candidateGenerationStatus` matches=0 |

Capabilities **present** on `ef5304b4` (2E.4 content only):

| Capability | Evidence |
|---|---|
| Experience-Time Model V0.1 parallel | `src/engine/routes/experience-time/*` |
| Flags | `EXPERIENCE_TIME_MODEL_V0_1_PARALLEL_READY=true`, `…_PRODUCTION=false`, `PHYSICAL_ROUTE_GENERATION_ENABLED=false` |
| STGO_18 Edificio Ariztía | engine node canonical/display corrected |
| STGO_59 Club de la Unión | retained |
| STGO_105 Teatro Municipal de Santiago | extension; coords null; `IDENTITY_RESOLVED_PHYSICAL_PENDING` |
| Inventory 105 | `canonicalInventory.total=105` |

---

## 5. Recovered canonical base

**None.** Required starting SHA `d8f7d6c2` is unavailable.

---

## 6. Transplant method

**Not executed.** Per Gate 2E.4R §E: do not silently reconstruct missing gates from memory.

Preferred path (blocked):

1. `cursor/gate-2e4r-canonical-lineage-d85a` from `d8f7d6c2`
2. `git cherry-pick ef5304b4`
3. Preserve both 2E.3.x diagnostics and 2E.4 experience-time/identity

---

## 7. Conflicts

N/A — transplant not attempted.

---

## 8. Final ancestry

Unchanged incorrect lineage:

```
… → 33dd6603 → c56b2bcc → ef5304b4
```

Expected (missing):

```
… → c56b2bcc → 29270b67 → d4d7f6c1 → 3da1d8bd → d722f434 → d8f7d6c2 → <2E.4 transplant>
```

---

## 9. Final flags (current tip only)

```
EXPERIENCE_TIME_MODEL_V0_1_PARALLEL_READY=true
EXPERIENCE_TIME_MODEL_V0_1_PRODUCTION=false
PHYSICAL_ROUTE_GENERATION_ENABLED=false
```

---

## 10. Decision

**STOP with `MISSING_LOCAL_HISTORY`.**

Next recovery requires an external source of the missing objects (e.g. the original cloud agent disks that produced 2E.2E.1–2E.3.2, if retained, or a push of those commits from the machine that still has them). Do not recreate those gates from memory in this step.
