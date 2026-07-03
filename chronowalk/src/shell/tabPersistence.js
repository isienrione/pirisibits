import { SHELL_COMPANION_PATHS } from './config.js'

const ACTIVE_TAB_KEY = 'cw_active_tab'

export function persistShellTab(pathname) {
  if (typeof window === 'undefined') return
  if (!SHELL_COMPANION_PATHS.includes(pathname)) return

  try {
    window.localStorage.setItem(ACTIVE_TAB_KEY, pathname)
  } catch {
    // ignore quota / privacy errors
  }
}

export function readPersistedShellTab(fallback = '/journey') {
  if (typeof window === 'undefined') return fallback

  try {
    const stored = window.localStorage.getItem(ACTIVE_TAB_KEY)
    return SHELL_COMPANION_PATHS.includes(stored) ? stored : fallback
  } catch {
    return fallback
  }
}
