# ChronoWalk Day-2 — Full Production / MAP Capability Audit

**Mode:** AUDIT ONLY — no implementation, no refactors, no ID renames, no behavior changes.  
**Production tip audited:** `figma` @ `c29ecf2d` → chronowalk.com (PWA).  
**Product contract:** `docs/MAP_PRODUCT_CONTRACT.md` (PR [#281](https://github.com/isienrione/pirisibits/pull/281) on `cursor/map-product-contract-726a`; **not yet merged to `figma`** at audit time).  
**Killer loop:** Near Me → discover/recommend → reach place → spatial story → Then/Now → ask/follow curiosity → choose next → resume offline.

Safety: English, Spanish, commerce, entitlements, GPS, Mapbox, audio, offline, journey progress, free Pantheon, and family/couple behavior are treated as preserve-in-place.

---

## A. Executive verdict

**The current ChronoWalk architecture can support MAP Day-1 through extension.** There is **no blocking need** for a parallel app, second place graph, or native rewrite.

What exists and is reusable: a live `wXX` journey graph in `src/content/rome/manifest.json`, GPS + geofences + Mapbox guidance, a durable journey state machine (`cw_journey_v1`), Threshold hold UI, offline Rome packs, EN/ES audio path conventions, and unlock scopes via purchase → pace → `TOUR_TIER_WAYPOINTS`.

What is missing as product capability (not as infrastructure): Near Me as default entitled home, interest/time recommendation, discovery content type, reveal-tier metadata, grounded Q&A retrieval, and killer-loop analytics coverage.

**Primary danger:** overlapping place representations (manifest `wXX`, kebab media IDs, landing routes, legacy `*-tour.js`, pacing acts, catalog stop counts). MAP must **extend the manifest + unlock filter**, and treat every other list as a **projection/adapter**. Starting discoveries or ranking on kebab/tour registries would fork the product.

**Pre-existing production drift to account for (not introduced by MAP):** `enc_circus` exists as a waypoint and in classic-tier lists, but is **absent from committed Path A/B sequences** — so “21 heroes” inventory and walk-path membership already disagree.

---

## B. Production architecture map

### Boot & runtime class

| Layer | Path | Class |
|-------|------|-------|
| Entry | `index.html` → `src/main.jsx` → `AppRouter` | **ACTIVE PRODUCTION** |
| Landing | `ChronoWalkLanding` (lazy) | **ACTIVE** |
| Access | `RequireAccess` + `accessSession.js` | **ACTIVE** |
| App entry | `/setup` `RedesignSetupPage` | **ACTIVE** |
| Begin | `/begin` → `RedesignBeginFlow` | **ACTIVE** |
| Walk | `/journey` → `JourneyShell` (`variant="redesign"`) | **ACTIVE** |
| Shell tabs | Walk / Tour / Map / Journal (`shell/config.js`) | **ACTIVE** |
| Place graph | `src/content/rome/manifest.json` via `loadRomeManifest()` | **ACTIVE** (hand-enriched generated) |
| Unlock filter | `tourTiers.js` + `myTourPlan.getTourWaypointIds` | **ACTIVE** |
| Commerce SoT | `commerce/launchCatalog.json` → `generate-commerce-consumers` | **ACTIVE** |
| Threshold media | kebab folders + `waypointMerge` | **ACTIVE** (media path) |
| Legacy tour registry | `tourRegistry`, `*-tour.js`, `tourProducts.js`, `App.jsx` / `LaunchRouter` | **LEGACY** (not prod boot) |
| Landing archive | `src/landing/archive/**` | **ARCHIVE** |
| Figma prototype | `FigmaPrototypeApp`, static `D1Map` / `C1JourneyHome` handlers | **EXPERIMENTAL / PROTOTYPE** |
| Generated commerce mirrors | `src/lib/generated/launchCatalog.gen.js`, supabase webhook gen | **GENERATED** (authority = JSON catalog) |

### First in-app screen (entitled)

1. Fresh unlock → **`/setup`** (offline prepare + A2HS) → mark `cw_app_entry_done_v2` → **`/begin`**.  
2. Begin: resumable → `C8dResume`; else location primer / pace → **`/journey`**.  
3. Cold entitled open on `/` stays on **marketing** unless Continue Walk → `getActiveWalkPath()`.  
4. There is **no** entitled default **Near Me** home today. Nearest-stop lives under **Tour** → “Start from where I am”.

### Journey state machine (active)

`idle → walking → approaching → arrived → story → (threshold) → … → dayComplete | complete` (+ `paused`).

- Owner: `src/state/journey.js`  
- Persist: `localStorage` `cw_journey_v1` (+ optional cloud push)  
- GPS dwell arrival in `JourneyShell` + `useJourneyGeo`  
- Redesign migrates persisted `threshold`/`arrived` → `story` on hydrate  

Guidance (Mapbox Directions) is already **separate** from destination choice (sequence / jump / nearest).

---

## C. Source-of-truth map

### Preferred authorities (extend these)

| Concept | Authoritative source today | Primary consumers | MAP should |
|---------|---------------------------|-------------------|------------|
| **Place identity** | `manifest.json` waypoint keys (`w01`…`w23`, `enc_circus`, `pause`) | JourneyShell, MapScreen, My Tour, product truth | **Extend** — only ID space |
| **Place geo / geofence** | `manifest.waypoints[*].geofence` | JourneyShell, mapStops, offline tile bounds | **Extend** |
| **Hero inventory (21)** | Manifest visit stops ≈ `HERO_STOP_IDS` | i18n/audio coverage, marketing counts | Keep aligned; metadata on manifest |
| **Chapters / EN transcripts** | Manifest `chapters[]` | AudioEngine, overlays | **Extend** |
| **Audio filenames** | Manifest chapter `file` (+ transits/inserts/system) | `audioPaths.js` | Keep; ES uses same filenames under `/rome/audio/es/…` |
| **ES text** | `src/i18n/content/es/*.json` via `applyLocaleOverlay` | Manifest load path | New objects need overlay entries |
| **ES audio path convention** | `heroStopAudioMap.js` / `localeAudioFilePath` | Offline + playback | Coverage lists must include new heroes |
| **Unlock scope membership** | Purchase `contentProductId` → pace → `TOUR_TIER_WAYPOINTS` | `myTourPlan.getTourWaypointIds` | **Extend** scopes over `wXX` (+ later discoveries) |
| **Commerce SKU / seats** | `commerce/launchCatalog.json` | Checkout, webhook, entitlements | **Consume only** — no new MAP SKUs |
| **Traversal preference** | Journey `context.path` `a`\|`b` + sequences in manifest | JourneyShell, C8aPathChoice | Keep; not a recommendation engine |
| **Journey progress** | `cw_journey_v1` | Begin, JourneyShell, resume | **Extend carefully** for discoveries |
| **Entitlement** | `cw_access_entitlement_v1` + credential + offline lease | `RequireAccess` | Consume |
| **Locale** | `cw_locale_v1` + `I18nProvider` | UI + audio paths | Consume |
| **Offline Rome pack membership** | Collectors over **manifest** (`offlinePackage.js`, `audioPaths` / media collectors) | App Entry download | Extend collectors when new asset types exist |
| **Reveal media files** | `public/waypoints/**` + manifest `reconstruction` | Threshold | Attach **tier metadata** on manifest; don’t fork media graph |
| **Kebab ↔ wXX aliases** | `SLUG_ALIASES`, `now-files-manifest.json`, photo aliases | Debug, Threshold folder resolve | Adapters only |

### CURRENT DUPLICATION → AUTHORITY → ADAPTER STRATEGY

| Duplication | Recommended authority | Strategy (no sprint-wide rewrite) |
|-------------|----------------------|-----------------------------------|
| Manifest sequences vs `ROME_ACTS` vs generator acts vs classic tier (esp. **`enc_circus`**) | **Committed manifest sequences + waypoints** for “on the walk”; tier lists for unlock | Fix sequence/tier drift in a dedicated content PR; until then, Near Me must use **intersection**(unlocked IDs ∩ waypoints with geo), not marketing copy |
| Central **10** `wXX` vs landing/catalog **8** stops | Unlock = `tourTiers`; marketing = landing | Do not drive recommendations from landing arrays |
| Landing kebab routes / monuments vs journey `w11_12` joins | Journey `wXX` | Landing remains acquisition projection |
| `waypointGeo` / forum/expansion seeds vs manifest geofence | Manifest geofence for live walk | Keep kebab geo for Threshold media resolution only |
| `tourProducts` / `*-tour.js` / `tourRegistry` | Not prod spine | **Do not extend**; leave LEGACY |
| `HERO_STOP_AUDIO` vs manifest chapters | Manifest for playback; HERO map for ES coverage checks | Generate or test-lock alignment |
| Generator `generate-rome-manifest.mjs` vs hand-enriched JSON | Treat **committed JSON as runtime SoT**; generator as authoring aid | Do not regenerate blindly; reconcile before regen |
| Dual offline stacks (Rome Cache API pack vs generic IDB tour package) | **Rome `offlinePackage.js`** for walk | Discoveries/Q&A attach to Rome collectors first |

### Generated files (do not edit as SoT)

| Artifact | Generator | True SoT |
|----------|-----------|----------|
| `src/lib/generated/launchCatalog.gen.js` (+ scripts/supabase copies) | `generate-commerce-consumers.mjs` | `commerce/launchCatalog.json` |
| `src/content/rome/manifest.json` | `generate-rome-manifest.mjs` **then hand enrichment** | Hybrid — runtime = committed JSON |

---

## D. MAP capability matrix

Legend: **EXISTS** · **PARTIAL** · **MISSING** · **RISKY** · **LEGACY-ONLY**

| # | Capability | Status | Evidence / files | Reusable foundation | Missing work | Risk |
|---|------------|--------|------------------|---------------------|--------------|------|
| 1 | Near Me default entry | **MISSING** | Entitled home = `/setup`→`/begin`→`/journey`; Tour has nearest | `handleStartFromHere`, GPS, unlock filter | Make Near Me entitled default surface | Diverting to new shell home without resume |
| 2 | GPS ranking | **PARTIAL** | Nearest = min haversine over tour IDs (`RedesignMyTourScreen`) | `getDistance`, geofences | Ranked list (N results), freshness/accuracy UX | Poor accuracy ranks wrong stop |
| 3 | Unlock-aware nearby | **PARTIAL** | Nearest uses `getTourWaypointIds` (tier/own filtered) | `tourTiers` + myTourPlan | Explicit locked-vs-unlocked presentation | Showing locked places as startable |
| 4 | interest tags | **MISSING** | No `interestTags` in repo | — | Closed tag set on content | Tagging only in UI copy |
| 5 | Traveler interest selection | **MISSING** | — | Begin/settings patterns | Persist interests; feed ranker | New progress key sprawl |
| 6 | timeCostMin | **MISSING** | — | Manifest durations seed exists for audio length, not visit cost | Per-hero/discovery minutes | Confusing with audio duration |
| 7 | Traveler time budget | **MISSING** | Pace packages ≈ length proxy only | Pace picker | Explicit short/half/full budget | Overloading pace SKU |
| 8 | Recommendation ranking | **MISSING** | “Recommended” = UI chrome copy only | Unlock lists + nearest | Ranker over place IDs | Building on kebab tours |
| 9 | Primary + alternate recommendations | **MISSING** | Path A/B is traversal fork, not alts | Post-story continue hook | UI after story / on Near Me | Replacing sequence advance silently |
| 10 | Hero experiences | **EXISTS** | 21 `HERO_STOP_IDS`; narration in manifest | Journey ritual | Role metadata; inventory vs sequence drift | Treating all 21 as equal reveals |
| 11 | Discovery content model | **MISSING** | Inserts ≠ discoveries | Inserts/optional promotion as **inspiration only** | `d_…` records + loader | Modeling discoveries as full waypoints |
| 12 | Discovery Near Me surfacing | **MISSING** | — | Map/Tour list patterns | Pins/list rows | Separate discovery map app |
| 13 | Discovery post-story surfacing | **MISSING** | — | `onStoryComplete` / before `completeWaypointAndAdvance` | Offer 0–2 discoveries | Blocking advance forever |
| 14 | Reveal tier metadata | **MISSING** | Only `reconstruction` blob | Manifest field site | `worthwhile` / `flagship` | Labeling all loops flagship |
| 15 | Worthwhile reveal set | **PARTIAL** | 2 still Then≠Now; ~18 then=now+loop; ancient stills often on disk unused | Threshold.jsx | Curate 8–10 + wire stills | Counting video-only as worthwhile without review |
| 16 | Flagship reveal set | **MISSING** | No tier; Colosseum has richest hotspots | `reconstructionHotspots.js` | Human pick 3 after curation | Premature flagship in code |
| 17 | Threshold hold interaction | **EXISTS** | `Threshold.jsx`, chrome hide, teach-once utils | C7 / overlay | Perf guard for many loops | Hydrating all videos offline |
| 18 | Geofence guidance | **EXISTS** | JourneyShell dwell, Mapbox legs, companion phases | mapStops, route cache | MAP only consumes | Dev Santiago overrides in prod builds if mis-flagged |
| 19 | Hero narration | **EXISTS** | Manifest chapters + AudioEngine | EN/ES paths | — | ES file missing for new chapter |
| 20 | Grounded retrieval corpus | **MISSING** | Transcripts exist in manifest/overlays but no retrieval index | Transcript fields | Chunk/index over shipped copy | Indexing landing FAQ as truth |
| 21 | Grounded Q&A retrieval | **MISSING** | No LLM/RAG/pgvector in runtime | — | Retrieval + refuse | Open chatbot |
| 22 | Unsupported-question refusal | **MISSING** | — | — | Explicit refuse path | Hallucinated answers |
| 23 | Offline pack | **EXISTS** | `offlinePackage.js` + SW media/map caches | App Entry prepare | — | Dual offline stacks confusion |
| 24 | Offline discoveries | **MISSING** | Collectors don’t know discoveries | Manifest-driven collectors | Add discovery assets to collectors | Assuming waypoint-only packs |
| 25 | Offline reveal assets | **PARTIAL** | Stills/loops collected from manifest; videos on-demand hydrate (OOM note) | `collectManifestMediaPaths` | Tiered pack policy for flagship | Packing all mp4s |
| 26 | Offline Q&A corpus | **MISSING** | — | — | Pack compact corpus | Huge embedding DBs on device |
| 27 | Same-day resume | **EXISTS** | `pendingResumeCue` + `C8dResume` + journey persist | `journeyResume.js` | Audio chapter position not restored | Users expect mid-track resume |
| 28 | Next-day resume | **EXISTS** | Rome TZ day boundary → `new_day` cue | same | Near Me bias to unfinished | Forcing linear restart |
| 29 | Free Pantheon compatibility | **PARTIAL** | `/free-pantheon` public w17 preview; no `cw_journey_v1` | Preview controller | Keep preview outside entitled Near Me pool | Free-city browsing if Near Me ignores entitlement |
| 30 | EN compatibility | **EXISTS** | Default locale; unprefixed audio | I18nProvider | — | — |
| 31 | ES compatibility | **EXISTS** | Overlays + `/rome/audio/es/…` | heroStopAudioMap | New types need overlay+audio | English-only discoveries |
| 32 | Commerce entitlement compatibility | **EXISTS** | Catalog → entitlement → pace → tier waypoints | pendingPurchase, accessSession | Recommendations must filter unlock | Navigating to locked heroes |
| 33 | Family/couple compatibility | **EXISTS** | Seats; content=`rome-complete` | familyWalk | Near Me per seat same unlock | Seat UX ≠ content graph |
| 34 | Killer-loop analytics | **PARTIAL** | `journey_begin`, `waypoint_arrived`, `story_complete`, `threshold_hold`, `resume` | `track.js` / analytics.ts | app open, permission, approach, story start, next-place, offline, Q&A | Measuring MAP without events |

---

## E. Killer-loop implementation gaps

### Near Me
- **Have:** GPS permission helper, watch position, accuracy gates, nearest unlocked stop jump on Tour.  
- **Gap:** Not default entry; no ranked multi-result UI; no discovery pins; location-denied path doesn’t offer a first-class Near Me degraded mode.  
- **Extend:** `RedesignMyTourScreen` nearest logic + new entitled home surface that **reuses** jump/journey — do not new GPS stack.

### Discover / recommend
- **Have:** Unlock filtering; pace as coarse “how much Rome.”  
- **Gap:** interestTags, timeCostMin, traveler budget, ranking, primary+alternates.  
- **Extend:** Rank over **manifest place IDs** (and later discovery IDs) already returned by `getTourWaypointIds`.

### Reach place
- **Have:** Mapbox walking directions, route cache, approaching/arrived, off-route companion, Path A/B.  
- **Gap:** None blocking; keep guidance ≠ recommendation separation.

### Spatial story
- **Have:** Full story ritual + EN/ES narration.  
- **Gap:** Hero “role” metadata only.  
- **Risk:** `enc_circus` inventoriable but not on committed sequences.

### Then/Now
- **Have:** Production Threshold hold; teach-once; chrome hide; offline stills path.  
- **Gap:** Tier metadata; curated 8–10; most manifest `then===now` while stronger ancient stills often sit unused on disk.  
- **Extend:** manifest `reconstruction` + selective `then` rewiring — not a new AR stack.

### Ask / follow curiosity
- **Have:** Landing FAQ only; stillness `observation` analytics (not Q&A).  
- **Gap:** Discovery model; retrieval corpus; refuse behavior.  
- **No** production LLM/RAG to reuse (Gemini docs = asset ops only).

### Choose next
- **Have:** Linear `completeWaypointAndAdvance`; jump-to-waypoint; own-pace subset.  
- **Gap:** Post-story recommendation overlay before advance.  
- **Safest insert:** UI gate in JourneyShell around story complete → then existing advance/jump.

### Resume offline
- **Have:** Journey persist, same/next day cues, Rome offline audio+map pack, 48h access lease.  
- **Gap:** Mid-story audio position; discovery/Q&A in packs; entitled Near Me after resume.  
- **Kill behavior:** walking/story restore state/index; threshold hold does not restore mid-gesture; audio restarts.

---

## F. Reveal inventory

Source: committed `manifest.json` reconstruction fields (+ disk notes from `public/waypoints/**`).

| placeId | Manifest then≠now? | Loop? | Runtime | Perf note | MAP candidate (for later human curation) |
|---------|-------------------|-------|---------|-----------|------------------------------------------|
| w01 Colosseum | No (then=now) | Yes | Hold+video | Video OOM if mass-hydrated | **Likely** (hotspots + assets; wire ancient still) |
| w02 Interior | No | Yes | Loop | Video | **Likely** |
| w03 Titus | No | Yes | Loop | Video | Unlikely (weak stills) |
| w04 Palatine | No (chapter Circus pair stronger) | Yes | Loop | Video | **Mixed** — chapter Circus **likely** |
| w06 Maxentius | No | Yes | Loop | Video | Unlikely |
| w07 Via Sacra | No | Yes | Loop | Video | Unlikely |
| w08 Vesta | No | Yes | Loop | Video | Unlikely |
| pause | None | — | — | — | No |
| w10 Rostra | **Yes** | Yes | Strong still+video | OK | **Likely** |
| w11_12 Severus | **Yes** (+ Curia ch) | Yes | Strong | OK | **Likely** |
| w13 Capitoline | No (ancient still on disk) | Yes | Loop | Video | **Likely if then wired** |
| w14 Trajan | No | Yes | Loop | Video | Unlikely |
| w15 Spanish Steps | No | Yes | Loop | Video | Unlikely |
| w16 Trevi | No | Yes | Loop | Video | Unlikely |
| w17 Pantheon | No (ancient still on disk) | Yes | Loop | Video | **Likely if then wired** |
| w23 Pantheon interior | None | — | Weak | — | Unlikely as Then/Now |
| w18 Navona | No (ancient on disk) | Yes | Loop | Video | **Likely if then wired** |
| w19 Campo | No (ancient on disk) | Yes | Loop | Video | **Likely if then wired** |
| w20 Largo Argentina | No (ancient on disk) | Yes | Loop | Video | **Likely if then wired** |
| w21 Castel | No (ancient on disk) | Yes | Loop | Video | **Likely if then wired** |
| enc_circus | No (ancient on disk) | Yes | Loop | Video | **Likely** — also sequence-membership risk |
| w22 Appia | No | Yes | Loop | Video | Unlikely |

**Do not assign flagship in code yet.** Evidence suggests curation pool starts from: w01/w02, w10, w11_12, w17 (if stills), enc_circus/w04 chapter, plus disk-backed centro stops after then-wiring. Target remains **8–10 worthwhile / 3 flagship** after human review.

---

## G. Offline / resume findings

| Finding | Severity | Detail |
|---------|----------|--------|
| Rome pack is manifest-driven | — | New types must be added to collectors or they won’t download |
| Video hydrate policy | **HIGH** for reveals | Comments warn iOS OOM if all reconstruction videos blob-hydrated; stills-first is intentional |
| Dual offline systems | **MEDIUM** | Rome Cache API pack vs generic IDB tour package — MAP should extend Rome pack |
| Map tile bounds from Path A geos | **MEDIUM** | Discoveries far off Path A may lack offline tiles |
| Audio position not persisted | **MEDIUM** vs MAP “resume” bar | Story restarts; place/sequence restore |
| Threshold mid-hold not persisted | **LOW** | Acceptable; teach-once flags persist |
| ES doubles narration bytes | **MEDIUM** | Offline size grows with locale |
| SW landing media cache poison history | **LOW** for MAP | Known deploy race; hashed assets + TTL mitigations exist |
| Free Pantheon not in journey/offline pack | — | Correct; keep preview separate |

---

## H. Commerce / unlock findings

| Finding | Severity | Detail |
|---------|----------|--------|
| Safest MAP `unlockScope` | — | Runtime pace/`TOUR_TIER_WAYPOINTS` over `wXX` (fed by `contentProductId`) |
| SKU → pace | — | central←rome-central; classic←rome-essential; heroic←rome-complete/couple/family; own only with Eterna-class |
| Central 10 vs marketed 8 | **MEDIUM** | Product truth drift; ranking must use tier lists not landing counts |
| Classic includes `enc_circus` + `pause` but sequences omit `enc_circus` | **HIGH** for inventory honesty | Near Me/recommend can surface an unlockable ID with no sequence slot |
| Ghost tour shows full locked catalog | **LOW** if labeled | Must not copy into entitled Near Me without lock semantics |
| Family/couple | — | Seat limits; same Eterna content — compatible |
| Legacy `tourEntitlements` slug tours | **MEDIUM** if reused | Parallel store — MAP must not read it for unlock |

**Hard rule:** recommendation and Near Me may **navigate/start only** places in `getTourWaypointIds(...)` (plus free-preview allowlist outside journey).

---

## I. Architecture decisions required before coding

| Decision | Evidence | Safest Day-1 choice | Reversible? | If wrong |
|----------|----------|---------------------|-------------|----------|
| Where discovery objects live | No discovery type; inserts are audio-only | Records keyed `d_…` **beside** manifest (or `manifest.discoveries`), always `placeId?` + optional geo; loaded through manifest loader | Yes if adapter kept | New registry → parallel app |
| Discovery geo | Geofences are waypoint-centric | Default: **inherit place geo**; optional micro-geo only when needed | Yes | Orphan pins / pack bounds miss |
| Recommendation operand | Guidance already separate | Rank **`placeId` / `discoveryId` strings**, then call existing jump/guidance | Yes | Tour-stop objects from kebab |
| Unlock representation | Working chain | Keep **pace + `TOUR_TIER_WAYPOINTS`** as unlockScope; do not new entitlement model | Prefer stable | SKU redesign mid-sprint |
| interestTags / timeCostMin home | Generator vs JSON hybrid | Author in **manifest source fields** (and generator when reconciled); projections may copy | Medium | Tags only in React constants |
| Reveal tier attachment | `reconstruction` already on waypoints | Add `revealTier: null \| 'worthwhile' \| 'flagship'` next to reconstruction | Yes | Parallel reveal table |
| Discovery progress | `completedWaypointIds` is hero-shaped | Separate `completedDiscoveryIds[]` inside journey context (or side key), **never** overload waypoint completion | Medium | Corrupt hero resume |
| Offline new assets | Collectors assume manifest media/audio | Extend Rome collectors; Q&A = small JSON in pack | Yes | Second offline subsystem |
| Q&A corpus | No RAG stack | Deterministic retrieval over shipped transcripts/copy; refuse else; generate corpus in build | Yes | Cloud LLM dependency |
| Localization for new types | Overlay-by-file pattern | Require ES overlay (+ audio if narrated) in same PR as EN content | Yes | English-only MAP surfaces |
| Entitled default home | Today begin→journey | Near Me as first **post-begin** companion surface without deleting begin/setup | Yes | Break App Entry / offline prepare |

---

## J. Irreversible / high-risk risks

| Risk | Rank | Why |
|------|------|-----|
| Extending kebab/`*-tour.js` as place graph | **HIGH** | Permanent dual product; unlock/geo/audio diverge |
| New progress store beside `cw_journey_v1` | **HIGH** | Split resume; cloud hydrate fights |
| Packing all reveal MP4s into offline hydrate | **HIGH** | iOS memory failures |
| Open LLM Q&A without refuse/grounding | **HIGH** | Trust + offline + cost |
| Ignoring `enc_circus` sequence drift | **HIGH** | Fake “21 on path” / broken jumps |
| Mixing free Pantheon into entitled Near Me pool | **MEDIUM** | Accidental free-city product |
| Using landing stop counts for unlock | **MEDIUM** | Central 8 vs 10 |
| Regenerating manifest without reconciliation | **MEDIUM** | Wipe hand transcripts/sequences |
| Native/Capacitor as Day-1 dependency | **MEDIUM** | Blocks PWA ship (only optional haptics bridge exists) |
| Analytics blind spots | **MEDIUM** | Cannot prove killer loop |
| Dual offline stacks “pick the wrong one” | **LOW–MEDIUM** | Wasted work, not user-visible if Rome pack used |

---

## K. Recommended implementation order

Contract order mostly holds. Repository evidence adds **one prerequisite** and one parallel track:

0. **Merge / treat MAP contract as SoT** (PR #281) so sprint shares vocabulary.  
1. **Content-model fields on manifest authority** — `interestTags`, `timeCostMin`, `revealTier`, `discoveries[]` (or sibling module imported by manifest loader). *No UI yet.*  
2. **Inventory honesty fix (prerequisite)** — resolve `enc_circus` (and document central 8 vs 10) so Near Me cannot jump to impossible sequence slots. *Content/ops PR, still not “features.”*  
3. **Reveal curation pass** — wire worthwhile `then` stills where disk supports; set tiers; demote weak.  
4. **Author discoveries** (15–30) against model from (1).  
5. **Near Me surface** — entitled entry using existing GPS + unlock + jump.  
6. **Recommendation ranking** — primary + alternates on place/discovery IDs; post-story insert point.  
7. **Discovery loop integration** — Near Me + post-story.  
8. **Grounded Q&A beta** — corpus from shipped text; refuse path. *(May parallel after (1) once corpus pipeline exists.)*  
9. **Offline/resume hardening** — collectors + pack size + resume into Near Me.  
10. **Analytics instrumentation** for loop steps (can parallel from (5)).  
11. **Acceptance pass** against MAP §8.

**Why change vs pure contract:** step (2) is forced by sequence/tier evidence; without it, Near Me/recommend will encode today’s drift into product behavior.

---

## L. Proposed Day-3 first implementation task

**One bounded task:** *Manifest-adjacent content-model scaffold (fields + loaders + tests) — no UI, no ranking, no discoveries authored at volume.*

### Killer-loop step strengthened
Enables **all later steps**; does not itself change traveler-facing loop yet (foundation for discover/recommend + reveals).

### Files expected to change
- `src/content/rome/manifest.json` **or** a sibling `src/content/rome/mapContent.js` imported by `manifest.js` (prefer sibling if avoiding huge JSON churn)  
- `src/content/manifest.js` (normalize/pass-through new fields)  
- Tests under `src/content/__tests__/` (schema defaults, unknown fields ignored, unlock helpers untouched)  
- Short note in `docs/ADD_STOP_OR_PACKAGE.md` pointing at new fields  
- Optionally align types/comments in `tourProductTruth.js` **read-only**

### Files that must **not** change
- `commerce/launchCatalog.json` / generated commerce consumers  
- `tourTiers.js` membership (except in a separate inventory-fix PR)  
- `JourneyShell` transitions / `cw_journey_v1` shape (no progress fields yet)  
- `offlinePackage` collectors (until assets exist)  
- `*-tour.js`, `tourRegistry`, landing route arrays  
- Audio binaries / Threshold runtime  
- Free Pantheon preview controllers  

### Acceptance tests
- Loader returns default `revealTier: null`, empty `interestTags`, and empty discoveries list without breaking existing walk.  
- EN journey begin → first waypoint story still works (smoke).  
- ES locale overlay still applies to existing waypoints.  
- `getTourWaypointIds` unchanged for central/classic/heroic.  
- No new analytics required.

### Rollback boundary
Revert the scaffold PR; runtime identical to pre-scaffold because fields are additive/ignored by UI.

---

## M. Unknowns

| Unknown | Why unresolved from repo alone |
|---------|--------------------------------|
| Whether Cloudflare Pages production branch config always = `figma` | Inferred from docs/deploy history; not from CF dashboard access |
| Exact ancient-still quality for “worthwhile” | Needs human visual review of disk assets vs video loops |
| Whether `enc_circus` omission from sequences is intentional product cut or bug | Acts/tier/HERO include it; sequences don’t — needs owner call |
| Cloud journey hydrate conflict matrix for new context fields | `journeyCloud.js` exists; field-level merge rules not fully proven here |
| Real-world GPS accuracy distribution in centro | Code thresholds exist (60 m); field metrics not in repo |
| Offline pack size budget on target devices | Estimates possible; device QA not run in this audit |
| Whether any private/untracked RAG experiment exists outside repo | Not present in this tree / package.json |
| MAP contract merge timing vs Day-3 start | Contract still on PR branch at audit time |

---

## Appendix — Anti-parallel-app checklist

| Temptation | Extend instead |
|------------|----------------|
| New place registry | `manifest.json` waypoint keys |
| New progress store | `cw_journey_v1` context (+ additive fields) |
| Separate discovery navigation shell | Near Me / Tour / post-story sheets on existing routes |
| Duplicate map | `MapScreen` / mapStops |
| Recommendation as new “tour product” | Ranker → `jumpToWaypoint` / sequence advance |
| New entitlement model | Existing pace unlock scopes |
| Second offline system | `offlinePackage.js` collectors |
| Second i18n framework | `I18nProvider` + ES overlays + audio path convention |
| Native dependency | Keep PWA; Capacitor haptics remain optional |

---

*End of Day-2 audit. Deliverable is this document only.*
