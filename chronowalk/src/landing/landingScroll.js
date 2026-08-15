/**
 * Scroll a landing hash target clear of the fixed v4 nav (and app-return bar).
 * Native scroll-margin alone is often too tight on mobile once the
 * explore drawer unlocks body overflow.
 */
import { readFaqFromAppFlag } from './faqFromApp.js'

export function scrollLandingAnchor(hrefOrId, { behavior = 'smooth' } = {}) {
  if (typeof window === 'undefined') return false

  const raw = String(hrefOrId || '')
  const id = raw.startsWith('#') ? raw.slice(1) : raw
  if (!id) return false

  const el = document.getElementById(id)
  if (!el) return false

  const root = document.querySelector('.cw-landing--v4')
  const styles = getComputedStyle(root || document.documentElement)
  const navH = Number.parseFloat(styles.getPropertyValue('--v4-nav-h')) || 68
  const mobile = window.matchMedia('(max-width: 47.99rem)').matches
  const gap = mobile ? 32 : 24

  const fromApp = id === 'faq' && readFaqFromAppFlag()
  const appBar = fromApp
    ? document.querySelector('.cw-v2-faq__app-bar--fixed')
    : null
  const appBarH = appBar ? appBar.getBoundingClientRect().height : 0
  const safeTop = fromApp ? 12 : 0
  const chrome = fromApp ? Math.max(appBarH, 56) + safeTop : navH + gap

  const top = el.getBoundingClientRect().top + window.scrollY - chrome

  window.scrollTo({ top: Math.max(0, top), behavior })
  return true
}
