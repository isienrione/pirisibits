/**
 * Scroll a landing hash target clear of the fixed v4 nav.
 * Native scroll-margin alone is often too tight on mobile once the
 * explore drawer unlocks body overflow.
 */
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
  const top = el.getBoundingClientRect().top + window.scrollY - navH - gap

  window.scrollTo({ top: Math.max(0, top), behavior })
  return true
}
