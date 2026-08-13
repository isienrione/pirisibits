/**
 * Test-only discovery fixtures. Not shipped in production MAP_DISCOVERIES.
 * Proves localization-ready copy shape (en + es) without authoring the 15–30 set.
 */

export const MAP_DISCOVERY_FIXTURES = Object.freeze([
  Object.freeze({
    discoveryId: 'd_test_rostra_coin',
    placeId: 'w10',
    geo: null,
    title: Object.freeze({
      en: 'A coin under the Rostra',
      es: 'Una moneda bajo los Rostros',
    }),
    summary: Object.freeze({
      en: 'A short curiosity beat about what the speaker’s platform once held.',
      es: 'Un breve latido de curiosidad sobre lo que una vez sostuvo la tribuna.',
    }),
    interestTags: Object.freeze(['empire', 'everyday']),
    unlockScopes: Object.freeze(['classic', 'heroic']),
    timeCostMin: 2,
    media: null,
    audio: null,
  }),
])
