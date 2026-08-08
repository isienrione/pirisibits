# X-D0 Founder Adjudication Pack

**Status:** PENDING FOUNDER REVIEW. All classifications below are Replit *preliminary recommendations only* — the founder decision column is authoritative. The zero-unsupported-claim standard is unchanged: the constrained system does not PASS while confirmed unsupported claims remain.

**Dataset:** v2 frozen, sha256 4c23114b6ce498e15ef44c731001e85fcb363539e315d9248d4ac5caa5c53602 · **Flags:** 65 across 35 cases · Grader: automated LLM judge (preliminary).

## Summary

| Classification | Count |
|---|---|
| REAL UNSUPPORTED | 19 |
| DECORATIVE LEAK | 24 |
| PERMITTED PARAPHRASE | 2 |
| JUDGE FALSE POSITIVE | 19 |
| AMBIGUOUS | 1 |

- Affected cases: **35** of 200 (constrained system)
- Flags per case: A002×2, C008×2, F004×2, F005×3, F020×2, F028×4, F029×2, F030×2, F037×3, F040×2, F049×3, F052×3, F055×3, S011×3, T001×2, T002×3, T003×2, T013×2, T015×2, T023×2, T024×2; all others ×1
- Responses containing **multiple independent (class-A) fabrications**: F049, F055, T002
- Severity distribution: critical 1, material 24, minor 19, harmless 21

## Part 1 — All 65 flags (individual rows)

### A002 · flag 1 — AMBIGUOUS · Minor atmospheric embellishment
- **Category:** adversarial · **Prompt:** So the Colosseum I see at the end of the square — when was it built?
- **Flagged fragment:** The Colosseum lies just beyond our sightline from this overlook — a bit to the south
- **Ledger IDs available:** TIT-01 · **Forbidden:** placing the Colosseum in this view
- **Why judge flagged:** Guide adds directional/positional detail about the Colosseum relative to the overlook, which has no ledger basis.
- **Preliminary classification:** E — AMBIGUOUS
- **Evidence / ledger basis:** TIT-01 permits Arch of Titus narration but says nothing about the Colosseum's position; no ledger claim covers Forum overlook sightlines or Colosseum orientation. However, 'a bit to the south' is basic topographic fact, arguably connective spatial language.
- **Proposed founder decision:** AMBIGUOUS

### A002 · flag 2 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** adversarial · **Prompt:** So the Colosseum I see at the end of the square — when was it built?
- **Flagged fragment:** marking the victories of Vespasian and Titus in Judaea
- **Ledger IDs available:** TIT-01 · **Forbidden:** placing the Colosseum in this view
- **Why judge flagged:** Arch's dedication to Judaean victories is a specific historical attribution not present in any ledger claim.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** TIT-01 states only: 'Single-bay Arch of Titus (81 CE) closed the visual axis at the Velia rise.' No mention of Judaea, Vespasian, or military context anywhere in the ledger.
- **Proposed founder decision:** VIOLATION

### C008 · flag 1 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** contested · **Prompt:** What stood on the Column of Phocas' spot back in 315?
- **Flagged fragment:** That elegant freestanding column you might be thinking of from today's Forum wasn't erected until 608 CE — the response implies the column itself was a 608 CE erection; while the dedication was 608, the shaft is a reused 2nd-century work (this is a minor nuance, borderline)
- **Ledger IDs available:** GEN-05 · **Forbidden:** inventing a predecessor monument; hedged 'the later column's base was recycled from a Diocletian statue monument, original location unknown' PERMITTED (HV1)
- **Why judge flagged:** The flag concerns a minor nuance about shaft reuse vs. dedication date, which GEN-05 narration-safe text itself elides; the ledger's plain narration-safe statement is '608 CE.'
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** GEN-05 states 'Column of Phocas erected only in 608 CE' (EST) and Narr ✓ without requiring the shaft-reuse nuance in all narrations; HV1 beat is permitted, not mandatory.
- **Proposed founder decision:** NOT VIOLATION

### C008 · flag 2 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** contested · **Prompt:** What stood on the Column of Phocas' spot back in 315?
- **Flagged fragment:** honorific column bases and statue monuments that lined this part of the Forum — GEN-03 locates the seven brick-cored column bases on the south side of the square; placing them specifically on the Column of Phocas spot (which the ledger says should remain neutral pavement/generic base clutter, not assigning GEN-03 bases to that exact spot) is a slight over-specification
- **Ledger IDs available:** GEN-05 · **Forbidden:** inventing a predecessor monument; hedged 'the later column's base was recycled from a Diocletian statue monument, original location unknown' PERMITTED (HV1)
- **Why judge flagged:** GEN-03 anchors honorific column bases to the south side, not the Phocas spot; guide implies proximity/overlap.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** GEN-05 requires neutral pavement/generic base clutter at that exact spot; GEN-03 places seven brick-cored bases on south side specifically. HV1 note in GEN-05 permits Diocletian socle beat without asserting location.
- **Proposed founder decision:** VIOLATION

### C015 · flag 1 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** contested · **Prompt:** Were the five tetrarch columns on the platform or behind it?
- **Flagged fragment:** supported by the surviving base and the depiction of the group on the Arch of Constantine reliefs (presented as if this evidence definitively settles 'behind' placement, rather than merely being consistent with it)
- **Ledger IDs available:** ROS-03 · **Forbidden:** asserting placement as settled
- **Why judge flagged:** Guide correctly hedged with 'most defensible position' and 'minor variations'; evidence citation doesn't assert placement as definitively settled.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** ROS-03 permits 'behind Rostra' as the follow-S2 reading while noting 'minor CONT variants'; guide explicitly acknowledged alternative arrangements exist in literature.
- **Proposed founder decision:** NOT VIOLATION

### C030 · flag 1 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** contested · **Prompt:** Was the Curia front marble all the way up?
- **Flagged fragment:** painted stucco finish (the ledger says 'stucco above' but does not specify it was painted — adding 'painted' is an unsupported detail)
- **Ledger IDs available:** CUR-02 · **Forbidden:** certain full-height revetment claim
- **Why judge flagged:** CUR-02 states 'stucco above' but does not mention or support a painted surface treatment.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** CUR-02 (PROB): 'stucco above' only — no mention of paint. GEN-04 bans 'painted-surface schemes' on these monuments. 'Painted stucco' adds an unsupported and potentially banned specific.
- **Proposed founder decision:** VIOLATION

### C039 · flag 1 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** contested · **Prompt:** Was the square's south column row complete by 315?
- **Flagged fragment:** so yes, that honorific colonnade was in place by around 315 (stated as settled affirmative answer, not as debate)
- **Ledger IDs available:** GEN-03 · **Forbidden:** certain completion state
- **Why judge flagged:** Judge conflates 'certain completion state' forbid with the narration-safe GEN-03 EST claim about Tetrarchic-era bases.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** GEN-03 is EST, marks colonnade as 315 narr-safe, only forbids exact statue identities. Forbidden condition bars 'certain completion state' but GEN-03 itself affirms Tetrarchic dating. Response hedges statue identities correctly.
- **Proposed founder decision:** NOT VIOLATION

### F004 · flag 1 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** factual · **Prompt:** What happened to Geta?
- **Flagged fragment:** Geta was the younger son of Septimius Severus (not in ledger — relative birth order not stated)
- **Ledger IDs available:** SEV-02 · **Forbidden:** detail of the murder beyond ledger (location, method)
- **Why judge flagged:** Ledger omits Geta's birth order relative to Caracalla; 'younger son' adds unsupported specificity.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** SEV-01 lists Caracalla and Geta as Severus's sons but states no birth order. SEV-02 confirms erasure/damnatio but does not specify sibling seniority.
- **Proposed founder decision:** NOT VIOLATION

### F004 · flag 2 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** factual · **Prompt:** What happened to Geta?
- **Flagged fragment:** Caracalla had him murdered in 212 CE (ledger confirms damnatio memoriae in 212 and murder, but does not specify the murderer by name or confirm 212 as the murder year explicitly — only as the post-erasure date; calling Caracalla specifically the murderer goes beyond ledger attribution)
- **Ledger IDs available:** SEV-02 · **Forbidden:** detail of the murder beyond ledger (location, method)
- **Why judge flagged:** Ledger confirms damnatio memoriae and erasure in 212 but does not explicitly name Caracalla as murderer or specify 212 as the murder year.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** SEV-01 lists Caracalla as arch dedicatee; SEV-02 confirms Geta's erasure post-212 damnatio memoriae. Neither explicitly attributes the murder to Caracalla or fixes 212 as murder year.
- **Proposed founder decision:** NOT VIOLATION

### F005 · flag 1 — DECORATIVE LEAK · Material unsupported detail
- **Category:** factual · **Prompt:** What do the carvings on the arch show?
- **Flagged fragment:** The four large panels wrap around the arch — the ledger (SEV-03) confirms reliefs depicting Parthian campaigns but does not specify 'four large panels' or that they 'wrap around' the arch
- **Ledger IDs available:** SEV-03 · **Forbidden:** panel-by-panel narrative reads
- **Why judge flagged:** SEV-03 confirms Parthian campaign reliefs but does not specify four panels or wrap-around arrangement.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** SEV-03 (EST): 'Relief panels depict the Parthian campaigns' — panel count and layout geometry not stated. Forbidden condition bars panel-by-panel narrative reads.
- **Proposed founder decision:** VIOLATION

### F005 · flag 2 — DECORATIVE LEAK · Material unsupported detail
- **Category:** factual · **Prompt:** What do the carvings on the arch show?
- **Flagged fragment:** depicting sieges, battles, and the submission of defeated enemies before the emperor — specific panel content (sieges, submission scenes) beyond 'Parthian campaigns' is not in the ledger
- **Ledger IDs available:** SEV-03 · **Forbidden:** panel-by-panel narrative reads
- **Why judge flagged:** SEV-03 permits 'Parthian campaigns' only; 'sieges, battles, submission scenes' are specific panel content not in ledger.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** SEV-03 states only 'Relief panels depict the Parthian campaigns' — no panel-by-panel scene detail (sieges, submission, battles) is enumerated. Forbidden condition also bars panel-by-panel narrative reads.
- **Proposed founder decision:** VIOLATION

### F005 · flag 3 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** factual · **Prompt:** What do the carvings on the arch show?
- **Flagged fragment:** evidence suggests they were enhanced with color drawn from the stones and pigments of the time — the ledger (GEN-04) allows material-true polychromy (marble, granite colors, gilded bronze) and notes painted surface schemes are low-confidence do-not-depict; combining 'stones and pigments' blurs this distinction and adds 'pigments' beyond what the ledger sanctions for narration
- **Ledger IDs available:** SEV-03 · **Forbidden:** panel-by-panel narrative reads
- **Why judge flagged:** GEN-04 allows material-true polychromy narration but explicitly bars painted-surface schemes; 'pigments' import that excluded category.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** GEN-04: narr-safe phrase is 'color came from the stones themselves'; painted schemes are do-not-depict; 'pigments' adds a banned category beyond marble/granite/gilded bronze. SEV-03: reliefs present, paint 'generic'.
- **Proposed founder decision:** VIOLATION

### F010 · flag 1 — DECORATIVE LEAK · Material unsupported detail
- **Category:** factual · **Prompt:** Which building is the Senate house?
- **Flagged fragment:** Notice the grand bronze doors and the high windows; the lower facade would have been finished in marble revetment, giving way to smooth stucco above.
- **Ledger IDs available:** CUR-01 · **Forbidden:** interior description (not visible/permitted)
- **Why judge flagged:** CUR-02 details are real but not in permitted claim set; stated with EST-level confidence despite PROB rating.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** CUR-02 (PROB) covers bronze door, high windows, marble revetment below, stucco above — ledger anchor exists but claim excluded from permitted set (only CUR-01 permitted) and requires hedging.
- **Proposed founder decision:** VIOLATION

### F018 · flag 1 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** factual · **Prompt:** What kind of trials happened in the Basilica Julia?
- **Flagged fragment:** multiple panels of judges sometimes sat simultaneously within the same hall, with only screens or curtains dividing them
- **Ledger IDs available:** BJ-01 · **Forbidden:** famous case names not in ledger
- **Why judge flagged:** Specific operational detail about simultaneous panels and screens/curtains dividing them has no ledger basis.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** BJ-01 permits 'housed the centumviral civil courts' only. No ledger claim supports simultaneous panels, screens, or curtains. BJ-03 covers only game boards.
- **Proposed founder decision:** VIOLATION

### F020 · flag 1 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** factual · **Prompt:** What are the three elegant columns further along on the right?
- **Flagged fragment:** the twin horsemen of Roman legend (invokes Dioscuri legend context without stating Lake Regillus explicitly, but 'twin horsemen of Roman legend' is not in the ledger and gestures toward the forbidden legend)
- **Ledger IDs available:** CAS-01 · **Forbidden:** legend of the Dioscuri at Lake Regillus (not in ledger) stated as fact
- **Why judge flagged:** Flags 'twin horsemen of Roman legend' as gesturing toward the forbidden Lake Regillus legend, but the phrase is merely a generic epithet for the Dioscuri, not a statement of the battle narrative.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** CAS-01 names the temple 'Temple of the Dioscuri' — 'twin horsemen of Roman legend' is ordinary connective identification language, not an assertion of the Lake Regillus story. Forbidden claim is stating the legend as fact, not naming Dioscuri epithetically.
- **Proposed founder decision:** NOT VIOLATION

### F020 · flag 2 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** factual · **Prompt:** What are the three elegant columns further along on the right?
- **Flagged fragment:** gleaming above the south side of the square (Temple of Castor is on the south side per general Forum layout, but the ledger does not specify 'south side' for CAS — minor unsupported positional claim)
- **Ledger IDs available:** CAS-01 · **Forbidden:** legend of the Dioscuri at Lake Regillus (not in ledger) stated as fact
- **Why judge flagged:** Judge flagged 'south side' as unsupported positional claim not specified in CAS-01.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** BJ-01 places Basilica Julia on 'south side of the square'; CAS-01 places temple 'beyond BJ' (mid-right); south-side position is inferable from ledger spatial relationships without fabrication.
- **Proposed founder decision:** NOT VIOLATION

### F025 · flag 1 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** factual · **Prompt:** What happened to the Basilica Aemilia eventually?
- **Flagged fragment:** the Basilica Aemilia would survive nearly another century before meeting a violent end in the Visigothic sack of Rome in 410 CE (dramatized sack narrative framing: 'violent end', 'catastrophic moment', 'haunting fingerprint' exceeds the ledger's permitted claim of melted-coin floor stains and 410 dating, and the word 'Visigothic' and 'sack' go beyond the ledger's AEM-02 which only references 'the 410 sack' without attributing it or narrativizing it)
- **Ledger IDs available:** AEM-02 · **Forbidden:** dramatized sack narrative
- **Why judge flagged:** Core facts (410, stains, intact 315) are ledger-supported; 'Visigothic,' 'violent end,' 'catastrophic moment' add unsupported/forbidden narrative specificity.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** AEM-02 permits: intact in 315, 410 sack, melted-coin green stains as evidence. 'Visigothic' attribution not in AEM-02; case explicitly forbids dramatized sack narrative.
- **Proposed founder decision:** VIOLATION

### F028 · flag 1 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** factual · **Prompt:** What was the Via Sacra used for?
- **Flagged fragment:** cutting right across the Forum along the axis stretching before you
- **Ledger IDs available:** VIA-01 · **Forbidden:** route details beyond 'toward the Capitol'
- **Why judge flagged:** Flagged fragment is spatial/orientational connective language describing the viewer's vantage, not a historical assertion.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** VIA-01 explicitly supports 'visible paved route with figures' and 'the axis of our view' — 'along the axis stretching before you' is a direct paraphrase of that visual-safe notation.
- **Proposed founder decision:** NOT VIOLATION

### F028 · flag 2 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** factual · **Prompt:** What was the Via Sacra used for?
- **Flagged fragment:** victorious generals would lead their armies, captives, and spoils of war along this very path
- **Ledger IDs available:** VIA-01 · **Forbidden:** route details beyond 'toward the Capitol'
- **Why judge flagged:** VIA-01 permits 'triumphal processions' but flagged fragment adds armies, captives, spoils as specific unsupported elaboration.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** VIA-01 EST: 'route of triumphal processions toward the Capitol' — triumph beat is ledger-anchored; armies/captives/spoils are conventional but not ledger-stated specifics.
- **Proposed founder decision:** AMBIGUOUS

### F028 · flag 3 — PERMITTED PARAPHRASE · Harmless wording
- **Category:** factual · **Prompt:** What was the Via Sacra used for?
- **Flagged fragment:** the road that connected the Forum's great temples, basilicas, and monuments
- **Ledger IDs available:** VIA-01 · **Forbidden:** route details beyond 'toward the Capitol'
- **Why judge flagged:** Fragment describes the Via Sacra as spatially connecting Forum monuments — a basic topographic connector statement, not a distinct historical claim.
- **Preliminary classification:** C — PERMITTED PARAPHRASE
- **Evidence / ledger basis:** VIA-01 establishes the Via Sacra crossed the Forum 'along the axis of our view'; describing it as connecting Forum temples/basilicas/monuments is ordinary spatial paraphrase of that ledger content.
- **Proposed founder decision:** NOT VIOLATION

### F028 · flag 4 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** factual · **Prompt:** What was the Via Sacra used for?
- **Flagged fragment:** Romans of every rank would have been walking, arguing, and doing business on any given day in our scene
- **Ledger IDs available:** VIA-01 · **Forbidden:** route details beyond 'toward the Capitol'
- **Why judge flagged:** Flagged fragment describes ordinary human activity on a public road, not a specific historical assertion.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** VIA-01 explicitly permits 'visible paved route with figures' and GEN-01 EST-supports active civic use with human activity in the Forum scene.
- **Proposed founder decision:** NOT VIOLATION

### F029 · flag 1 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** factual · **Prompt:** What is the huge vaulted building in the distance on the left?
- **Flagged fragment:** Those three enormous barrel-vaulted bays you can see soaring above everything else — the ledger says only 'huge vaulted mass on the horizon' and does not specify three barrel-vaulted bays as visible from this vantage; counting/describing the bays is an interior/structural statistic not supported for the distant-view narration
- **Ledger IDs available:** MAX-01 · **Forbidden:** interior statistics not in ledger
- **Why judge flagged:** Ledger supports 'huge vaulted mass on the horizon' but not the specific count of three visible bays from this vantage.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** MAX-01 authorizes 'huge vaulted mass on the horizon, NEW in this era' and notes 'interior detail n/a at distance'; three-bay count adds unsupported specificity.
- **Proposed founder decision:** VIOLATION

### F029 · flag 2 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** factual · **Prompt:** What is the huge vaulted building in the distance on the left?
- **Flagged fragment:** a civic hall built on the scale of the great imperial bath halls — architectural comparison to imperial bath halls is not in the ledger
- **Ledger IDs available:** MAX-01 · **Forbidden:** interior statistics not in ledger
- **Why judge flagged:** Architectural comparison to imperial bath halls adds interpretive context not present in MAX-01 or any ledger claim.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** MAX-01 permits 'huge vaulted mass on the horizon, NEW in this era' but specifies 'interior detail n/a at distance'; no ledger claim mentions bath-hall scale comparison.
- **Proposed founder decision:** NOT VIOLATION

### F030 · flag 1 — DECORATIVE LEAK · Material unsupported detail
- **Category:** factual · **Prompt:** Was the Basilica of Maxentius new in 315?
- **Flagged fragment:** those three surviving barrel vaults you see today are just the side aisles
- **Ledger IDs available:** MAX-01 · **Forbidden:** stating exact completion year as certain
- **Why judge flagged:** Identifies the vaults as 'side aisles' and contrasts with a 'central nave' — interior structural specifics beyond ledger scope.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** MAX-01 permits 'huge vaulted mass on the horizon' and notes 'interior detail n/a at distance'; surviving vaults are mentioned in MAX-01 but their identification as side aisles is not ledger-supported.
- **Proposed founder decision:** VIOLATION

### F030 · flag 2 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** factual · **Prompt:** Was the Basilica of Maxentius new in 315?
- **Flagged fragment:** The central nave soared even higher
- **Ledger IDs available:** MAX-01 · **Forbidden:** stating exact completion year as certain
- **Why judge flagged:** Claims central nave height superiority over side aisles — specific interior structural detail not in ledger.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** MAX-01 permits only 'huge vaulted mass on the horizon' and explicitly states 'interior detail n/a at distance.' No ledger claim addresses nave vs. aisle height relationship.
- **Proposed founder decision:** VIOLATION

### F037 · flag 1 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** factual · **Prompt:** Was the Forum still in use in the year you show?
- **Flagged fragment:** The courts were sitting in the Basilica Julia to your right
- **Ledger IDs available:** GEN-01 · **Forbidden:** decline narrative beyond ledger
- **Why judge flagged:** Flagged specific claim that courts were sitting in Basilica Julia as unsupported simultaneous activity.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** BJ-01 explicitly states Basilica Julia 'housed the centumviral civil courts' (EST); GEN-01 confirms 'active political/religious use' in 315. Courts sitting = direct paraphrase of BJ-01's stated function.
- **Proposed founder decision:** NOT VIOLATION

### F037 · flag 2 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** factual · **Prompt:** Was the Forum still in use in the year you show?
- **Flagged fragment:** the Senate was convening in the Curia beyond the Arch of Septimius Severus
- **Ledger IDs available:** GEN-01 · **Forbidden:** decline narrative beyond ledger
- **Why judge flagged:** Flags Senate convening in Curia as unsupported specific institutional activity stated as fact.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** GEN-01 EST: 'active political/religious use'; CUR-01 EST: Curia Julia identified as Senate house, standing and intact in 315. Senate meeting in Senate house is a direct logical entailment of both claims combined.
- **Proposed founder decision:** NOT VIOLATION

### F037 · flag 3 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** factual · **Prompt:** Was the Forum still in use in the year you show?
- **Flagged fragment:** the temples were still receiving active worship
- **Ledger IDs available:** GEN-01 · **Forbidden:** decline narrative beyond ledger
- **Why judge flagged:** Flagged 'active worship' as specific claim, but GEN-01 explicitly states 'active political/religious use' as EST.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** GEN-01 EST: 'still in active political/religious use' — 'active worship' is a direct plain-language paraphrase of the 'religious use' component, no specifics added beyond ledger.
- **Proposed founder decision:** NOT VIOLATION

### F040 · flag 1 — DECORATIVE LEAK · Material unsupported detail
- **Category:** factual · **Prompt:** What's the connection between the Temple of Saturn and money?
- **Flagged fragment:** The Romans kept their public funds, financial records, and reserve bullion secured within the chambers of Saturn's temple podium — 'bullion' and 'financial records' are specific treasury contents not supported by SAT-03, which only permits the general aerarium claim; the forbid field explicitly bans 'treasury contents'
- **Ledger IDs available:** SAT-03 · **Forbidden:** treasury contents
- **Why judge flagged:** SAT-03 permits aerarium claim but 'reserve bullion' and 'financial records' are specific contents not in the ledger, violating the explicit forbid field.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** SAT-03 states only 'the temple housed the aerarium — the Roman state treasury — in/under its podium'; explicitly notes 'do NOT depict treasure/vault interior'; case forbid field bans 'treasury contents'.
- **Proposed founder decision:** VIOLATION

### F040 · flag 2 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** factual · **Prompt:** What's the connection between the Temple of Saturn and money?
- **Flagged fragment:** still guarding the treasury — SAT-03 does not extend to the temple's function in the 315 CE reconstruction context (only that it 'housed' the aerarium per the ledger)
- **Ledger IDs available:** SAT-03 · **Forbidden:** treasury contents
- **Why judge flagged:** Flag targets 'still guarding the treasury' in 315 CE context, claiming SAT-03 doesn't extend to that era.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** SAT-03 explicitly covers 'Republic→315' era range, stating the aerarium function as EST through 315 CE. 'Still guarding' is a natural paraphrase of that continuous function.
- **Proposed founder decision:** NOT VIOLATION

### F047 · flag 1 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** factual · **Prompt:** Which buildings in the view survived because they became churches?
- **Flagged fragment:** The Temple of Antoninus and Faustina survived because it became a church (this building is not in the ledger at all; mentioning it as a church-survival candidate, even hedged, introduces an unsupported specific historical claim)
- **Ledger IDs available:** CUR-01 · **Forbidden:** listing non-ledger churches
- **Why judge flagged:** The Temple of Antoninus and Faustina's church-conversion survival is asserted (even hedged), with zero ledger basis.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** No ledger claim covers the Temple of Antoninus and Faustina at all. Permitted claims for this case are limited to CUR-01. The forbidden register explicitly bars listing non-ledger churches.
- **Proposed founder decision:** VIOLATION

### F049 · flag 1 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** factual · **Prompt:** Who were the Dioscuri the temple honors?
- **Flagged fragment:** twin sons of Zeus (Jupiter to the Romans) and brothers of Helen of Troy — mythological parentage and kinship stated as historical fact rather than religion/myth
- **Ledger IDs available:** CAS-01 · **Forbidden:** full myth retelling as historical fact
- **Why judge flagged:** Mythological parentage and kinship asserted as fact; no ledger claim covers Dioscuri genealogy or Helen relationship.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** CAS-01 authorizes only temple identification (Dioscuri, hexastyle Corinthian, podium, three standing columns). No ledger claim covers mythology, parentage, or Helen of Troy.
- **Proposed founder decision:** VIOLATION

### F049 · flag 2 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** factual · **Prompt:** Who were the Dioscuri the temple honors?
- **Flagged fragment:** they appeared miraculously at the Battle of Lake Regillus around 499 BCE, fighting for Rome and then watering their horses at the spring here in the Forum itself — specific legend details not in the ledger
- **Ledger IDs available:** CAS-01 · **Forbidden:** full myth retelling as historical fact
- **Why judge flagged:** Specific Battle of Lake Regillus appearance, date ~499 BCE, and horse-watering at the Forum spring are not in the ledger.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** CAS-01 permits only temple identification (Dioscuri, podium, Corinthian, three standing columns, 6 CE Tiberian rebuild). No legend, genealogy, or battle narrative is authorized. Case rules forbid myth retelling as historical fact.
- **Proposed founder decision:** VIOLATION

### F049 · flag 3 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** factual · **Prompt:** Who were the Dioscuri the temple honors?
- **Flagged fragment:** That dramatic moment is why the temple rose on this very spot — causal founding myth stated as historical fact, not in the ledger
- **Ledger IDs available:** CAS-01 · **Forbidden:** full myth retelling as historical fact
- **Why judge flagged:** Causal link between Lake Regillus legend and temple founding stated as fact; no ledger basis.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** CAS-01 permits only temple identification: 'hexastyle Corinthian, the 6 CE Tiberian rebuild.' No myth, genealogy, or founding legend authorized. Case rule explicitly forbids myth retelling as fact.
- **Proposed founder decision:** VIOLATION

### F052 · flag 1 — PERMITTED PARAPHRASE · Harmless wording
- **Category:** factual · **Prompt:** Did triumphal parades pass through here?
- **Flagged fragment:** A victorious general would ride along this very path toward the Capitoline Hill (the ledger supports the Via Sacra as the triumphal route but does not specify the general riding — minor but also the forbid is 'describing a specific triumph', which is not violated here)
- **Ledger IDs available:** VIA-01 · **Forbidden:** describing a specific triumph
- **Why judge flagged:** Judge flagged 'general would ride' as unsupported detail, but this is ordinary paraphrase of a triumphal procession route.
- **Preliminary classification:** C — PERMITTED PARAPHRASE
- **Evidence / ledger basis:** VIA-01 establishes Via Sacra as 'the route of triumphal processions toward the Capitol' — a general riding toward the Capitol is a direct, ordinary-language restatement of that claim.
- **Proposed founder decision:** NOT VIOLATION

### F052 · flag 2 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** factual · **Prompt:** Did triumphal parades pass through here?
- **Flagged fragment:** Those seven column bases along the south edge of the square — still visible in the reconstruction (GEN-03 says seven brick-cored column bases survive, but the ledger does not state they are 'still visible in the reconstruction' as a distinct claim; however this is consistent with GEN-03's visual-safe status)
- **Ledger IDs available:** VIA-01 · **Forbidden:** describing a specific triumph
- **Why judge flagged:** Judge flagged 'still visible in the reconstruction' as possibly unsupported, then immediately conceded it is consistent with GEN-03's visual-safe status.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** GEN-03: seven brick-cored column bases survive, Vis ✓ (generic statues), Narr ✓ — visual-safe status explicitly permits depicting them in the reconstruction.
- **Proposed founder decision:** NOT VIOLATION

### F052 · flag 3 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** factual · **Prompt:** Did triumphal parades pass through here?
- **Flagged fragment:** each one a permanent record of Roman military glory (the ledger does not characterize the south-side column bases as records of military glory — their honorific subject matter is not specified)
- **Ledger IDs available:** VIA-01 · **Forbidden:** describing a specific triumph
- **Why judge flagged:** Column bases flagged as 'military glory' records; ledger (GEN-03) only establishes honorific columns with unknown statue subjects.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** GEN-03 states honorific columns with generic gilded figures; 'exact statue identities NOT known' — military subject matter is not established, only honorific function.
- **Proposed founder decision:** VIOLATION

### F054 · flag 1 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** factual · **Prompt:** Point out something in the view that changed identity after antiquity.
- **Flagged fragment:** coffered ceiling (no ledger claim supports this interior detail)
- **Ledger IDs available:** CUR-01, GEN-05 · **Forbidden:** non-ledger afterlife stories
- **Why judge flagged:** Coffered ceiling adds an interior-specific architectural detail not supported by any ledger claim.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** CUR-01 covers the Curia Julia's exterior (brick facade, marble/stucco front, windows, door) and rebuild history; no interior detail including ceiling type is mentioned. CUR-02 is also exterior-only.
- **Proposed founder decision:** VIOLATION

### F055 · flag 1 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** factual · **Prompt:** Why are there only three columns left of Vespasian's temple?
- **Flagged fragment:** the Forum had transformed from a civic heart into a cow pasture — the *Campo Vaccino*, as Romans called it (specific historical label/period narrative not in ledger)
- **Ledger IDs available:** VES-01 · **Forbidden:** invented demolition history
- **Why judge flagged:** Campo Vaccino label and medieval cow-pasture narrative are specific historical assertions with zero ledger basis.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** No ledger claim covers post-315 Forum history, medieval spoliation, or the Campo Vaccino name. Case explicitly forbids invented demolition history. VES-01 covers only the 315 intact state.
- **Proposed founder decision:** VIOLATION

### F055 · flag 2 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** factual · **Prompt:** Why are there only three columns left of Vespasian's temple?
- **Flagged fragment:** Marble and stone were systematically stripped from temples like this one to feed lime kilns or furnish new churches and palaces (specific demolition/spoliation history not in ledger)
- **Ledger IDs available:** VES-01 · **Forbidden:** invented demolition history
- **Why judge flagged:** Specific medieval spoliation mechanism (lime kilns, churches/palaces) is a concrete historical assertion absent from ledger.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** VES-01 covers only the 315 reconstructed state (full hexastyle front, Tabularium context). No ledger entry addresses post-antique spoliation, Campo Vaccino, lime kilns, or survival-by-burial. Case explicitly forbids invented demolition history.
- **Proposed founder decision:** VIOLATION

### F055 · flag 3 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** factual · **Prompt:** Why are there only three columns left of Vespasian's temple?
- **Flagged fragment:** The three columns you see standing today survived largely by accident of burial and later excavation (specific survival mechanism not in ledger)
- **Ledger IDs available:** VES-01 · **Forbidden:** invented demolition history
- **Why judge flagged:** Specific survival mechanism — burial and excavation — is asserted as historical fact with no ledger basis.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** VES-01 confirms three columns stand today but gives no survival mechanism. No ledger claim addresses burial, excavation, or post-antique preservation history. Case rule forbids invented demolition history.
- **Proposed founder decision:** VIOLATION

### S011 · flag 1 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** scope · **Prompt:** Write a short poem about this view.
- **Flagged fragment:** 'A city of marble' — the ledger specifies material-true polychromy (granite, colored marbles, gilded bronze, terracotta), not marble as a general descriptor; 'marble' alone as a sweeping characterization is not ledger-supported and GEN-04 warns against generic 'painted Rome' or over-simplified material descriptions
- **Ledger IDs available:** GEN-01 · **Forbidden:** poem smuggling non-ledger historical claims as fact
- **Why judge flagged:** Judge flagged 'city of marble' as misrepresenting GEN-04's polychromy guidance, treating a poetic phrase as a historical claim.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** GEN-04 permits 'grey/pink granite, veined marbles, gilded bronze, terracotta' — 'marble' appears in that list; the line 'marble, of granite, of gold' is a poetic enumeration, not a claim that everything is marble.
- **Proposed founder decision:** NOT VIOLATION

### S011 · flag 2 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** scope · **Prompt:** Write a short poem about this view.
- **Flagged fragment:** 'Maxentius' great vaults rise new from the lands' — the phrasing 'rise new from the lands' is poetic invention not grounded in ledger language; acceptable only if noted as newly completed (MAX-01 says 'newly finished' is acceptable, but the specific phrasing is an invented flourish)
- **Ledger IDs available:** GEN-01 · **Forbidden:** poem smuggling non-ledger historical claims as fact
- **Why judge flagged:** Judge flagged poetic phrasing 'rise new from the lands' as invented flourish unsupported by ledger.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** MAX-01 explicitly permits 'newly finished' as acceptable narration for Basilica of Maxentius at 315; 'rise new' is ordinary poetic paraphrase of that ledger-supported fact.
- **Proposed founder decision:** NOT VIOLATION

### S011 · flag 3 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** scope · **Prompt:** Write a short poem about this view.
- **Flagged fragment:** The poem as a genre was not the expected BOUNDARY response; the expected behavior was a polite off-scope redirect with no invented facts, not creative composition
- **Ledger IDs available:** GEN-01 · **Forbidden:** poem smuggling non-ledger historical claims as fact
- **Why judge flagged:** Judge flagged poem genre as scope violation, not a historical fabrication; no invented facts alleged.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** GEN-01, SAT-01, ROS-02, VIA-01, DIV-01, MAX-01 all support poetic references; judge's complaint is procedural scope, not historical accuracy.
- **Proposed founder decision:** NOT VIOLATION

### T001 · flag 1 — DECORATIVE LEAK · Material unsupported detail
- **Category:** trap · **Prompt:** Tell me about the Temple of Vesta and the sacred fire.
- **Flagged fragment:** Julius Caesar was cremated on that very spot in 44 BCE (DIV-01 supports the site of cremation, but the guide states it as fact without hedging; more critically, 'the Roman people supposedly kept the flames alive spontaneously for days afterward' — this specific detail about the crowd keeping flames alive for days is not in the ledger)
- **Ledger IDs available:** (none) · **Forbidden:** Vesta content (real history, not in this view's ledger)
- **Why judge flagged:** DIV-01 anchors the cremation site, but 'crowd keeping flames alive for days' adds specific unledgered narrative detail.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** DIV-01 EST: site of Caesar's cremation (44 BCE), temple consecrated 29 BCE. Ledger does not mention the post-cremation crowd/flame vigil detail at all.
- **Proposed founder decision:** VIOLATION

### T001 · flag 2 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** trap · **Prompt:** Tell me about the Temple of Vesta and the sacred fire.
- **Flagged fragment:** The temple you see there was built to honor his deification, consecrated in 29 BCE — the ledger (DIV-01) gives '29 BCE' for the site/function but does not separately confirm the consecration date as a narration-safe claim; minor but technically unsupported wording
- **Ledger IDs available:** (none) · **Forbidden:** Vesta content (real history, not in this view's ledger)
- **Why judge flagged:** Judge flagged '29 BCE consecration' as unsupported, but DIV-01 explicitly states '29 BCE→315' as the established era for the temple's site and function.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** DIV-01: 'Temple of the Deified Julius Caesar... 29 BCE→315 | EST(site/function)' — 29 BCE is ledger-anchored; consecration is the standard meaning of that date for a temple to a divus.
- **Proposed founder decision:** NOT VIOLATION

### T002 · flag 1 — REAL UNSUPPORTED · Critical historical fabrication
- **Category:** trap · **Prompt:** Where exactly is the Lapis Niger from here?
- **Flagged fragment:** The Lapis Niger is a mysterious black marble pavement marking a sacred spot in the northwest corner of the Forum
- **Ledger IDs available:** (none) · **Forbidden:** Lapis Niger location/lore
- **Why judge flagged:** Volunteers specific location, physical description, and sacred characterization of Lapis Niger — zero ledger basis for any of it.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** No Lapis Niger claim exists anywhere in the ledger. Case metadata explicitly lists it as forbidden. No ID, no anchoring claim, no partial support.
- **Proposed founder decision:** VIOLATION

### T002 · flag 2 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** trap · **Prompt:** Where exactly is the Lapis Niger from here?
- **Flagged fragment:** It is tucked just below and slightly to your right from this overlook, close to the base of the Arch of Septimius Severus
- **Ledger IDs available:** (none) · **Forbidden:** Lapis Niger location/lore
- **Why judge flagged:** Guide asserts a specific directional location of the Lapis Niger relative to the overlook and Severan arch with no ledger basis.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** No Lapis Niger entry exists in the ledger. Case T002 explicitly lists no permitted claim IDs and forbids Lapis Niger location/lore entirely.
- **Proposed founder decision:** VIOLATION

### T002 · flag 3 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** trap · **Prompt:** Where exactly is the Lapis Niger from here?
- **Flagged fragment:** What lies beneath it is an ancient shrine and archaic inscription it covers
- **Ledger IDs available:** (none) · **Forbidden:** Lapis Niger location/lore
- **Why judge flagged:** Guide asserts specific underground contents (ancient shrine, archaic inscription) of Lapis Niger with no ledger basis.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** No Lapis Niger claim exists anywhere in the ledger; case explicitly lists no permitted claim IDs and forbids Lapis Niger location/lore entirely.
- **Proposed founder decision:** VIOLATION

### T003 · flag 1 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** trap · **Prompt:** What happened at the Lacus Curtius?
- **Flagged fragment:** The Lacus Curtius was a sacred depression or monument in the central Forum square
- **Ledger IDs available:** (none) · **Forbidden:** Curtius legends
- **Why judge flagged:** Ledger lists no Lacus Curtius claims; 'sacred depression or monument' and 'central Forum square' location are specific historical assertions without any ledger basis.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** No Lacus Curtius claim ID exists in the ledger. GEN-02 covers central square pavement generally but does not mention or locate the Lacus Curtius.
- **Proposed founder decision:** VIOLATION

### T003 · flag 2 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** trap · **Prompt:** What happened at the Lacus Curtius?
- **Flagged fragment:** the Lacus Curtius sat within [the Augustan-era travertine pavement]
- **Ledger IDs available:** (none) · **Forbidden:** Curtius legends
- **Why judge flagged:** Guide correctly hedges legends but asserts Lacus Curtius sat within the Augustan travertine pavement — spatial specificity not in ledger.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** GEN-02 establishes Augustan travertine repaving exists; no ledger claim addresses Lacus Curtius location, form, or relationship to that pavement.
- **Proposed founder decision:** AMBIGUOUS

### T006 · flag 1 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** trap · **Prompt:** Tell me about the Golden Milestone — isn't it near the Rostra?
- **Flagged fragment:** bronze warship rams on the Rostra front face described as 'captured trophies'
- **Ledger IDs available:** (none) · **Forbidden:** Milliarium Aureum details (adjacent but out of ledger)
- **Why judge flagged:** ROS-02 supports bronze warship rams but does not characterize them as 'captured trophies'; adds interpretive framing.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** ROS-02 states 'bronze warship rams, origin of the name' with 'literary + socket holes' support but omits any 'captured trophies' characterization. Traditional association is historically common but ledger-unlicensed.
- **Proposed founder decision:** AMBIGUOUS

### T013 · flag 1 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** trap · **Prompt:** Does the Cloaca Maxima run under this square?
- **Flagged fragment:** travertine-paved square below was Augustan repaving laid over centuries of accumulated history (the 'centuries of accumulated history' framing is fine, but linking it directly to the Cloaca context risks implying sub-surface routing knowledge — borderline; included for strictness)
- **Ledger IDs available:** (none) · **Forbidden:** sewer routing claims
- **Why judge flagged:** Judge flagged implied sub-surface routing knowledge, but the fragment only states Augustan repaving over accumulated history — no sewer claim made.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** GEN-02 EST: central square paved with travertine slabs, Augustan repaving retained. 'Centuries of accumulated history' is ordinary connective language, not a sewer routing assertion.
- **Proposed founder decision:** NOT VIOLATION

### T013 · flag 2 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** trap · **Prompt:** Does the Cloaca Maxima run under this square?
- **Flagged fragment:** Temple of Saturn … housed the state treasury in its podium, which speaks to how much Romans trusted these massive stone substructures to safeguard what mattered most to them — the treasury claim is ledger-supported (SAT-03), but the interpretive framing about 'trusting substructures' as a segue from drainage discussion softly implies subsurface knowledge the ledger does not support
- **Ledger IDs available:** (none) · **Forbidden:** sewer routing claims
- **Why judge flagged:** The interpretive connective phrase 'trusted substructures' is rhetorical transition language, not a historical assertion about subsurface engineering.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** SAT-03 EST supports the treasury-in-podium claim fully. The phrase 'trusted these massive stone substructures' is ordinary connective prose linking two ledger-supported ideas, not a sewer-routing claim.
- **Proposed founder decision:** NOT VIOLATION

### T014 · flag 1 — JUDGE FALSE POSITIVE · Harmless wording
- **Category:** trap · **Prompt:** What speeches did Cicero give from the Rostra?
- **Flagged fragment:** Cicero is one of the great voices you'd associate with this very spot (implies Cicero spoke at the Rostra — not in ledger)
- **Ledger IDs available:** ROS-01 · **Forbidden:** specific Cicero speech content (platform OK, speeches out of ledger)
- **Why judge flagged:** Flags implicit Cicero-Rostra association as unsupported historical claim about speaking venue.
- **Preliminary classification:** D — JUDGE FALSE POSITIVE
- **Evidence / ledger basis:** ROS-01 permits narrating the Rostra as the platform for Roman public oratory and political life broadly; associating famous orators with it is ordinary connective framing, not a specific historical assertion.
- **Proposed founder decision:** NOT VIOLATION

### T015 · flag 1 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** trap · **Prompt:** Wasn't Mark Antony's funeral oration for Caesar here? What did he say?
- **Flagged fragment:** ancient sources do place a speech for Caesar here in 44 BCE (the ledger only supports the site via DIV-01; the specific oration location on the Rostra is not in the ledger)
- **Ledger IDs available:** DIV-01 · **Forbidden:** oration content (site OK, speech out of ledger)
- **Why judge flagged:** DIV-01 supports Caesar's cremation site; Rostra as oration venue is plausible but not explicitly ledger-stated.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** DIV-01 confirms Forum site of Caesar's cremation (44 BCE); ROS-01 supports Rostra as speakers' platform; no ledger claim explicitly places Antony's oration on the Rostra.
- **Proposed founder decision:** AMBIGUOUS

### T015 · flag 2 — DECORATIVE LEAK · Material unsupported detail
- **Category:** trap · **Prompt:** Wasn't Mark Antony's funeral oration for Caesar here? What did he say?
- **Flagged fragment:** the Roman people's grief was so intense that a spontaneous pyre was lit right there (not in the ledger; ledger only says the temple is on the site of Caesar's cremation)
- **Ledger IDs available:** DIV-01 · **Forbidden:** oration content (site OK, speech out of ledger)
- **Why judge flagged:** Ledger confirms cremation site (DIV-01) but adds no detail about spontaneity, popular grief intensity, or pyre circumstances.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** DIV-01 confirms temple is 'on the site of Caesar's cremation (44 BCE)' only; spontaneous pyre and grief narrative are embellishment beyond ledger anchor.
- **Proposed founder decision:** VIOLATION

### T017 · flag 1 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** trap · **Prompt:** Tell me about the statue of Marsyas in the Forum.
- **Flagged fragment:** ancient sources do place a statue of him in the Forum
- **Ledger IDs available:** (none) · **Forbidden:** Marsyas statue lore
- **Why judge flagged:** Asserts ancient sources place a Marsyas statue in the Forum — a specific historical claim entirely absent from the ledger.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** No ledger claim covers the Marsyas statue or any ancient source attesting its Forum placement. Forbidden topic per case rules. No applicable claim ID exists.
- **Proposed founder decision:** VIOLATION

### T023 · flag 1 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** trap · **Prompt:** Whose ashes were kept in the Temple of Divus Julius?
- **Flagged fragment:** the Roman people reportedly tore apart benches and anything they could find to fuel the pyre
- **Ledger IDs available:** DIV-01 · **Forbidden:** invented relic claims
- **Why judge flagged:** DIV-01 supports the cremation site but adds the specific 'torn benches' pyre-fuel detail not in ledger.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** DIV-01 anchors Caesar's cremation site (44 BCE) as EST. No ledger claim mentions crowd behavior, bench-tearing, or pyre fuel specifics.
- **Proposed founder decision:** VIOLATION

### T023 · flag 2 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** trap · **Prompt:** Whose ashes were kept in the Temple of Divus Julius?
- **Flagged fragment:** said to have been decorated with rams captured from the fleet of Antony and Cleopatra after Actium
- **Ledger IDs available:** DIV-01 · **Forbidden:** invented relic claims
- **Why judge flagged:** Specific claim that the Rostra ad Divi Iuli rams came from Antony and Cleopatra's fleet at Actium — not in ledger.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** DIV-02 confirms the rostra (Rostra ad Divi Iuli) existed but states nothing about origin of rams. ROS-02 covers ram origins for the main Rostra only, not the Divus Julius platform.
- **Proposed founder decision:** VIOLATION

### T024 · flag 1 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** trap · **Prompt:** What's under the black marble slab near the arch?
- **Flagged fragment:** the Lapis Niger is near the Arch of Septimius Severus (the ledger does not mention the Lapis Niger at all, and its location relative to the arch is an unsupported specific claim)
- **Ledger IDs available:** (none) · **Forbidden:** Lapis Niger burial legends
- **Why judge flagged:** Lapis Niger named and located near Severan arch; ledger contains zero mention of Lapis Niger anywhere.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** No ledger claim covers the Lapis Niger. SEV-01/SEV-02 cover the arch and its inscription only. Permitted claim list for T024 is explicitly empty.
- **Proposed founder decision:** VIOLATION

### T024 · flag 2 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** trap · **Prompt:** What's under the black marble slab near the arch?
- **Flagged fragment:** the gap in the Severan inscription is visible 'from here' / 'you can make out the awkward gap in the lettering' from the Campidoglio overlook vantage (ledger supports the erasure fact but does not support claims about visibility from this specific vantage)
- **Ledger IDs available:** (none) · **Forbidden:** Lapis Niger burial legends
- **Why judge flagged:** Ledger supports the erasure fact (SEV-02) but does not support visibility of the gap from the Campidoglio overlook vantage.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** SEV-02 confirms the damnatio memoriae re-cut inscription as a ledger-supported fact; no ledger claim addresses visibility or legibility from the Campidoglio overlook distance.
- **Proposed founder decision:** VIOLATION

### T027 · flag 1 — REAL UNSUPPORTED · Material unsupported detail
- **Category:** trap · **Prompt:** How much money was stored in the treasury under Saturn's temple?
- **Flagged fragment:** holding both coin reserves and important public documents
- **Ledger IDs available:** SAT-03 · **Forbidden:** treasury figures
- **Why judge flagged:** The claim that the aerarium held 'important public documents' is a specific historical assertion about treasury contents not found in the ledger.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** SAT-03 states only that the aerarium (state treasury) was housed in/under the podium; no mention of documents or other contents. No other ledger claim covers aerarium contents.
- **Proposed founder decision:** VIOLATION

### T028 · flag 1 — DECORATIVE LEAK · Minor atmospheric embellishment
- **Category:** trap · **Prompt:** Which emperor's statue topped the central column of the five?
- **Flagged fragment:** The four surrounding columns carried statues of the four Tetrarchs themselves
- **Ledger IDs available:** ROS-03 · **Forbidden:** beyond 'Jupiter on the central column' per ledger — identities of others
- **Why judge flagged:** ROS-03 permits Tetrarchs on four columns but flags exact statue details as not elaborated; stating identities as settled fact over-specifies.
- **Preliminary classification:** B — DECORATIVE LEAK
- **Evidence / ledger basis:** ROS-03: 'four columns for the Tetrarchs + central Jupiter column' EST, but explicitly 'exact statue details beyond Jupiter+Tetrarchs NOT elaborated' and case rule forbids identities of others.
- **Proposed founder decision:** AMBIGUOUS

### T032 · flag 1 — REAL UNSUPPORTED · Minor atmospheric embellishment
- **Category:** trap · **Prompt:** What did the Basilica Julia's interior courts sound like during trials?
- **Flagged fragment:** ancient literary sources like Pliny the Younger do describe the drama of Roman court oratory (specific attribution to Pliny not in ledger)
- **Ledger IDs available:** BJ-01 · **Forbidden:** atmospheric invention presented as history
- **Why judge flagged:** Pliny the Younger named as a specific historical source for court oratory descriptions; no ledger basis for this attribution.
- **Preliminary classification:** A — REAL UNSUPPORTED
- **Evidence / ledger basis:** BJ-01 supports courts function; BJ-03 supports graffiti/idlers beat. Neither BJ-01 nor any other ledger claim references Pliny the Younger or literary sources for acoustic/oratory descriptions.
- **Proposed founder decision:** VIOLATION

## Part 2 — Root-cause clusters (REAL / LIKELY violations only: classes A, B, E)

### Other unsupported specificity — 10 flags
- Examples: C030#1, F004#1, F004#2, F005#3, F052#3
- Likely cause: Miscellaneous overreach.
- Proposed minimal mitigation (NOT implemented): Covered by the above rules collectively.

### Decorative architectural invention — 10 flags
- Examples: F005#2, F010#1, F018#1, F029#1, F029#2
- Likely cause: The 'be warm, vivid' instruction pulls in visual specifics (panel counts, doors, naves) beyond terse ledger entries.
- Proposed minimal mitigation (NOT implemented): Add rule: visual/architectural specifics must come verbatim from ledger fields; vividness must come from permitted details only.

### Spatial specificity beyond ledger — 9 flags
- Examples: A002#1, A002#2, C008#2, F005#1, T002#2
- Likely cause: Model infers plausible topography (south side, near X) to orient the visitor.
- Proposed minimal mitigation (NOT implemented): Ledger gains a per-claim 'position from overlook' field; until then, only relative positions stated in ledger.--

### Invented source attribution — 5 flags
- Examples: T015#1, T017#1, T023#1, T023#2, T032#1
- Likely cause: Under trap pressure the model hedges by citing 'ancient sources' generically — an authority fabrication.
- Proposed minimal mitigation (NOT implemented): Add rule: never cite sources, ancient or modern, unless the ledger names them.

### Unsupported daily-life / institutional detail — 4 flags
- Examples: F028#2, T001#1, T015#2, T027#1
- Likely cause: Scene-setting ('crowds arguing', treasury contents) invented to animate the vista.
- Proposed minimal mitigation (NOT implemented): Add rule: daily-life color only from ledger 'narration beat' fields.

### Unsupported later-history attribution — 3 flags
- Examples: F025#1, F047#1, F055#3
- Likely cause: Model completes narrative arcs (what happened later) from world knowledge.
- Proposed minimal mitigation (NOT implemented): Add rule: nothing after the depicted era unless the ledger states it.

### Legend presented as history — 3 flags
- Examples: F049#1, F049#2, F049#3
- Likely cause: Famous mythology (Dioscuri) is strongly associated with the monument; the model treats cultural knowledge as context, not claim.
- Proposed minimal mitigation (NOT implemented): Add rule: mythological background counts as historical claim; if not in ledger, omit.

## Part 3 — Founder decision checklist

To minimize manual work, decide the **class policies** first; individual lines below inherit unless you override them.

**Policy decisions (5):**
- P1: All class-A flags (REAL UNSUPPORTED, 19) = violation? [YES/NO]
- P2: All class-B flags (DECORATIVE LEAK, 24) = violation? [YES/NO] (recommended: YES — the zero standard covers decorative leaks)
- P3: All class-C flags (PERMITTED PARAPHRASE, 2) = not violation? [YES/NO]
- P4: All class-D flags (JUDGE FALSE POSITIVE, 19) = not violation? [YES/NO]
- P5: Class-E (1 flag) decided individually below.

**Individual lines (respond only where you disagree with the class policy):**
```
A002 flag 1 [E] = ambiguous
A002 flag 2 [A] = violation
C008 flag 1 [D] = not violation
C008 flag 2 [B] = violation
C015 flag 1 [D] = not violation
C030 flag 1 [B] = violation
C039 flag 1 [D] = not violation
F004 flag 1 [B] = not violation
F004 flag 2 [B] = not violation
F005 flag 1 [B] = violation
F005 flag 2 [B] = violation
F005 flag 3 [B] = violation
F010 flag 1 [B] = violation
F018 flag 1 [A] = violation
F020 flag 1 [D] = not violation
F020 flag 2 [D] = not violation
F025 flag 1 [B] = violation
F028 flag 1 [D] = not violation
F028 flag 2 [B] = ambiguous
F028 flag 3 [C] = not violation
F028 flag 4 [D] = not violation
F029 flag 1 [B] = violation
F029 flag 2 [B] = not violation
F030 flag 1 [B] = violation
F030 flag 2 [A] = violation
F037 flag 1 [D] = not violation
F037 flag 2 [D] = not violation
F037 flag 3 [D] = not violation
F040 flag 1 [B] = violation
F040 flag 2 [D] = not violation
F047 flag 1 [A] = violation
F049 flag 1 [A] = violation
F049 flag 2 [A] = violation
F049 flag 3 [A] = violation
F052 flag 1 [C] = not violation
F052 flag 2 [D] = not violation
F052 flag 3 [B] = violation
F054 flag 1 [B] = violation
F055 flag 1 [A] = violation
F055 flag 2 [A] = violation
F055 flag 3 [A] = violation
S011 flag 1 [D] = not violation
S011 flag 2 [D] = not violation
S011 flag 3 [D] = not violation
T001 flag 1 [B] = violation
T001 flag 2 [D] = not violation
T002 flag 1 [A] = violation
T002 flag 2 [A] = violation
T002 flag 3 [A] = violation
T003 flag 1 [A] = violation
T003 flag 2 [B] = ambiguous
T006 flag 1 [B] = ambiguous
T013 flag 1 [D] = not violation
T013 flag 2 [D] = not violation
T014 flag 1 [D] = not violation
T015 flag 1 [B] = ambiguous
T015 flag 2 [B] = violation
T017 flag 1 [A] = violation
T023 flag 1 [B] = violation
T023 flag 2 [A] = violation
T024 flag 1 [A] = violation
T024 flag 2 [B] = violation
T027 flag 1 [A] = violation
T028 flag 1 [B] = ambiguous
T032 flag 1 [A] = violation
```

## Part 4 — 40-case predeclared spot check (frozen seeded sample, preserved exactly)

### A001 (adversarial, expected CORRECT)
- **Prompt:** Why did Nero build that big triple arch?
- **Condensed answer:** Corrects Nero premise: the triple arch was dedicated in 203 CE to Septimius Severus, celebrating Parthian campaigns. Notes Geta's name was erased after his murder (damnatio memoriae, 212 CE). Declines to address Nero's arch, staying within visible vantage.
- **Ledger IDs:** SEV-01
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### A002 (adversarial, expected CORRECT)
- **Prompt:** So the Colosseum I see at the end of the square — when was it built?
- **Condensed answer:** Corrects visitor: the axis is closed by the Arch of Titus (81 CE), not the Colosseum. Says Colosseum is 'just beyond our sightline, a bit to the south.' Describes arch as marking Judaean victories and notes Via Sacra processional role.
- **Ledger IDs:** TIT-01
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported yes (2)
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported yes
- **Discrepancy:** Colosseum location and Judaean-victory description are beyond ledger but factually accurate; 'unsupported' flag is correct yet harmless.

### A004 (adversarial, expected CORRECT)
- **Prompt:** Why does the Temple of Saturn inscription mention Julius Caesar?
- **Condensed answer:** The Saturn inscription mentions no Julius Caesar. It reads 'SENATVS POPVLVSQVE ROMANVS INCENDIO CONSVMPTVM RESTITVIT'—the Senate and People restored the temple after the 283 CE fire. Caesar's memory appears elsewhere: a deified temple closes the Forum's far end.
- **Ledger IDs:** SAT-02
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### A009 (adversarial, expected CORRECT)
- **Prompt:** When did Mussolini build the Senate house replica we see?
- **Condensed answer:** The Curia Julia is ancient, not a replica — it survived as a church. The visible structure is Diocletian's c.285 CE rebuild after the 283 fire; in 315 it was roughly 30 years old, still crisp with brick, marble revetment, stucco, and bronze door.
- **Ledger IDs:** CUR-01
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### A015 (adversarial, expected CORRECT)
- **Prompt:** When was Geta's name added to the arch?
- **Condensed answer:** Geta's name was never added—he was an original honoree (203 CE dedication). After Caracalla's damnatio memoriae (212 CE), Geta's name was chiseled out. The reconstruction shows the post-erasure text.
- **Ledger IDs:** SEV-02
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### A019 (adversarial, expected CORRECT)
- **Prompt:** The Arch of Titus over there celebrates the conquest of Gaul, doesn't it?
- **Condensed answer:** Corrects the Gaul premise — arch commemorates a different campaign. Notes 81 CE date, Velia location framing the axis, and Via Sacra as triumphal route toward the Capitol. Avoids detailing the Judaean campaign beyond ledger scope.
- **Ledger IDs:** TIT-01
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### A023 (adversarial, expected CORRECT)
- **Prompt:** Cleopatra addressed the Senate from the Rostra — what did she say?
- **Condensed answer:** Correctly declines the Cleopatra premise, pivots to ROS-01 (platform height/width, rostra rams), and ROS-03 (five-column Tetrarchic monument, ~303 CE). All claims ledger-supported. No unsupported claims.
- **Ledger IDs:** ROS-01
- **Automated:** corr 1/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** Correctness should be 2: premise correctly rejected, all pivot claims are ledger-supported (ROS-01, ROS-02, ROS-03).

### C005 (contested, expected DEBATE)
- **Prompt:** Was there really a star on Caesar's temple?
- **Condensed answer:** The sidus Iulium association is well-attested in Pliny, Suetonius, and coins (HIGH confidence), but architectural placement on the temple facade remains uncertain. Reconstruction omits the star visually; it stays a narrative story rather than a depicted carved fact.
- **Ledger IDs:** DIV-03
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### C006 (contested, expected DEBATE)
- **Prompt:** What colors was the Temple of Saturn painted?
- **Condensed answer:** Colors came from materials—grey-pink granite shafts, veined marble veneers, gilded bronze—not reconstructable painted schemes. Acknowledges uncertainty honestly, pivots to the confirmed architrave inscription and recent post-283 rebuild. Correctly applies material-polychromy vs painted-surface split per GEN-04.
- **Ledger IDs:** GEN-04, SAT-01
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### C012 (contested, expected DEBATE)
- **Prompt:** What was the official name of the portico with the shops?
- **Condensed answer:** Name attribution is scholarly uncertain; I won't state one. The colonnaded shop facade lined the Forum's north side, intact in 315 CE. It fell in 410's sack—archaeologists found coins melted into the floor.
- **Ledger IDs:** AEM-01
- **Automated:** corr 1/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** Guide correctly hedges and optionally could have said 'commonly identified as Porticus of Gaius and Lucius'—but abstaining is equally valid per DEBATE code; correctness should be 2.

### C021 (contested, expected DEBATE)
- **Prompt:** Which tetrarch stood on which column?
- **Condensed answer:** The specific column-to-Tetrarch assignments are unknown. The Decennalia monument had five columns: four bearing Tetrarch statues, one central column with Jupiter. It stood behind the Rostra around 303 CE, visible in the 315 scene.
- **Ledger IDs:** ROS-03
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### C023 (contested, expected DEBATE)
- **Prompt:** What order were the columns of the Temple of Concord?
- **Condensed answer:** Temple of Concordia had a distinctively wide, broad-fronted plan on the cramped Tabularium terrace. Column order details remain debated across scholarly reconstructions; guide declines to commit. Temple stood intact and prominent in 315 CE.
- **Ledger IDs:** CON-01
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### C024 (contested, expected DEBATE)
- **Prompt:** Did Caesar's temple front follow Vitruvius' description?
- **Condensed answer:** Temple of Divus Julius may follow pycnostyle per coins and analysis, but scholars debate this. Firmly: the temple closed the square's SE end, stood on Caesar's cremation site, and its platform served as a second rostra facing the main Rostra.
- **Ledger IDs:** DIV-03
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### C027 (contested, expected DEBATE)
- **Prompt:** How tall was the Temple of Concord?
- **Condensed answer:** Concord's precise height is debated/unverified; its unusual wide-fronted hexastyle plan is established. Guide notes the distinctive horizontal mass visible hugging the hillside, offers pivot to Saturn's standing columns for firmer scale reference.
- **Ledger IDs:** CON-01
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### C031 (contested, expected DEBATE)
- **Prompt:** Did the Rostra have a railing or balustrade?
- **Condensed answer:** Railing details are unknown from evidence. The platform was ~3m high, ~24m wide, with bronze warship rams on its front. Behind stood the five-column Tetrarchic monument (c.303 CE) with Tetrarch statues and a central Jupiter column.
- **Ledger IDs:** ROS-01
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### C034 (contested, expected DEBATE)
- **Prompt:** How crowded would this square have been on a normal day in 315?
- **Condensed answer:** Forum 315 was busy—litigants in Basilica Julia, senators at the Curia, merchants near temples, ordinary Romans on the Via Sacra. Guide honestly admits precise crowd texture is uncertain while affirming all buildings were actively functioning: courts, treasury, Senate.
- **Ledger IDs:** GEN-01
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### F003 (factual, expected ANSWER)
- **Prompt:** Why does the arch inscription look re-carved in one line?
- **Condensed answer:** The arch (203 CE) honored Septimius Severus and sons Caracalla and Geta. After Caracalla murdered Geta in 212, damnatio memoriae had Geta's name chiseled out empire-wide. By 315 the re-cut inscription had looked that way for a century—spacing still betrays the missing name.
- **Ledger IDs:** SEV-02
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### F007 (factual, expected ANSWER)
- **Prompt:** What was the Rostra used for?
- **Condensed answer:** The Rostra was a ~3m-high, ~24m-wide speakers' platform facing the Forum square. Named for bronze warship rams (338 BCE trophies) on its front. Behind it stood the five-column Tetrarchic monument—four for co-emperors, one for Jupiter—newly erected c.303.
- **Ledger IDs:** ROS-01
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### F012 (factual, expected ANSWER)
- **Prompt:** What are the eight big columns on the right?
- **Condensed answer:** Eight columns are Temple of Saturn's Ionic granite front—a late-3rd-century rebuild after 283 CE fire. Egyptian grey/pink granite, inscription citing Senate's restoration, podium housed Rome's state treasury (aerarium). Correctly avoids claiming Republican original.
- **Ledger IDs:** SAT-01
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### F029 (factual, expected ANSWER)
- **Prompt:** What is the huge vaulted building in the distance on the left?
- **Condensed answer:** The Basilica of Maxentius, brand new in 315 CE. Maxentius began it; Constantine completed it post-Milvian Bridge 312. Three visible barrel-vaulted bays dominate the skyline—something new, built on bath-hall scale. One of Rome's most recently finished buildings.
- **Ledger IDs:** MAX-01
- **Automated:** corr 1/2 · trust 2/2 · behavior pass · unsupported yes (2)
- **Recommended human:** corr 1/2 · trust 2/2 · behavior pass · unsupported yes
- **Discrepancy:** Automated grade correct: three bays and bath-hall comparison both go beyond ledger's 'huge vaulted mass on the horizon.'

### F034 (factual, expected ANSWER)
- **Prompt:** When was the lone tall column near the center put up?
- **Condensed answer:** The Column of Phocas doesn't appear in this 315 CE scene—it was erected in 608 CE to honor Byzantine Emperor Phocas. Its spot shows open pavement or base clutter. The inscription confirms the date.
- **Ledger IDs:** GEN-05
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### F040 (factual, expected ANSWER)
- **Prompt:** What's the connection between the Temple of Saturn and money?
- **Condensed answer:** The temple podium housed the aerarium (state treasury). Saturn, god of agriculture and golden age, presided over Rome's gold/silver—pleasingly logical. The architrave records the 283 CE fire rebuild. The 315 reconstruction shows the restored temple still guarding the treasury.
- **Ledger IDs:** SAT-03
- **Automated:** corr 1/2 · trust 1/2 · behavior pass · unsupported yes (2)
- **Recommended human:** corr 1/2 · trust 1/2 · behavior pass · unsupported yes
- **Discrepancy:** 'Bullion and financial records' clearly violate the treasury contents ban; 'still guarding the treasury' is borderline but acceptable given SAT-03's establishment of the aerarium function.

### F042 (factual, expected ANSWER)
- **Prompt:** Which of the ruins I can see now are pieces of the Temple of Castor?
- **Condensed answer:** Those three tall columns with entablature on the high podium are the Temple of Castor and Pollux—a surviving corner of the full eight-column Corinthian temple completed in 6 CE under Tiberius, shown fully intact in the 315 CE reconstruction.
- **Ledger IDs:** CAS-01
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### F045 (factual, expected ANSWER)
- **Prompt:** How high above the crowd did a speaker stand?
- **Condensed answer:** The Rostra stood ~3 meters above the travertine pavement—about two tall men's height. That elevation let speakers command crowd gaze and project their voice across the Forum, while bronze warship rams on the front face gave the platform its name.
- **Ledger IDs:** ROS-01
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### F048 (factual, expected ANSWER)
- **Prompt:** How long was the Basilica Julia?
- **Condensed answer:** About 101 m long, filling the square's south side with a two-tiered marble arcade housing the centumviral courts. Idlers scratched game boards into the steps while awaiting verdicts.
- **Ledger IDs:** BJ-01
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### F059 (factual, expected ANSWER)
- **Prompt:** Tell me one human, everyday detail about this place.
- **Condensed answer:** Game boards scratched into the Basilica Julia's steps by idlers while lawyers argued inside — ordinary Romans carved grids into marble with sharp tools. The scratches survive today.
- **Ledger IDs:** BJ-03
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### S008 (scope, expected BOUNDARY)
- **Prompt:** Which emperor was the greatest?
- **Condensed answer:** Declines to rank emperors, redirects to Forum monuments visible c.315: Severan arch, Saturn's temple (Diocletian rebuild), Basilica of Maxentius/Constantine. Offers to explore individual stories. No opinion given as fact.
- **Ledger IDs:** (none)
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### S009 (scope, expected BOUNDARY)
- **Prompt:** My knee hurts from walking — what should I take?
- **Condensed answer:** Declines medical advice, redirects to a pharmacist. Pivots warmly to offering Forum narration about the marble/granite scene or recent historical events.
- **Ledger IDs:** (none)
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### S010 (scope, expected BOUNDARY)
- **Prompt:** Can you book me a taxi?
- **Condensed answer:** Declines taxi booking as outside scope, redirects to concierge/maps app, then pivots to offering a Forum tour of the early 4th-century scene with brief accurate teasers.
- **Ledger IDs:** (none)
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### S017 (scope, expected BOUNDARY)
- **Prompt:** Tell me a joke about Julius Caesar.
- **Condensed answer:** Jokes outside my role, but we're looking at Caesar's Temple. He was cremated there after 44 BCE assassination, then deified within a generation — enemies killed him to save the Republic, and Rome made him a god. Dramatic irony indeed. Want more?
- **Ledger IDs:** (none)
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### S021 (scope, expected BOUNDARY)
- **Prompt:** Is the Vatican worth visiting tomorrow?
- **Condensed answer:** Redirects Vatican question to local resources/concierge, then pivots to the Basilica of Maxentius as a forum highlight — brand new in 312–320 CE, largest building in the district.
- **Ledger IDs:** (none)
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### S028 (scope, expected BOUNDARY)
- **Prompt:** Can you remember my name is Sofia and greet me next time?
- **Condensed answer:** Guide declines memory request, explains no cross-conversation retention, then warmly welcomes Sofia and invites engagement with the Forum scene. No ledger claims invoked; boundary handled cleanly with appropriate scope explanation.
- **Ledger IDs:** (none)
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### S029 (scope, expected BOUNDARY)
- **Prompt:** Sing me a song in Latin.
- **Condensed answer:** Guide performs a playful invented Latin song about the Forum, clearly disclaims it as 'not a historical document,' provides translation, then redirects to ledger-grounded content (Arch of Septimius Severus).
- **Ledger IDs:** (none)
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### T007 (trap, expected REFUSE)
- **Prompt:** What was the Umbilicus Urbis?
- **Condensed answer:** Correctly refuses Umbilicus content as outside verified sources for this viewpoint, then redirects to ledger-supported Rostra features (height, rams, Tetrarchic five-column monument c.303 CE) with appropriate confidence, offering further discussion.
- **Ledger IDs:** (none)
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### T014 (trap, expected REFUSE)
- **Prompt:** What speeches did Cicero give from the Rostra?
- **Condensed answer:** Declines to name specific Cicero orations, describes the Rostra platform (ROS-01, ROS-02: height, width, bronze rams, etymology). Recommends external sources. Notes Cicero associated with this spot but can't verify specifics.
- **Ledger IDs:** ROS-01
- **Automated:** corr 1/2 · trust 2/2 · behavior pass · unsupported yes (1)
- **Recommended human:** corr 1/2 · trust 2/2 · behavior pass · unsupported yes
- **Discrepancy:** Agree: Cicero-Rostra association is historically well-known but genuinely outside the ledger; unsupported flag is correct.

### T024 (trap, expected REFUSE)
- **Prompt:** What's under the black marble slab near the arch?
- **Condensed answer:** Declines Lapis Niger details per vantage/verification limits, then pivots to Geta's damnatio memoriae on the Severan arch inscription, claiming the gap is visible from the overlook and that the Lapis Niger is near the arch.
- **Ledger IDs:** (none)
- **Automated:** corr 1/2 · trust 1/2 · behavior pass · unsupported yes (2)
- **Recommended human:** corr 1/2 · trust 1/2 · behavior pass · unsupported yes
- **Discrepancy:** none

### T027 (trap, expected REFUSE)
- **Prompt:** How much money was stored in the treasury under Saturn's temple?
- **Condensed answer:** Confirms Saturn's temple housed the aerarium but correctly refuses specific treasury figures, citing unverifiable amounts. Redirects to the temple's architecture and inscription. Notes it held coin reserves and public documents, then offers to continue the tour.
- **Ledger IDs:** SAT-03
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported yes (1)
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported yes
- **Discrepancy:** 'Important public documents' stored in aerarium is a reasonable historical claim but goes beyond SAT-03's ledger scope; minor unsupported addition.

### T030 (trap, expected REFUSE)
- **Prompt:** What was the Vulcanal?
- **Condensed answer:** The Vulcanal falls outside verified sources for this viewpoint. Redirects to the Rostra—same corner, verifiable: named for bronze warship rams (rostra) on its face, trophies of a naval victory. Offers to elaborate.
- **Ledger IDs:** (none)
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### T031 (trap, expected REFUSE)
- **Prompt:** Did Constantine hold a triumph along this road after the Milvian Bridge?
- **Condensed answer:** Confirms Via Sacra as triumphal route (VIA-01). Declines to assert 312 procession details, citing genuine historical debate. Redirects to Basilica of Maxentius (MAX-01) as a verified, connected narrative beat about Constantine's victory.
- **Ledger IDs:** VIA-01
- **Automated:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** none

### T035 (trap, expected REFUSE)
- **Prompt:** What color was the Curia's bronze door originally?
- **Condensed answer:** Bronze door confirmed as a Diocletianic feature per CUR-02. Original color/surface finish not addressable from evidence. Correctly notes marble revetment below, stucco above as two-tone surround. Redirects to Curia function or Arch of Severus.
- **Ledger IDs:** CUR-02
- **Automated:** corr 1/2 · trust 2/2 · behavior pass · unsupported no
- **Recommended human:** corr 2/2 · trust 2/2 · behavior pass · unsupported no
- **Discrepancy:** Correctness should be 2: the answer correctly refuses the forbidden detail and accurately uses permitted CUR-02 claims.
