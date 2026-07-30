/**
 * ChronoWalk map HTML markers — dark pills with landmark glyphs + labels,
 * and a gold pulsing user-location ring for satellite readability.
 */

import './mapMarkers.css'

/** Escape text for safe HTML insertion. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Short label for pill markers (drop leading "The ", truncate). */
export function shortMarkerLabel(title, maxLen = 18) {
  if (!title) return 'Stop'
  const cleaned = String(title)
    .replace(/^the\s+/i, '')
    .trim()
  if (cleaned.length <= maxLen) return cleaned
  return `${cleaned.slice(0, maxLen - 1).trimEnd()}…`
}

/**
 * Resolve a simple landmark glyph from stop id / title.
 * @returns {'amphitheater' | 'temple' | 'fountain' | 'arch' | 'hill' | 'bridge' | 'landmark'}
 */
export function resolveLandmarkGlyph(stopId = '', title = '') {
  const haystack = `${stopId} ${title}`.toLowerCase()

  if (/colosseum|amphitheatr|arena|circus/.test(haystack)) return 'amphitheater'
  if (/pantheon|temple|vesta|saturn|castor|forum/.test(haystack)) return 'temple'
  if (/trevi|fountain|fontana/.test(haystack)) return 'fountain'
  if (/arch|tito|constantine|septimius|severus/.test(haystack)) return 'arch'
  if (/palatine|capitoline|hill|avista|gianicolo/.test(haystack)) return 'hill'
  if (/bridge|ponte|angel/.test(haystack)) return 'bridge'
  return 'landmark'
}

const GLYPH_PATHS = {
  amphitheater:
    '<path d="M4 16c2-6 5-9 8-9s6 3 8 9" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><path d="M6 16c1.5-4 3.5-6 6-6s4.5 2 6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 16h8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  temple:
    '<path d="M4 18h16M6 18V10l6-4 6 4v8M9 18v-5h6v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  fountain:
    '<path d="M12 5v3M9 7c1 1.5 1.5 2.5 3 3.5 1.5-1 2-2 3-3.5M7 18h10M8 14c0-2.2 1.8-4 4-4s4 1.8 4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  arch:
    '<path d="M5 19V9a7 7 0 0 1 14 0v10M5 19h3M16 19h3M8 19v-8a4 4 0 0 1 8 0v8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  hill:
    '<path d="M3 18h18M5 18l5-8 3 4 3-5 5 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  bridge:
    '<path d="M3 14h18M5 14v4M19 14v4M7 14c1.5-4 3.5-6 5-6s3.5 2 5 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  landmark:
    '<path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.25" fill="currentColor"/>',
}

export function landmarkGlyphSvg(glyph = 'landmark') {
  const paths = GLYPH_PATHS[glyph] ?? GLYPH_PATHS.landmark
  return `<svg class="cw-map-pill__glyph" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">${paths}</svg>`
}

/**
 * Dark pill marker: icon + destination label, legible over satellite.
 * @param {{ title: string, status?: string, stopId?: string, onPress?: Function, showLabel?: boolean, compact?: boolean }} options
 */
export function createLandmarkMarkerElement(
  title,
  status = 'upcoming',
  onPress = null,
  { showLabel = true, stopId = '', compact = false } = {},
) {
  const el = document.createElement('div')
  const glyph = resolveLandmarkGlyph(stopId, title)
  const label = shortMarkerLabel(title, compact ? 14 : 18)
  const statusClass = `cw-map-pill--${status || 'upcoming'}`

  el.className = `cw-map-marker cw-map-pill ${statusClass}${compact ? ' cw-map-pill--compact' : ''}${
    showLabel ? '' : ' cw-map-pill--icon-only'
  }`
  el.setAttribute('role', onPress ? 'button' : 'img')
  el.setAttribute('aria-label', title || 'Landmark')

  if (onPress) {
    el.style.cursor = 'pointer'
    el.addEventListener('click', (event) => {
      event.stopPropagation()
      onPress()
    })
  }

  const labelHtml = showLabel
    ? `<span class="cw-map-pill__label">${escapeHtml(label)}</span>`
    : ''

  el.innerHTML = `
    <span class="cw-map-pill__icon" data-glyph="${glyph}">${landmarkGlyphSvg(glyph)}</span>
    ${labelHtml}
  `

  return el
}

/** Compact origin pin for the previous stop on a walking leg. */
export function createLegOriginMarkerElement() {
  const el = document.createElement('div')
  el.className = 'cw-map-marker cw-map-origin'
  el.setAttribute('aria-hidden', 'true')
  el.innerHTML = `<span class="cw-map-origin__dot"></span>`
  return el
}

/**
 * Gold pulsing user-location marker (geofence-style glow).
 * @param {{ minimalUI?: boolean }} [options]
 */
export function createUserMarkerElement({ minimalUI = false } = {}) {
  const el = document.createElement('div')
  el.className = `cw-map-marker cw-map-user${minimalUI ? ' cw-map-user--minimal' : ''}`
  el.setAttribute('aria-label', 'Your location')
  el.innerHTML = `
    <span class="cw-map-user__ring cw-map-user__ring--outer" aria-hidden="true"></span>
    <span class="cw-map-user__ring cw-map-user__ring--inner" aria-hidden="true"></span>
    <span class="cw-map-user__core" aria-hidden="true"></span>
  `
  return el
}
