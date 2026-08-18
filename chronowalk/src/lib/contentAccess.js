/**
 * Canonical Rome unlock-scope helper.
 *
 * Separates CAN ENTER APP (guest / paid session) from CAN CONSUME a Hero.
 * Everyone implicitly holds `rome-free` (Pantheon `w17` + `w23`). Paid
 * `contentProductId`s map onto geographic scopes. Guests never receive
 * `rome-complete`.
 *
 * Membership tables: docs/IOS_COMMERCE_MODEL.md
 */

import { HERO_STOP_IDS, PANTHEON_STOP_IDS } from '../i18n/audio/heroStopAudioMap.js'
import { hasValidLocalAccess, readAccessEntitlement } from './accessSession.js'
import { SCOPE_DISCOVERY_IDS, unlockScopesForDiscovery } from '../content/rome/coverage.js'

export const UNLOCK_SCOPES = Object.freeze({
  ROME_FREE: 'rome-free',
  ROME_ANCIENT: 'rome-ancient',
  ROME_HISTORIC_CENTER: 'rome-historic-center',
  ROME_COMPLETE: 'rome-complete',
})

/** Stored paid `contentProductId` → canonical scope. */
export const PAID_PRODUCT_TO_SCOPE = Object.freeze({
  'rome-essential': UNLOCK_SCOPES.ROME_ANCIENT,
  'rome-central': UNLOCK_SCOPES.ROME_HISTORIC_CENTER,
  'rome-complete': UNLOCK_SCOPES.ROME_COMPLETE,
  'rome-couple': UNLOCK_SCOPES.ROME_COMPLETE,
  'rome-family': UNLOCK_SCOPES.ROME_COMPLETE,
})

const ANCIENT_ROME_HERO_IDS = Object.freeze([
  'w01',
  'w02',
  'w04',
  'enc_circus',
  'w03',
  'w06',
  'w07',
  'w08',
  'w10',
  'w11_12',
  'w13',
])

const HISTORIC_CENTER_HERO_IDS = Object.freeze([
  'w14',
  'w15',
  'w16',
  'w17',
  'w23',
  'w18',
  'w19',
  'w20',
  'w21',
])

export const SCOPE_HERO_IDS = Object.freeze({
  [UNLOCK_SCOPES.ROME_FREE]: PANTHEON_STOP_IDS,
  [UNLOCK_SCOPES.ROME_ANCIENT]: ANCIENT_ROME_HERO_IDS,
  [UNLOCK_SCOPES.ROME_HISTORIC_CENTER]: HISTORIC_CENTER_HERO_IDS,
  [UNLOCK_SCOPES.ROME_COMPLETE]: HERO_STOP_IDS,
})

function uniqueIds(ids) {
  return [...new Set(ids.filter(Boolean))]
}

export function heroesForScope(scopeId) {
  return SCOPE_HERO_IDS[scopeId] ? [...SCOPE_HERO_IDS[scopeId]] : []
}

export function canonicalScopeForProduct(contentProductId) {
  if (!contentProductId) return null
  return PAID_PRODUCT_TO_SCOPE[contentProductId] ?? null
}

/**
 * Scopes this traveler currently holds.
 * `rome-free` is always granted. Paid scopes require a valid local entitlement.
 */
export function getGrantedScopeIds({
  entitled = hasValidLocalAccess(),
  entitlement = readAccessEntitlement(),
} = {}) {
  const scopes = new Set([UNLOCK_SCOPES.ROME_FREE])
  if (!entitled) return [...scopes]

  const productId = entitlement?.contentProductId || entitlement?.purchasedProductId || null
  const paidScope = canonicalScopeForProduct(productId)
  if (paidScope) {
    scopes.add(paidScope)
  } else if (entitled) {
    // Legacy / unknown paid session historically unlocked the full walk.
    scopes.add(UNLOCK_SCOPES.ROME_COMPLETE)
  }
  return [...scopes]
}

export function hasUnlockScope(scopeId, options) {
  return getGrantedScopeIds(options).includes(scopeId)
}

export function canAccessHero(heroId, options) {
  if (!heroId) return false
  const granted = getGrantedScopeIds(options)
  return granted.some((scopeId) => SCOPE_HERO_IDS[scopeId]?.includes(heroId))
}

export function canAccessDiscovery(discoveryId, options) {
  if (!discoveryId) return false
  const granted = getGrantedScopeIds(options)
  return unlockScopesForDiscovery(discoveryId).some((scopeId) => granted.includes(scopeId))
}

export function canAccessContentId(id, options) {
  if (!id) return false
  if (String(id).startsWith('d_rome_')) return canAccessDiscovery(id, options)
  if (String(id).startsWith('reveal:')) return canAccessHero(String(id).slice(7), options)
  return canAccessHero(id, options)
}

export function discoveriesForScope(scopeId) {
  return SCOPE_DISCOVERY_IDS[scopeId] ? [...SCOPE_DISCOVERY_IDS[scopeId]] : []
}

export function accessibleDiscoveryIds(options) {
  const granted = getGrantedScopeIds(options)
  return uniqueIds(granted.flatMap((scopeId) => discoveriesForScope(scopeId)))
}

export function hasCompleteRomeEntitlement(options) {
  return hasUnlockScope(UNLOCK_SCOPES.ROME_COMPLETE, options)
}

export function accessibleHeroIds(options) {
  const granted = getGrantedScopeIds(options)
  return uniqueIds(granted.flatMap((scopeId) => heroesForScope(scopeId)))
}

/**
 * Paid Rome player (`/journey`) vs guest remaining in the app shell.
 * Guests must not `begin()` the 21-stop walk.
 */
export function resolveUnlockedJourneyPath({ entitled = hasValidLocalAccess() } = {}) {
  return entitled ? '/journey' : '/home'
}

export function mayStartPaidRomeJourney({ entitled = hasValidLocalAccess() } = {}) {
  return entitled === true
}
