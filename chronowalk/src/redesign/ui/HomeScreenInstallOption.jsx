import { useEffect, useId, useState } from 'react'
import { Home, Share, Plus, Check } from 'lucide-react'
import { T, F } from '../tokens.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

/**
 * Animated how-to for Add to Home Screen — cycles Share → sheet → home icon.
 * Pure CSS scenes; no video asset required.
 */
function HomeScreenHowToDemo({ ios = false }) {
  const reducedMotion = useReducedMotion()

  return (
    <div
      className={`cw-a2hs-demo${reducedMotion ? ' cw-a2hs-demo--reduced' : ''}`}
      aria-hidden
      data-testid="a2hs-howto-demo"
    >
      <div className="cw-a2hs-demo__phone">
        <div className="cw-a2hs-demo__screen">
          {/* Scene 1 — browser + share */}
          <div className="cw-a2hs-demo__scene cw-a2hs-demo__scene--share">
            <div className="cw-a2hs-demo__browser-bar">
              <span className="cw-a2hs-demo__url">chronowalk.com</span>
              <span className="cw-a2hs-demo__share-hit">
                <Share size={14} strokeWidth={2.25} />
              </span>
            </div>
            <div className="cw-a2hs-demo__page-stub" />
            <p className="cw-a2hs-demo__caption">
              {ios ? '1 · Tap Share' : '1 · Open browser menu'}
            </p>
          </div>

          {/* Scene 2 — add action */}
          <div className="cw-a2hs-demo__scene cw-a2hs-demo__scene--sheet">
            <div className="cw-a2hs-demo__sheet">
              <div className="cw-a2hs-demo__sheet-row cw-a2hs-demo__sheet-row--active">
                <Plus size={13} strokeWidth={2.5} />
                <span>Add to Home Screen</span>
              </div>
              <div className="cw-a2hs-demo__sheet-row">
                <span>Copy</span>
              </div>
            </div>
            <p className="cw-a2hs-demo__caption">2 · Add to Home Screen</p>
          </div>

          {/* Scene 3 — home icon */}
          <div className="cw-a2hs-demo__scene cw-a2hs-demo__scene--home">
            <div className="cw-a2hs-demo__home-grid">
              <span className="cw-a2hs-demo__app-dot" />
              <span className="cw-a2hs-demo__app-dot" />
              <span className="cw-a2hs-demo__app-icon">CW</span>
              <span className="cw-a2hs-demo__app-dot" />
            </div>
            <p className="cw-a2hs-demo__caption">3 · Open the ChronoWalk icon</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Third prepare-row option: install to home screen, with expand/hover capsule.
 */
export default function HomeScreenInstallOption({
  installed = false,
  canPromptInstall = false,
  showIosInstructions = false,
  onInstall,
}) {
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [hoverOpen, setHoverOpen] = useState(false)
  const expanded = open || hoverOpen

  useEffect(() => {
    if (installed) {
      setOpen(false)
      setHoverOpen(false)
    }
  }, [installed])

  if (installed) {
    return (
      <div
        style={{ borderTop: `1px solid ${T.ink800}`, paddingTop: 22, paddingBottom: 22 }}
        data-testid="a2hs-option-installed"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 16, color: T.warmWhite, fontWeight: 500, marginBottom: 5 }}>
              On your Home Screen
            </p>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
              ChronoWalk opens full-screen from the icon — no browser chrome.
            </p>
          </div>
          <span
            aria-hidden
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              display: 'grid',
              placeItems: 'center',
              background: `${T.actII}22`,
              color: T.actII,
              flexShrink: 0,
            }}
          >
            <Check size={20} strokeWidth={2.4} />
          </span>
        </div>
      </div>
    )
  }

  const handlePrimary = async () => {
    if (canPromptInstall) {
      await onInstall?.()
      return
    }
    // iOS / no native prompt — expand the how-to capsule
    setOpen(true)
  }

  const toggle = () => setOpen((v) => !v)

  return (
    <div
      style={{ borderTop: `1px solid ${T.ink800}`, paddingTop: 22, paddingBottom: 22 }}
      data-testid="a2hs-option"
      onMouseEnter={() => setHoverOpen(true)}
      onMouseLeave={() => setHoverOpen(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          style={{
            flex: 1,
            textAlign: 'left',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: F.body,
          }}
        >
          <p style={{ fontSize: 16, color: T.warmWhite, fontWeight: 500, marginBottom: 5 }}>
            Add icon to Home Screen
          </p>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: 0 }}>
            Open ChronoWalk like an app on tour day.
          </p>
        </button>
        <button
          type="button"
          aria-label={canPromptInstall ? 'Add ChronoWalk to Home Screen' : 'Show how to add to Home Screen'}
          onClick={() => void handlePrimary()}
          style={{
            flexShrink: 0,
            width: 52,
            height: 52,
            borderRadius: 26,
            border: `1px solid ${T.ember}55`,
            background: `${T.ember}18`,
            color: T.ember,
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
        >
          <Home size={22} strokeWidth={2} />
        </button>
      </div>

      <div
        id={panelId}
        className={`cw-a2hs-capsule${expanded ? ' cw-a2hs-capsule--open' : ''}`}
        data-testid="a2hs-capsule"
        role="region"
        aria-hidden={!expanded}
        aria-label="How to add ChronoWalk to your Home Screen"
      >
        <div className="cw-a2hs-capsule__inner">
          <HomeScreenHowToDemo ios={showIosInstructions} />

          <div className="cw-a2hs-capsule__copy">
            {showIosInstructions ? (
              <>
                <p className="cw-a2hs-capsule__title">On iPhone (Safari)</p>
                <ol className="cw-a2hs-capsule__steps">
                  <li>
                    Tap <strong>Share</strong> in Safari
                  </li>
                  <li>
                    Choose <strong>Add to Home Screen</strong>
                  </li>
                  <li>Open the ChronoWalk icon — not the website</li>
                </ol>
                <p className="cw-a2hs-capsule__tip">
                  Tip: Chrome on iPhone cannot install PWAs — use Safari.
                </p>
              </>
            ) : canPromptInstall ? (
              <>
                <p className="cw-a2hs-capsule__title">One tap to install</p>
                <p className="cw-a2hs-capsule__body">
                  Your browser can place ChronoWalk on the home screen. Full screen, quick launch,
                  ready for Rome.
                </p>
                <button
                  type="button"
                  className="cw-a2hs-capsule__cta"
                  onClick={() => void onInstall?.()}
                >
                  Add to Home Screen
                </button>
              </>
            ) : (
              <>
                <p className="cw-a2hs-capsule__title">From your browser menu</p>
                <ol className="cw-a2hs-capsule__steps">
                  <li>
                    Open the browser menu → <strong>Install app</strong> or{' '}
                    <strong>Add to Home Screen</strong>
                  </li>
                  <li>Confirm — the ChronoWalk icon appears with your apps</li>
                  <li>Launch from the icon on tour day</li>
                </ol>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
