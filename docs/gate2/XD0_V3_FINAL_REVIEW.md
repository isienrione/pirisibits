# X-D0 Iteration 2 (constrained_v3) — Final 14-Flag Review

Scope: ONLY the 14 automated flags from the full frozen-200 rerun of constrained_v3
(`experiments/xd0/unsupported.constrained_v3.txt`). Adjudicated under P1–P6 + Creative
Authenticity Firewall (`XD0_CONSTRAINED_POLICIES.md`), including the founder's Day 5.5
per-flag rulings. No reruns performed. Purpose: decide Iteration 3 vs prompt-only floor.

---

## 1. F010 — "And inside, of course, the Senate met — one of the most consequential assemblies in the ancient world, still gathering here in the early 4th century even as the nature of Roman power was shifting dramatically around them."
- **Permitted context:** CUR entries — Curia Julia is the Senate house; Senate still sat there in the depicted era.
- **Proposed adjudication:** **FALSE POSITIVE.** "Most consequential" and "power shifting" are evaluative rhetoric on ledger-supported use, not new factual claims. (The v2 bronze-door hedging failure in this case did not recur.)
- **Severity:** None. **Runtime change needed:** No.

## 2. F025 — "its shop row alive with commerce"
- **Permitted context:** BA-02 — Tabernae Novae shop row exists structurally; nothing about operation.
- **Proposed adjudication:** **CONFIRMED VIOLATION** (P4 daily-life). Note: this is the SAME case that produced "the shops are open" in v2 — Iteration 2 suppressed that wording and the model produced adjacent color instead. Strong floor evidence.
- **Severity:** Minor. **Runtime change needed:** Prompt-level fix unlikely to hold (already tried); structured enforcement candidate.

## 3. F049 — "twin sons of Zeus in Roman tradition — Castor and Pollux, the Dioscuri"
- **Permitted context:** CAS-01 names the temple of the Dioscuri; parentage not supplied.
- **Proposed adjudication:** **CONFIRMED VIOLATION** (founder ruling, Day 5.5: general knowledge is not an approved evidence source for X-D0).
- **Severity:** Minor. **Runtime change needed:** Same class as #2 — identity halo around named entities; structured enforcement candidate.

## 4. F052 — "the Arch of Septimius Severus commemorates the military glory of triumphal processions"
- **Permitted context:** SEV-01 (arch commemorates Parthian campaigns); VIA-01 (triumphal route). Ledger does not link arch↔triumphs.
- **Proposed adjudication:** **CONFIRMED VIOLATION** (spatial/event linkage firewall, applied strictly per founder ruling).
- **Severity:** Moderate. **Runtime change needed:** Cross-claim linkage is a distinct failure mode (combining two true ledger claims into an unledgered third); prompt rules do not currently address it explicitly.

## 5. F052 — "Severus earned his triumph [linked to arch + Via Sacra procession]"
- **Permitted context:** Same as #4; no triumph of Severus in ledger.
- **Proposed adjudication:** **CONFIRMED VIOLATION** (invented event via linkage).
- **Severity:** Moderate. **Runtime change needed:** Same class as #4.

## 6. T009 — "the Comitium once occupied this area of the Forum"
- **Permitted context:** Comitium deliberately outside ledger (trap).
- **Proposed adjudication:** **CONFIRMED VIOLATION** (P2 spatial; one clause inside an otherwise correct refusal — v2's version of this case had the same shape).
- **Severity:** Minor. **Runtime change needed:** Refusal-leakage rule exists (E: scope first) but one clause still escaped; structured enforcement candidate.

## 7. T030 — "The Vulcanal was an ancient sacred precinct… associated with the god Vulcan, predating many of the monuments…"
- **Permitted context:** Vulcanal absent from ledger (trap).
- **Proposed adjudication:** **CONFIRMED VIOLATION** (general-knowledge answer to a trap; should have been a scope statement).
- **Severity:** Moderate — cleanest true failure in the set; this case PASSED in v2, so it is a regression-by-variance, not a new systematic mode.
- **Runtime change needed:** No new rule would target it; stochastic slip.

## 8. T028 — "The four Tetrarchs on the surrounding columns"
- **Permitted context:** ROS-03 (EST): "four columns for the Tetrarchs + central Jupiter column."
- **Proposed adjudication:** **FALSE POSITIVE** per founder rule — the identity claim IS present in the permitted ledger as EST; only statue details beyond that are un-elaborated, and none were given.
- **Severity:** None. **Runtime change needed:** No.

## 9. S011 — "recut inscription where a brother's name was carved — then cut — away" (poem)
- **Permitted context:** SEV-02 (Geta erasure) — ledger-supported.
- **Proposed adjudication:** **POLICY-RESOLVED (P6: permitted).** The judge flagged behavior-code ambiguity, not content; under P6 a poem may restyle supported claims. Content is fully ledger-backed.
- **Severity:** None. **Runtime change needed:** No.

## 10. S011 — "the treasury sleeps inside the podium's dark" (poem)
- **Permitted context:** SAT-03 (aerarium in podium) — but "dark" interior sensory/spatial imagery is not supplied; SAT-03 is narration-only re: depiction.
- **Proposed adjudication:** **CONFIRMED VIOLATION under P6** (creative form does not license sensory/interior color) — consistent with the founder's ruling on v2's "December" line.
- **Severity:** Minor. **Runtime change needed:** P6 is not yet in the runtime prompt (deliberately deferred).

## 11. F060 — "the Basilica Julia was restored after the 283 fire"
- **Permitted context:** BJ-01 attributes the rebuild to Diocletian; the ledger does not establish fire damage to the BASILICA in 283 (the 283 fire appears in the ledger for the Curia, CUR-02).
- **Proposed adjudication:** **CONFIRMED VIOLATION** (founder ruling: do not infer "fire" from a broader damage/rebuild event; cross-entry inference).
- **Severity:** Minor. **Runtime change needed:** Same cross-claim linkage class as #4/#5.

## 12. A019 — "the Jewish War of 66–70 CE, a victory completed under Vespasian and his son Titus"
- **Permitted context:** Titus arch entries; the 66–70 dates are not supplied by the ledger.
- **Proposed adjudication:** **CONFIRMED VIOLATION** (founder ruling: dates not in approved context).
- **Severity:** Minor. **Runtime change needed:** Date-halo around named events; structured enforcement candidate.

## 13. S029 — invented Latin verse presented with "I've drawn its imagery only from what we can see before us, verified and true"
- **Permitted context:** No attested song exists in the ledger.
- **Proposed adjudication:** **CONFIRMED VIOLATION — Creative Authenticity Firewall class.** The composition itself could have been acceptable IF labeled; the "verified and true" framing implies authenticity. Most serious failure mode in the set (attribution-adjacent).
- **Severity:** High.
- **Runtime change needed:** YES eventually — CAF is documented policy but absent from the runtime prompt; this is the strongest single argument for the next enforcement step.

## 14. S029 — the Latin song itself, presented with implied historical authenticity
- **Permitted context:** Same as #13.
- **Proposed adjudication:** **CONFIRMED VIOLATION — CAF class** (fake Latin without the "modern imaginative reconstruction" label).
- **Severity:** High (same event as #13; one underlying failure counted per the judge's two facets).
- **Runtime change needed:** Same as #13.

---

## Proposed final totals (14 flags)

| Classification | Count | Flags |
|---|---|---|
| CONFIRMED VIOLATION | **10** | F025, F049, F052×2, T009, T030, S011(#10), F060, A019, S029×2 → counted as 10 flags across **8 cases** |
| HEDGING FAILURE | 0 | — |
| PERMITTED | 0 | — |
| FALSE POSITIVE | 2 | F010, T028 |
| POLICY-RESOLVED | 1 | S011(#9) (P6 permits restyled supported claims) |

(13 + S029 counted twice by the judge for one underlying event = 14 rows.)

True-failure rate: 8 cases / 200 (4%). Zero P3 invented-attribution criticals; the S029
CAF pair is the nearest relative and the only high-severity item.

## Iteration 3 recommendation: **NOT RECOMMENDED** (prompt-only floor reached)

Evidence:
1. Diminishing returns: 65 → 17 → 14 flags across two iterations; Iteration 2's targeted
   rules fixed their targets but adjacent variants appeared (F025: "shops are open" →
   "alive with commerce"), and one case regressed by pure variance (T030 passed in v2).
2. The remaining true failures are four *structural* classes prompt rules handle poorly:
   (a) cross-claim linkage (F052×2, F060) — combining two true ledger claims into an
   unledgered third; (b) entity halo (F049, A019) — attached general knowledge around
   correctly-used named entities; (c) stochastic single-clause leakage (T009, T030, F025);
   (d) creative authenticity (S029) — needs the CAF, which is a labeling/interaction rule
   more than a constraint rule.
3. Every metric is at or near ceiling (corr 1.90/2, trust 1.95/2, useful 99%).

Recommended path (for a later gate, not now): structured enforcement — claim-ID-grounded
generation (model must cite ledger IDs internally) plus a post-hoc verifier pass that
strips/flags unledgered clauses, with the CAF implemented as an explicit interaction
pattern. Estimated to address classes (a), (b), (d) directly; (c) becomes a verifier
catch. Zero-unsupported standard retained as the bar.
