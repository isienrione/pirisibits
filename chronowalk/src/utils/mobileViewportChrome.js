/** Keep layout inside the visible viewport when mobile browser chrome overlaps content. */
export function initMobileViewportChrome() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {}

  const root = document.documentElement
  const standalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true

  if (standalone) {
    root.style.setProperty('--app-height', '100dvh')
    root.style.setProperty('--wc-browser-chrome', '0px')
    return () => {}
  }

  const sync = () => {
    const viewport = window.visualViewport
    const height = Math.round(viewport?.height ?? window.innerHeight)
    const offsetTop = Math.round(viewport?.offsetTop ?? 0)
    const layoutHeight = window.innerHeight
    const browserChrome = Math.max(0, layoutHeight - height - offsetTop)

    root.style.setProperty('--app-height', `${height}px`)
    root.style.setProperty('--wc-browser-chrome', `${Math.min(browserChrome, 96)}px`)
  }

  sync()
  window.visualViewport?.addEventListener('resize', sync)
  window.visualViewport?.addEventListener('scroll', sync)
  window.addEventListener('resize', sync)
  window.addEventListener('orientationchange', sync)

  return () => {
    window.visualViewport?.removeEventListener('resize', sync)
    window.visualViewport?.removeEventListener('scroll', sync)
    window.removeEventListener('resize', sync)
    window.removeEventListener('orientationchange', sync)
  }
}
