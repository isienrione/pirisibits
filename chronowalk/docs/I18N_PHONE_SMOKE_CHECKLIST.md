# Real-phone smoke checklist — EN/ES ChronoWalk

Use a physical phone (iOS Safari and Android Chrome). Do **not** change commerce or entitlements during this pass.

## Prep

- [ ] Deploy or `npm run build && npm run preview` on a reachable URL
- [ ] Spanish narration files present at mapped paths (`npm run check:i18n:audio`)
- [ ] Clear site data once before the Spanish path (or use a private tab)

## English unchanged (control)

1. [ ] Open `/` with no `lang` param — UI is English; `<html lang="en">`
2. [ ] Shell tabs still read Walk / Tour / Map / Journal
3. [ ] Open free Pantheon (`/free-pantheon`) — English copy; preview audio is EN `w17_ch1.mp3` path
4. [ ] With access, open `/begin` → walk chrome — English approach/arrival for Colosseum
5. [ ] Settings → language shows **English** selected
6. [ ] Offline / restore / checkout CTAs still behave as before (no SKU changes)

## Spanish path

1. [ ] Open `/free-pantheon?lang=es` (or set Language → Español in Settings)
2. [ ] Confirm `<html lang="es">` and that the query param is stripped after boot
3. [ ] Kill the tab / reopen as Home Screen / cold start — language stays Español (`cw_locale_v1`)
4. [ ] Free Pantheon page: eyebrow, H1, lead, FAQ, CTAs all Spanish (no English leftovers in core blocks)
5. [ ] Pantheon preview audio requests `/rome/audio/es/narration/w17_ch1.mp3` (Network panel) and plays Spanish take
6. [ ] Shell tabs: Caminar / Recorrido / Mapa / Diario
7. [ ] Settings sheet fully Spanish labels; switching back to English restores EN without reload loops
8. [ ] On an entitled device, walk to Pantheon exterior + interior:
   - [ ] Titles: El Panteón / Interior del Panteón
   - [ ] Approach + arrival lines Spanish
   - [ ] Transcript Spanish for all four Pantheon chapters
   - [ ] Audio URLs use `/rome/audio/es/narration/w17_ch{1-4}.mp3`
9. [ ] Spot-check two other hero stops (e.g. Colosseum + Trevi): Spanish titles + Spanish primary audio URL
10. [ ] Map directions instructions appear in Spanish when locale is `es`
11. [ ] Toggle language mid-journey: UI + next narration resolve to the new locale; no crash; progress/entitlement intact

## Persistence matrix

| Action | Expected |
|--------|----------|
| Change language in Settings | Persists after app restart |
| `?lang=es` then navigate in-app | Stays Spanish |
| Background → foreground | Locale unchanged |
| Offline pack after choosing ES | Downloads ES narration paths |
| Purchase / access restore | Unaffected by locale |

## Automated gates before ship

```bash
npm run check:i18n
npm run check:i18n:audio
npm test -- src/i18n
```

## Fail criteria

- Any core walk/settings/Pantheon screen mixing EN+ES copy
- Pantheon transcript or audio still English while locale is `es`
- English default path regressing (wrong `/es/` prefix when locale is `en`)
- Missing any of the 21 hero-stop Spanish narration mappings/files
- Entitlement, SKU, or checkout behavior changed
