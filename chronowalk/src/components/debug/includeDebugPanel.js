/**
 * Compile-time gate for the hidden DebugPanel.
 *
 * Default: INCLUDE (ship in production — panel stays gated behind ?debug=1 / logo taps).
 * Strip from the bundle: set VITE_STRIP_DEBUG_PANEL=true (Vite replaces this at build time
 * so the dynamic import is dead-code eliminated).
 */
export const INCLUDE_DEBUG_PANEL = import.meta.env.VITE_STRIP_DEBUG_PANEL !== 'true'
