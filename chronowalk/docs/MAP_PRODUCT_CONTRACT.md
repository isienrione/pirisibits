# ChronoWalk Minimum Aspirational Product (MAP) Contract

**Target date:** 23 Aug (Day-1 Rome)  
**Status:** Frozen product contract — source of truth for sprint scope  
**Runtime:** ChronoWalk PWA on `figma` → chronowalk.com  
**Rule:** If a task does not strengthen the killer loop, it is out of scope.

This document is operational. It defines what Day-1 *is*, what IDs mean, what we ship, and what we refuse. It is not a vision deck.

---

## 0. Audit snapshot (current → Day-1)

Today Rome is **one linear act-sequenced walk** of **21 narrated visit stops** (`wXX` / `enc_circus`), sold as **3 unlock packages + 2 seat bundles**, with **Threshold** as a 2D press-hold Then/Now overlay. Closest “Near Me” is Tour → “Start from where I am.” There is **no** discovery content type, **no** flagship reveal tier, **no** interest tags, and **no** in-walk grounded Q&A.

| Current noun | Day-1 noun | Resolution |
|--------------|------------|------------|
| Visit waypoint / “hero stop” (all 21 equal) | **Hero experience** (same 21 places; unequal roles for reveals) | Keep place IDs; add **role + reveal tier** metadata — do not invent a second place graph |
| Insert / optional beat / secondary curiosity | **Discovery** | New content class (15–30), place-linked; not a second tour product |
| `reconstruction` on a stop | **Reveal asset** | Curate 8–10 worthwhile + mark 3 **flagship**; demote weak Then=Now overlays |
| Package / pace / Path A\|B (“route”) | **Unlock scope** + **recommendation** | Commerce SKUs stay unlock filters; in-walk “next” is recommendation over the place pool |
| “Start from where I am” | **Near Me** | Elevate to primary entry mode, not a Tour footnote |
| Landing FAQ | **Grounded Q&A (beta)** | In-walk, place-scoped, retrieval-only — not a chatbot personality |

**Non-negotiable:** extend the existing Rome manifest/journey — do **not** build a parallel “MAP app” beside packages/stops.

---

## 1. User promise (one sentence)

**Open ChronoWalk near a Roman place, get a sharp spatial story and a real Then/Now when it earns it, follow curiosity without getting lost, and pick up tomorrow offline.**

Day-1 is judged by whether a traveler can complete that promise in the historic center without a guide and without us reinventing the product mid-sprint.

---

## 2. Killer loop (the only loop)

Every Day-1 feature must map to one or more steps:

```
open Near Me
  → discover / recommend
  → reach place
  → spatial story
  → Then/Now (when worthwhile)
  → ask / follow curiosity
  → choose next
  → resume offline
```

| Step | Traveler outcome | Day-1 bar |
|------|------------------|-----------|
| **Open Near Me** | App opens into “what’s around me / start here,” not a catalog lecture | GPS (or graceful deny) → ranked nearby heroes + discoveries |
| **Discover / recommend** | Clear next 1–3 options by distance, time left, and interest | Not a generative itinerary engine |
| **Reach place** | Reliable guidance to the geofence | Existing walk/transit chrome; no AR navigation |
| **Spatial story** | Audio + copy that only makes sense *here* | Hero narration at the place; chapters OK |
| **Then/Now** | Press-hold reveal that actually changes understanding | Only on curated worthwhile / flagship set |
| **Ask / follow curiosity** | Short grounded answers + optional discovery nearby | Beta; refuse unknown; no free-form hallucination |
| **Choose next** | One primary recommendation + 1–2 alternates | Time + interest + distance; packages only limit *unlock*, not *sense* |
| **Resume offline** | Same place in the loop after kill/airplane mode | Download pack + journey resume cues |

If a proposal cannot name its killer-loop step, it does not ship in this sprint.

---

## 3. Content architecture & stable IDs

### 3.1 Place ID (canonical)

- **Canonical journey IDs** stay: `w01`…`w23`, `enc_circus`, `pause` (rest is not a hero).
- **Media/landing kebab slugs** (`colosseum`, `appian-way`, …) remain aliases only (`SLUG_ALIASES`). Day-1 work must not invent a third ID scheme.
- One place → one canonical ID. Marketing lists that split/join places (e.g. Saturn vs Curia) must reconcile to journey IDs in content ops, not in a new graph.

### 3.2 Content types

| Type | Meaning | Day-1 inventory | Stable fields (conceptual) |
|------|---------|-----------------|----------------------------|
| **Hero experience** | Primary place story: geofence, narration, optional chapters, photo | **21** — existing `HERO_STOP_IDS` | `placeId`, `role: hero`, `acts[]`, `chapters[]`, `unlockScopes[]`, `interestTags[]`, `timeCostMin` |
| **Discovery** | Shorter curiosity beat tied to a place or micro-location; browseable in Near Me / after ask | **15–30** | `discoveryId` (`d_…`), `placeId?`, `geo?`, `audio?` / `copy`, `interestTags[]`, `unlockScopes[]`, `timeCostMin` (usually 1–4) |
| **Reveal asset** | Then/Now (or equivalent) media + hold interaction | **8–10 worthwhile**; of those **3 flagship** | `revealId` (`r_…`), `placeId`, `tier: worthwhile \| flagship`, `then`, `now`, `loop?`, `teachOnce?` |
| **Transit** | Guided walk audio between places | Keep existing `tXX` as needed | Not a hero; not a discovery |
| **Recommendation** | Ordered suggestion over unlocked places/discoveries | Runtime, not a SKU | Inputs: geo, time budget, interests, unlock scope, visit history |

**Definitions that remove ambiguity**

- **Hero ≠ “has Threshold.”** A hero is a full place story. Reveals attach to heroes (rarely discoveries) only when the visual earns a stop in the loop.
- **Discovery ≠ incomplete hero.** If it needs a full chapter arc and geofence ritual, it is a hero (or out of scope). Discoveries are short, optional, curiosity-shaped.
- **Reveal asset ≠ every `reconstruction` field.** Today many stops declare Then=Now. Day-1 **worthwhile** means a traveler would notice and remember the change; **flagship** means the moment we would show in a demo (expect Colosseum-class + two others once curated).
- **Living Postcard (Day 3C sealed):** Ambition, quality levels, four flagship **targets** (`w01`, `w17`, `w03`, `enc_circus`), seven worthwhile targets, and target-vs-shipped rules live in `docs/MAP_REVEAL_STRATEGY.md`. Runtime `revealTier` reflects QA-passed shipping state only — not aspiration. Acceptance remains **8–10** worthwhile overall with **≥3** flagship-grade.
- **Route/recommendation ≠ package.** A package answers “what did they buy?” A recommendation answers “what should they do next?”

### 3.3 Unlock scopes (commerce — unchanged SKUs)

Keep product IDs; treat them as **unlock scopes** over the place pool:

| SKU | Unlock scope ID (in-walk) | Day-1 meaning |
|-----|---------------------------|---------------|
| `rome-central` | `central` | Centro heroes (+ their attached discoveries/reveals) |
| `rome-essential` | `classic` | Ancient-core heroes |
| `rome-complete` / couple / family | `heroic` (+ optional `own`) | Full 21-hero pool |

Day-1 may **rebalance which heroes sit in which scope** only if product truth stays coherent; it must not add new paid SKUs for MAP.

Path A/B remains a **traversal preference**, not a product.

### 3.4 Interest & time (operational, not vague)

- **Interest tags (closed set for Day-1):** e.g. `empire`, `republic`, `sacred`, `everyday`, `spectacle`, `engineering`, `artists` — max ~8 tags; every hero/discovery gets 1–3.
- **Time adaptation:** recommendations use `timeCostMin` + traveler-declared budget (short / half-day / full). No generative day-planner.
- **“Adaptive”** in this contract means: re-rank the next options when location, remaining time, interests, or unlock scope change — not ML itineraries.

---

## 4. Primary entry states

| State | When | Traveler lands in | Success |
|-------|------|-------------------|---------|
| **Fresh unlock** | Just purchased / redeemed | Prepare (A2HS + offline) → permissions → interests/time (light) → **Near Me** | First recommendation within one minute of GPS |
| **Free Pantheon** | Preview entitlement | Constrained Near Me / Pantheon hero path | Can complete free loop; upsell does not break resume |
| **Resume same day** | `cw_journey_v1` resumable | Resume cue → continue loop at last place / next recommend | No re-onboarding |
| **Resume new day** | New calendar day + progress | New-day cue → Near Me biased to unfinished heroes | Does not force linear restart unless traveler chooses |
| **Cold open, entitled** | Returning, idle | **Near Me** (not marketing homepage inside the app shell) | Killer loop step 1 |
| **No ticket** | No entitlement | Existing no-ticket / preview paths only | Do not build a shadow free city product |

Landing marketing (`/`, packages, hero slideshow) remains acquisition. **In-app Day-1 spine is Near Me → loop**, not package browsing.

---

## 5. Navigation hierarchy

**In-app primary chrome (Day-1 intent)**

1. **Near Me** — default home for entitled travelers (elevated from today’s Tour footnote).  
2. **Walk / guidance** — active navigation + arrival + story + reveal (existing companion states).  
3. **Map** — orientation; pins for heroes / discoveries / reveals as density allows.  
4. **Tour / list** — inventory of unlocked heroes (and discoveries); jump / “walk here.”  
5. **Journal** — visited memory; secondary.  
6. **Settings** — language, offline download, audio, route/unlock tools.

**Shell rule:** during story + flagship reveal, chrome gets out of the way (existing Threshold hide behavior). Do not add new tab destinations for Q&A or discoveries — they hang off Near Me / place / ask.

**State machine:** keep `idle → walking → approaching → arrived → story → (threshold) → …` as the place ritual. Recommendations feed *which* place enters that machine; they do not replace it.

---

## 6. Shared core vs later native enhancement

### Day-1 shared core (PWA — ships)

- Rome manifest + place IDs + unlock scopes  
- Near Me ranking + recommendation inputs  
- Hero story playback + geofence ritual  
- Curated worthwhile / flagship Threshold reveals (2D hold)  
- Discovery content objects + surfacing  
- Grounded Q&A beta (retrieval over shipped copy/transcripts)  
- Offline pack download + journey resume  
- EN/ES locale for shipped surfaces  
- Commerce entitlements (existing)

### Explicitly later / native enhancement (not Day-1)

| Capability | Why postponed |
|------------|---------------|
| Full **VPS / world-tracked AR** | Native + ops heavy; Threshold 2D is the Day-1 reveal |
| **Spatial Audio / AirPods** advanced staging | Enhancement of story, not the loop’s existence |
| **Native app rewrite** (Swift/RN/Capacitor shell as product) | PWA is the ship vehicle |
| Fully **generative itinerary** engine | Conflicts with “recommend, don’t invent a second product” |
| **Social / gamification** (streaks, leaderboards, public profiles) | Not in the killer loop |
| **Dozens of new full audio tours** / new cities | Inventory discipline: deepen Rome loop first |
| Rich multiplayer beyond existing walk-together reliability | Only keep what already supports “resume with companion”; no new social surface |

Native may later wrap the same place IDs, unlock scopes, and reveal assets. **No Day-1 feature may require a native binary.**

---

## 7. Explicit non-goals (sprint freeze)

Do **not** schedule, prototype as “almost Day-1,” or sneak into PRs:

1. Full VPS / AR navigation or occlusion  
2. Spatial AirPods / advanced binaural productization  
3. Native rewrite or dual-client feature parity program  
4. Fully generative itinerary / LLM tour author  
5. Social feed, badges, points, referral games  
6. Dozens of new full-length audio tours or a second city  
7. Rebuilding commerce SKUs or checkout for MAP aesthetics  
8. A parallel “discovery app” with different IDs, shell, or progress store  
9. Making every existing reconstruction “flagship” by renaming  
10. Open-ended chatbot that answers outside shipped Rome sources  

---

## 8. Day-1 acceptance criteria (product-level)

A build is Day-1-ready only if **all** are true:

### Loop & entry
- [ ] Entitled cold open lands in **Near Me**, not a dead catalog.  
- [ ] From Near Me, traveler can start guidance to a nearby unlocked hero in ≤ 2 taps after location permission.  
- [ ] Completing story → (optional reveal) → **choose next** returns a primary recommendation consistent with time + interest + unlock.  
- [ ] Kill app mid-loop; reopen → **resume** without losing place or entitlement.  
- [ ] Offline pack downloaded → loop steps work without network for audio/map already cached.

### Content inventory & quality
- [ ] **21** hero experiences addressable in-product with narration.  
- [ ] **15–30** discoveries shipped and reachable from Near Me or post-story curiosity (not only buried inserts).  
- [ ] **8–10** reveals labeled worthwhile with Then visibly different from Now (or an equivalent honest “wow” bar).  
- [ ] **3** reveals labeled **flagship**, demo-scripted, teachable once, performance-safe on mid phones.  
- [ ] Weak Then=Now overlays are **not** counted toward the 8–10.

### Adaptation & Q&A
- [ ] Traveler can set or update **time budget** and **interests**; recommendations change.  
- [ ] Grounded Q&A beta answers from shipped Rome sources at/near a place; **refuses** when unsupported; never blocks the loop if Q&A fails.

### Architecture integrity
- [ ] Single place ID space (`wXX` / aliases); no parallel progress system.  
- [ ] Packages remain unlock scopes; recommendations never unlock paid places silently.  
- [ ] EN default; ES available for shipped Day-1 surfaces without breaking audio paths.  
- [ ] Every merged PR in the sprint names its **killer-loop step** in the description.

### Explicitly not required for Day-1 accept
- Perfect Path A/B narrative symmetry for every discovery  
- Pixel-perfect marketing redesign  
- Q&A multilingual completeness beyond shipped locales  
- 100% of historical reconstructions upgraded  

---

## 9. Implementation dependency map

Order is constraint order, not calendar estimates.

```
[0] MAP contract (this doc)
        │
[1] Content model fields
    (place role, interestTags, timeCostMin,
     discovery records, reveal tier)
        │
        ├─[2a] Curate 8–10 worthwhile + 3 flagship
        │      (media + metadata; demote weak)
        └─[2b] Author/ship 15–30 discoveries
                │
[3] Near Me surface + ranking
    (needs [1], geo, unlock)
                │
[4] Recommendation “choose next”
    (needs [1], history, time)
                │
[5] Wire discoveries into loop
    (after story / Near Me)
                │
[6] Grounded Q&A beta
    (retrieval over transcripts/copy;
     can parallel after [1])
                │
[7] Offline + resume hardening
    against new surfaces
                │
[8] Acceptance pass against §8
    (device + content checklist)
```

**Dependency rules**

- Do not build Q&A UI before the retrieval corpus is the **shipped** hero/discovery copy.  
- Do not add discovery chrome before `discoveryId` records exist.  
- Do not call a reconstruction “flagship” in UI before the tier exists in content.  
- Commerce/landing package work is **out of band** unless unlock-scope truth breaks the loop.

**Sprint task → loop mapping (use in PR titles)**

| Theme | Loop step |
|-------|-----------|
| Near Me entry | open Near Me |
| Interest/time controls | discover / recommend |
| Guidance/geofence fixes | reach place |
| Hero audio/copy polish | spatial story |
| Reveal curation / Threshold perf | Then/Now |
| Discoveries + Q&A | ask / follow curiosity |
| Next-up recommender | choose next |
| SW / pack / resume | resume offline |

---

## 10. Vocabulary cheat sheet (use these words)

| Say | Don’t say (in Day-1 work) |
|-----|---------------------------|
| Hero experience / `placeId` | “Attraction,” “POI,” new slug-only IDs |
| Discovery / `d_…` | “Side quest,” “Easter egg” without an ID |
| Reveal / worthwhile / flagship | “AR,” “VPS,” “all Thresholds” |
| Unlock scope (`central`…) | “Route” when you mean SKU |
| Recommendation | “Itinerary engine,” “AI day plan” |
| Near Me | “Start from where I am” as the only name |
| Grounded Q&A | “ChatGPT guide,” “free chat” |

---

## 11. Ready check

This contract is ready when:

1. A reader can explain Day-1 ChronoWalk in one killer loop without naming AR, social, or a second city.  
2. Every remaining sprint task maps to a loop step in §2.  
3. “Hero vs discovery” and “web core vs native later” have no open forks — §3 and §6 decide.

**Owner question for disputed PRs:** *Which loop step does this strengthen, and which non-goal does it risk?* If neither answer is crisp, it waits.
