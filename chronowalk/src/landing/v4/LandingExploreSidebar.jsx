import { useEffect, useId, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/**
 * Collapsible left explore drawer for the landing page map.
 * Closed by default; opened from the nav Menu control.
 */
export default function LandingExploreSidebar({
  open,
  onClose,
  items = [],
  title,
  lead,
  closeLabel,
  navLabel,
  panelId: panelIdProp,
}) {
  const fallbackId = useId()
  const panelId = panelIdProp || fallbackId
  const titleId = useId()
  const rootRef = useRef(null)
  const panelRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    if (open) {
      root.removeAttribute('inert')
    } else {
      root.setAttribute('inert', '')
    }
    return undefined
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    previouslyFocused.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    const focusFirst = () => {
      const target =
        panel?.querySelector('[data-explore-close]') ||
        panel?.querySelector(FOCUSABLE)
      target?.focus({ preventScroll: true })
    }
    const frame = window.requestAnimationFrame(focusFirst)

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose?.()
        return
      }
      if (event.key !== 'Tab' || !panel) return

      const nodes = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (node) => !node.hasAttribute('disabled') && node.getAttribute('aria-hidden') !== 'true',
      )
      if (!nodes.length) return

      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      const restore = previouslyFocused.current
      if (restore && typeof restore.focus === 'function') {
        restore.focus({ preventScroll: true })
      }
    }
  }, [open, onClose])

  if (!items.length) return null

  return (
    <div
      ref={rootRef}
      className={`cw-v4-explore${open ? ' is-open' : ''}`}
      data-testid="landing-explore-sidebar"
      aria-hidden={!open}
    >
      <button
        type="button"
        className="cw-v4-explore__backdrop"
        tabIndex={open ? 0 : -1}
        aria-label={closeLabel}
        onClick={onClose}
      />

      <aside
        ref={panelRef}
        id={panelId}
        className="cw-v4-explore__panel"
        role="dialog"
        aria-modal={open ? 'true' : undefined}
        aria-labelledby={titleId}
      >
        <div className="cw-v4-explore__head">
          <div className="cw-v4-explore__intro">
            <p className="cw-v4-explore__eyebrow">ChronoWalk</p>
            <h2 id={titleId} className="cw-v4-explore__title">
              {title}
            </h2>
            {lead ? <p className="cw-v4-explore__lead">{lead}</p> : null}
          </div>
          <button
            type="button"
            className="cw-v4-explore__close"
            data-explore-close
            aria-label={closeLabel}
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <nav className="cw-v4-explore__nav" aria-label={navLabel}>
          <ol className="cw-v4-explore__list">
            {items.map((item, index) => (
              <li key={item.id || item.href} className="cw-v4-explore__item">
                <a
                  href={item.href}
                  className="cw-v4-explore__link"
                  onClick={onClose}
                >
                  <span className="cw-v4-explore__index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="cw-v4-explore__copy">
                    <span className="cw-v4-explore__label">{item.label}</span>
                    {item.hint ? (
                      <span className="cw-v4-explore__hint">{item.hint}</span>
                    ) : null}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>
    </div>
  )
}
