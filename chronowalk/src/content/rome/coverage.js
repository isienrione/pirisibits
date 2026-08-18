/**
 * Geographic coverage membership for Rome content.
 * Native UI uses these scope ids only — never web SKU names.
 *
 * Boundary notes (not guessed silently):
 * - d_rome_09 Theatre of Marcellus and d_rome_10 Portico d'Ottavia sit on the
 *   Ghetto / Teatro Marcello edge. Assigned Historic Center because the
 *   product corridor names Ghetto there, not the Aventine–Velabro spine.
 * - d_rome_01–08 stay Ancient Rome (Aventine / Forum Boarium / Velabro).
 * - No Discovery is complete-only. Complete is the union.
 * - Free samples are a subset of Historic Center, near the free Pantheon.
 */

export const ROME_SCOPE_IDS = Object.freeze({
  FREE: 'rome-free',
  ANCIENT: 'rome-ancient',
  HISTORIC: 'rome-historic-center',
  COMPLETE: 'rome-complete',
})

export const DISCOVERY_IDS = Object.freeze(
  Array.from({ length: 30 }, (_, index) => `d_rome_${String(index + 1).padStart(2, '0')}`),
)

/** Ancient Rome Discoveries — southern ancient spine. */
export const ANCIENT_DISCOVERY_IDS = Object.freeze([
  'd_rome_01',
  'd_rome_02',
  'd_rome_03',
  'd_rome_04',
  'd_rome_05',
  'd_rome_06',
  'd_rome_07',
  'd_rome_08',
])

/** Historic Center Discoveries — Ghetto through Venezia / Corso. */
export const HISTORIC_DISCOVERY_IDS = Object.freeze([
  'd_rome_09',
  'd_rome_10',
  'd_rome_11',
  'd_rome_12',
  'd_rome_13',
  'd_rome_14',
  'd_rome_15',
  'd_rome_16',
  'd_rome_17',
  'd_rome_18',
  'd_rome_19',
  'd_rome_20',
  'd_rome_21',
  'd_rome_22',
  'd_rome_23',
  'd_rome_24',
  'd_rome_25',
  'd_rome_26',
  'd_rome_27',
  'd_rome_28',
  'd_rome_29',
  'd_rome_30',
])

/**
 * Free samples near the Pantheon so a guest sees both a deep Experience
 * and lightweight noticing — not only the Pantheon Hero.
 */
export const FREE_DISCOVERY_IDS = Object.freeze([
  'd_rome_19', // San Luigi Caravaggios — indoor art, 4 min from Pantheon
  'd_rome_21', // Pie di Marmo — 2-minute street fragment on the walk
  'd_rome_22', // Bernini elephant — iconic, beside Santa Maria sopra Minerva
  'd_rome_24', // Sant'Ignazio false dome — visual noticing, nearby
])

export const FREE_DISCOVERY_RATIONALE = Object.freeze({
  'd_rome_19': 'Indoor art Discovery a few minutes from the free Pantheon.',
  'd_rome_21': 'Tiny street fragment on the Pantheon–Minerva walk; shows “small things”.',
  'd_rome_22': 'Iconic noticing beside Minerva, immediately next to the free Hero.',
  'd_rome_24': 'Planned visual illusion without pretending a Reveal exists yet.',
})

export const COMPLETE_DISCOVERY_IDS = Object.freeze([...DISCOVERY_IDS])

export const SCOPE_DISCOVERY_IDS = Object.freeze({
  [ROME_SCOPE_IDS.FREE]: FREE_DISCOVERY_IDS,
  [ROME_SCOPE_IDS.ANCIENT]: ANCIENT_DISCOVERY_IDS,
  [ROME_SCOPE_IDS.HISTORIC]: HISTORIC_DISCOVERY_IDS,
  [ROME_SCOPE_IDS.COMPLETE]: COMPLETE_DISCOVERY_IDS,
})

export function unlockScopesForDiscovery(discoveryId) {
  const scopes = []
  if (FREE_DISCOVERY_IDS.includes(discoveryId)) scopes.push(ROME_SCOPE_IDS.FREE)
  if (ANCIENT_DISCOVERY_IDS.includes(discoveryId)) scopes.push(ROME_SCOPE_IDS.ANCIENT)
  if (HISTORIC_DISCOVERY_IDS.includes(discoveryId)) scopes.push(ROME_SCOPE_IDS.HISTORIC)
  scopes.push(ROME_SCOPE_IDS.COMPLETE)
  return scopes
}

/**
 * Native offerings. Prices are presentation placeholders until StoreKit
 * supplies Product.displayPrice. Never treat EUR as commerce truth.
 */
export const ROME_NATIVE_OFFERINGS = Object.freeze([
  {
    offeringId: 'rome-ancient',
    unlockScopeId: ROME_SCOPE_IDS.ANCIENT,
    appleProductId: 'com.chronowalk.rome.ancient',
    displayName: 'Ancient Rome',
    tagline: 'Colosseum, Forum, Palatine & discoveries around ancient Rome',
    listPricePlaceholder: { amount: '6.99', currencyCode: 'EUR', isPlaceholder: true },
  },
  {
    offeringId: 'rome-historic-center',
    unlockScopeId: ROME_SCOPE_IDS.HISTORIC,
    appleProductId: 'com.chronowalk.rome.historiccenter',
    displayName: 'Historic Center',
    tagline: 'From Trajan to the Pantheon, Piazza Navona and Castel Sant’Angelo',
    listPricePlaceholder: { amount: '4.99', currencyCode: 'EUR', isPlaceholder: true },
  },
  {
    offeringId: 'rome-complete',
    unlockScopeId: ROME_SCOPE_IDS.COMPLETE,
    appleProductId: 'com.chronowalk.rome.complete',
    displayName: 'All Central Rome',
    tagline: 'Unlock the complete ChronoWalk Rome experience',
    listPricePlaceholder: { amount: '9.99', currencyCode: 'EUR', isPlaceholder: true },
  },
])

export function offeringForScope(scopeId) {
  return ROME_NATIVE_OFFERINGS.find((item) => item.unlockScopeId === scopeId) || null
}

export function coveringOfferingsForScopes(unlockScopes = []) {
  const wanted = new Set(unlockScopes.filter((id) => id !== ROME_SCOPE_IDS.FREE && id !== ROME_SCOPE_IDS.COMPLETE))
  const zone = ROME_NATIVE_OFFERINGS.filter((item) => wanted.has(item.unlockScopeId))
  const complete = ROME_NATIVE_OFFERINGS.find((item) => item.unlockScopeId === ROME_SCOPE_IDS.COMPLETE)
  const list = zone.length ? zone : []
  if (complete && !list.some((item) => item.offeringId === complete.offeringId)) list.push(complete)
  return list
}

/**
 * StoreKit later replaces placeholder via `storeKitProduct.displayPrice`.
 * @param {{ listPricePlaceholder: { amount: string, currencyCode: string, isPlaceholder?: boolean } }} offering
 * @param {{ displayPrice?: string } | null} storeKitProduct
 */
export function displayPriceForOffering(offering, storeKitProduct = null) {
  if (storeKitProduct?.displayPrice) {
    return { label: storeKitProduct.displayPrice, source: 'storekit' }
  }
  const amount = offering?.listPricePlaceholder?.amount
  const currency = offering?.listPricePlaceholder?.currencyCode
  const symbol = currency === 'EUR' ? '€' : `${currency} `
  return {
    label: `${symbol}${amount}`,
    source: 'placeholder',
  }
}

export const LEGACY_SKU_PATTERN = /historica|antica|eterna|roma eterna|rome-essential|rome-central/i
