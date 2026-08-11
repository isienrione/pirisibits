# Real-iPhone smoke checklist — EN/ES ChronoWalk (Step 0)

Use a physical iPhone (Safari). Optionally repeat on Android Chrome.  
Do **not** change commerce or entitlements during this pass.

## Prep

- [ ] Spanish MP3s placed at `public/rome/audio/es/narration/` (all 52 shipping narration files)
- [ ] `npm run check:i18n` passes
- [ ] `npm run check:i18n:audio` passes
- [ ] `npm run check:commerce-drift` passes
- [ ] `npm run build` succeeds
- [ ] Preview/deploy URL reachable on phone
- [ ] Clear site data once before TEST B (or use a private tab)

---

## TEST A — English regression

1. [ ] Open `/` with no `lang` param — English UI; `<html lang="en">`
2. [ ] Landing hero, pricing tiers, FAQ, footer English
3. [ ] Language control visible in landing header; shows English
4. [ ] `/free-pantheon` English; Network: `/rome/audio/narration/w17_ch1.mp3` (no `/es/`)
5. [ ] Enter purchase prep / consent copy English; prices unchanged (€4.99 / €9.99 / €14.99 / bundles)
6. [ ] With access: `/begin` onboarding English
7. [ ] Shell tabs: Walk / Tour / Map / Journal
8. [ ] Walk one paid stop (Colosseum): EN title, EN transcript, EN audio path
9. [ ] Then/Now honesty caption English
10. [ ] Offline download UI English; English narration paths collected
11. [ ] Access restore / settings English

## TEST B — Switch to Spanish

1. [ ] From landing header, select **Español** (or Settings → Language)
2. [ ] UI updates without new purchase; `<html lang="es">`
3. [ ] Pricing numbers/SKUs unchanged; Spanish labels around them
4. [ ] Route names/content Spanish (Roma Eterna etc. may stay product names)
5. [ ] No blank screens / reload loops

## TEST C — Persistence

1. [ ] Close tab; reopen same URL — Spanish persists (`cw_locale_v1`)
2. [ ] Add to Home Screen / cold launch PWA — Spanish persists
3. [ ] Enter purchased experience — Spanish persists
4. [ ] Open `/?lang=es` once — Spanish initializes and query is stripped

## TEST D — Free Pantheon

1. [ ] `/free-pantheon` all first-party UI Spanish
2. [ ] Includes / FAQ / upgrade CTAs Spanish
3. [ ] Transcript/content Spanish
4. [ ] Network: `/rome/audio/es/narration/w17_ch1.mp3`
5. [ ] Then/Now captions/hints Spanish

## TEST E — Paid Rome (entitled)

For each stop below, verify: title ES · chrome ES · transcript ES · Then/Now ES · audio `/rome/audio/es/narration/...`

1. [ ] **Colosseum** (`w01.mp3`)
2. [ ] **Roman Forum stop** (e.g. Via Sacra or Rostra)
3. [ ] **One short stop** (e.g. Temple of Vesta)
4. [ ] **One long stop** (e.g. Piazza Navona or Colosseum interior)
5. [ ] **Pantheon exterior + interior** (`w17_ch1`–`w17_ch4`)
6. [ ] Path choice / pause / act-complete chrome Spanish if encountered
7. [ ] Resume / journey-complete Spanish if encountered

## TEST F — Maps / location

1. [ ] Location permission explanation Spanish
2. [ ] Map bottom card / walking companion Spanish
3. [ ] Distance / approaching / arrived CTAs Spanish
4. [ ] Mapbox turn instructions Spanish when locale is `es`
5. [ ] Off-route / observing companion Spanish
6. [ ] GPS failure / retry messages Spanish (if triggerable)

## TEST G — Offline

1. [ ] With Spanish selected, start offline download
2. [ ] Network/cache requests use `/rome/audio/es/narration/...` for narration
3. [ ] Offline UI status strings Spanish
4. [ ] After download, airplane mode: Spanish story plays from cache

## TEST H — Error / empty states

1. [ ] Network offline banner Spanish
2. [ ] PWA update prompt Spanish (if shown)
3. [ ] Access invalid/expired messaging Spanish
4. [ ] Empty journal / empty directions messaging Spanish if reachable

## TEST I — Switch back to English

1. [ ] Select English in Settings or landing header
2. [ ] UI + next narration paths return to English immediately
3. [ ] Entitlement / progress intact
4. [ ] English audio paths unprefixed again

## TEST J — Purchase / checkout regression

1. [ ] Launch Offer amounts unchanged
2. [ ] Tier stop counts unchanged
3. [ ] Consent → Paddle overlay still opens
4. [ ] No SKU / price-id / discount-id changes
5. [ ] Access handoff after purchase still works in both locales

---

## Automated gates

```bash
npm run check:i18n
npm run check:i18n:audio   # must pass only after all 52 MP3s are present
npm run check:commerce-drift
npm run build
npm test -- src/i18n
```

## Fail criteria

- Mixed EN+ES on any core walk / settings / Pantheon / landing chrome while locale is `es`
- Spanish locale still requesting English narration paths
- English default path regressing to `/es/` prefix
- Missing any of the 52 shipping Spanish narration mappings/files
- Commerce / entitlement / SKU behavior changed
