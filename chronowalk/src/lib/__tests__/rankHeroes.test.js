import { describe, expect, it } from 'vitest'
import { HERO_STOP_IDS } from '../../i18n/audio/heroStopAudioMap.js'
import { loadRomeManifest } from '../../content/manifest.js'
import { getRomeHeroCatalog } from '../../content/rome/heroCatalog.js'
import { ROME_HERO_META } from '../../content/rome/heroRecommendationMeta.js'
import { discoverCards, rankHeroes } from '../rankHeroes.js'
import { canAccessHero } from '../contentAccess.js'

describe('Rome hero catalog + ranker V0', () => {
  const manifest = loadRomeManifest()
  const catalog = getRomeHeroCatalog(manifest)

  it('covers all 21 Heroes with recommendation metadata', () => {
    expect(Object.keys(ROME_HERO_META).sort()).toEqual([...HERO_STOP_IDS].sort())
    expect(catalog).toHaveLength(21)
    for (const hero of catalog) {
      expect(hero.experienceId).toBeTruthy()
      expect(hero.placeId).toBeTruthy()
      expect(hero.geo?.lat).toBeTypeOf('number')
      expect(hero.geo?.lng).toBeTypeOf('number')
      expect(hero.interestTags.length).toBeGreaterThan(0)
      expect(hero.timeCostMin).toBeGreaterThan(0)
      expect(hero.whyWorthIt.length).toBeGreaterThan(8)
      expect(hero.unlockScopes.length).toBeGreaterThan(0)
      expect(hero.intrinsicPriority).toBeGreaterThan(0)
      expect(typeof hero.revealAvailable).toBe('boolean')
    }
  })

  it('returns at most one primary and two alternatives', () => {
    const ranked = rankHeroes({
      catalog,
      interestIds: ['architecture'],
      timeBudgetId: '30min',
      canAccess: (id) => canAccessHero(id),
      completedIds: [],
    })
    const cards = discoverCards(ranked)
    expect(cards.primary).toBeTruthy()
    expect(cards.alternatives).toHaveLength(2)
    expect([cards.primary, ...cards.alternatives].map((item) => item.heroId)).toHaveLength(3)
  })

  it('ranks Pantheon first near the porch with architecture and 30 minutes', () => {
    const ranked = rankHeroes({
      catalog,
      interestIds: ['architecture'],
      timeBudgetId: '30min',
      position: { lat: 41.89885, lng: 12.47687 },
      canAccess: (id) => canAccessHero(id),
      completedIds: [],
    })
    expect(ranked.primary.heroId).toBe('w17')
    expect(ranked.primary.whyReasons.some((reason) => /min away/.test(reason))).toBe(true)
    expect(ranked.primary.whyReasons).toContain('Matches architecture')
    expect(ranked.primary.whyReasons).toContain('Fits your 30 minutes')
    expect(ranked.primary.locked).toBe(false)
  })

  it('still ranks locked premium Heroes', () => {
    const ranked = rankHeroes({
      catalog,
      interestIds: ['ancient-power'],
      timeBudgetId: '1h',
      position: { lat: 41.8902, lng: 12.4922 },
      canAccess: (id) => canAccessHero(id),
      completedIds: [],
    })
    expect(ranked.ranked.some((hero) => hero.heroId === 'w01' && hero.locked)).toBe(true)
  })
})
