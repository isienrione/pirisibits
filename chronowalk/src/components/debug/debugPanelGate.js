/**
 * Open/close + logo-tap gesture for the hidden DebugPanel.
 */
import { INCLUDE_DEBUG_PANEL } from './includeDebugPanel.js'

const TAP_WINDOW_MS = 2000
const TAP_COUNT = 5
const OPEN_EVENT = 'cw-debug-panel-open'

/** @type {number[]} */
let logoTaps = []

/** @type {Set<(open: boolean) => void>} */
const openListeners = new Set()

let panelOpen = false

function notifyOpen() {
  for (const listener of openListeners) {
    try {
      listener(panelOpen)
    } catch {
      /* ignore */
    }
  }
}

export function isDebugPanelOpen() {
  return panelOpen
}

export function openDebugPanel() {
  if (!INCLUDE_DEBUG_PANEL) return
  if (panelOpen) return
  panelOpen = true
  notifyOpen()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_EVENT))
  }
}

export function closeDebugPanel() {
  if (!panelOpen) return
  panelOpen = false
  notifyOpen()
}

export function toggleDebugPanel() {
  if (panelOpen) closeDebugPanel()
  else openDebugPanel()
}

/** @param {(open: boolean) => void} listener */
export function subscribeDebugPanelOpen(listener) {
  openListeners.add(listener)
  return () => openListeners.delete(listener)
}

/**
 * Call from ChronoWalk logo pointer handlers. Five rapid taps open the panel.
 */
export function noteDebugLogoTap() {
  if (!INCLUDE_DEBUG_PANEL) return
  const now = Date.now()
  logoTaps = logoTaps.filter((t) => now - t < TAP_WINDOW_MS)
  logoTaps.push(now)
  if (logoTaps.length >= TAP_COUNT) {
    logoTaps = []
    openDebugPanel()
  }
}

/** True when URL has ?debug=1 (or true/yes). */
export function urlRequestsDebugPanel(search = typeof window !== 'undefined' ? window.location.search : '') {
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)
    const raw = params.get('debug')
    if (raw == null) return false
    const normalized = String(raw).trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'yes'
  } catch {
    return false
  }
}

/** Open if ?debug=1 is present. Safe to call on mount / navigation. */
export function syncDebugPanelFromUrl() {
  if (!INCLUDE_DEBUG_PANEL) return
  if (urlRequestsDebugPanel()) openDebugPanel()
}

/** @internal */
export function __resetDebugPanelGateForTests() {
  logoTaps = []
  panelOpen = false
  openListeners.clear()
}

export { OPEN_EVENT }
