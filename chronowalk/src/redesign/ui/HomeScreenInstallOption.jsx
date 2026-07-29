import { useEffect, useId, useMemo, useState } from 'react'
import { Home, Share, Plus, MoreVertical } from 'lucide-react'
import { T, F } from '../tokens.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { isIosDevice } from '../../utils/pwaInstall.js'

/** Real ChronoWalk home-screen icon used in the install how-to. */
export const CHRONOWALK_HOME_ICON = '/pwa/icon-192.png'

function ChronoWalkAppIcon({ className = '', size = 34, alt = 'ChronoWalk' }) {
  return (
    <img
      className={className}
      src={CHRONOWALK_HOME_ICON}
      width={size}
      height={size}
      alt={alt}
      draggable={false}
    />
  )
}

/**
 * Animated iPhone how-to (Safari or Chrome):
 * Share → Add to Home Screen → confirm with ChronoWalk logo → home icon.
 */
function IosHowToDemo() {
  const reducedMotion = useReducedMotion()

  return (
    <div
      className={`cw-a2hs-demo cw-a2hs-demo--ios${reducedMotion ? ' cw-a2hs-demo--reduced' : ''}`}
      aria-hidden
      data-testid="a2hs-howto-demo-ios"
    >
      <div className="cw-a2hs-demo__phone">
        <div className="cw-a2hs-demo__screen">
          {/* 1 — Safari or Chrome + Share */}
          <div className="cw-a2hs-demo__scene cw-a2hs-demo__scene--1">
            <div className="cw-a2hs-demo__chrome-bar">
              <span className="cw-a2hs-demo__url">chronowalk.com</span>
              <span className="cw-a2hs-demo__share-hit" title="Share">
                <Share size={14} strokeWidth={2.25} />
              </span>
            </div>
            <div className="cw-a2hs-demo__page-body cw-a2hs-demo__page-body--chrome">
              <ChronoWalkAppIcon className="cw-a2hs-demo__page-logo" size={28} alt="" />
              <span className="cw-a2hs-demo__page-title">ChronoWalk</span>
            </div>
            <p className="cw-a2hs-demo__caption">1 · Tap Share</p>
          </div>

          {/* 2 — Share sheet → Add to Home Screen */}
          <div className="cw-a2hs-demo__scene cw-a2hs-demo__scene--2">
            <div className="cw-a2hs-demo__sheet cw-a2hs-demo__sheet--tall">
              <div className="cw-a2hs-demo__sheet-preview">
                <ChronoWalkAppIcon size={22} alt="" />
                <span>ChronoWalk</span>
              </div>
              <div className="cw-a2hs-demo__sheet-row">Copy</div>
              <div className="cw-a2hs-demo__sheet-row cw-a2hs-demo__sheet-row--active">
                <Plus size={13} strokeWidth={2.5} />
                <span>Add to Home Screen</span>
              </div>
            </div>
            <p className="cw-a2hs-demo__caption">2 · Choose Add to Home Screen</p>
          </div>

          {/* 3 — Confirm dialog with real logo */}
          <div className="cw-a2hs-demo__scene cw-a2hs-demo__scene--3">
            <div className="cw-a2hs-demo__confirm">
              <ChronoWalkAppIcon className="cw-a2hs-demo__confirm-logo" size={40} alt="" />
              <p className="cw-a2hs-demo__confirm-name">ChronoWalk</p>
              <p className="cw-a2hs-demo__confirm-meta">chronowalk.com</p>
              <div className="cw-a2hs-demo__confirm-actions">
                <span>Cancel</span>
                <span className="cw-a2hs-demo__confirm-add">Add</span>
              </div>
            </div>
            <p className="cw-a2hs-demo__caption">3 · Tap Add</p>
          </div>

          {/* 4 — Home screen with ChronoWalk icon */}
          <div className="cw-a2hs-demo__scene cw-a2hs-demo__scene--4">
            <div className="cw-a2hs-demo__home-grid">
              <span className="cw-a2hs-demo__app-dot" />
              <span className="cw-a2hs-demo__app-dot" />
              <span className="cw-a2hs-demo__home-icon-wrap">
                <ChronoWalkAppIcon className="cw-a2hs-demo__home-logo" size={36} alt="" />
                <span className="cw-a2hs-demo__home-label">ChronoWalk</span>
              </span>
              <span className="cw-a2hs-demo__app-dot" />
            </div>
            <p className="cw-a2hs-demo__caption">4 · Open the ChronoWalk icon</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Animated Android Chrome how-to:
 * ⋮ menu → Install app / Add to Home screen → confirm with logo → home icon.
 */
function AndroidChromeHowToDemo() {
  const reducedMotion = useReducedMotion()

  return (
    <div
      className={`cw-a2hs-demo cw-a2hs-demo--android${reducedMotion ? ' cw-a2hs-demo--reduced' : ''}`}
      aria-hidden
      data-testid="a2hs-howto-demo-android"
    >
      <div className="cw-a2hs-demo__phone">
        <div className="cw-a2hs-demo__screen">
          {/* 1 — Chrome + ⋮ */}
          <div className="cw-a2hs-demo__scene cw-a2hs-demo__scene--1">
            <div className="cw-a2hs-demo__chrome-bar">
              <span className="cw-a2hs-demo__url">chronowalk.com</span>
              <span className="cw-a2hs-demo__menu-hit">
                <MoreVertical size={14} strokeWidth={2.4} />
              </span>
            </div>
            <div className="cw-a2hs-demo__page-body cw-a2hs-demo__page-body--chrome">
              <ChronoWalkAppIcon className="cw-a2hs-demo__page-logo" size={28} alt="" />
              <span className="cw-a2hs-demo__page-title">ChronoWalk</span>
            </div>
            <p className="cw-a2hs-demo__caption">1 · Tap ⋮ in Chrome</p>
          </div>

          {/* 2 — Menu */}
          <div className="cw-a2hs-demo__scene cw-a2hs-demo__scene--2">
            <div className="cw-a2hs-demo__menu">
              <div className="cw-a2hs-demo__sheet-row">New tab</div>
              <div className="cw-a2hs-demo__sheet-row cw-a2hs-demo__sheet-row--active">
                <Home size={13} strokeWidth={2.4} />
                <span>Install app</span>
              </div>
              <div className="cw-a2hs-demo__sheet-row">
                <Plus size={13} strokeWidth={2.4} />
                <span>Add to Home screen</span>
              </div>
            </div>
            <p className="cw-a2hs-demo__caption">2 · Install app / Add to Home screen</p>
          </div>

          {/* 3 — Install sheet with logo */}
          <div className="cw-a2hs-demo__scene cw-a2hs-demo__scene--3">
            <div className="cw-a2hs-demo__confirm">
              <ChronoWalkAppIcon className="cw-a2hs-demo__confirm-logo" size={40} alt="" />
              <p className="cw-a2hs-demo__confirm-name">Install ChronoWalk?</p>
              <p className="cw-a2hs-demo__confirm-meta">chronowalk.com</p>
              <div className="cw-a2hs-demo__confirm-actions">
                <span>Cancel</span>
                <span className="cw-a2hs-demo__confirm-add">Install</span>
              </div>
            </div>
            <p className="cw-a2hs-demo__caption">3 · Confirm Install</p>
          </div>

          {/* 4 — Home */}
          <div className="cw-a2hs-demo__scene cw-a2hs-demo__scene--4">
            <div className="cw-a2hs-demo__home-grid">
              <span className="cw-a2hs-demo__app-dot" />
              <span className="cw-a2hs-demo__app-dot" />
              <span className="cw-a2hs-demo__home-icon-wrap">
                <ChronoWalkAppIcon className="cw-a2hs-demo__home-logo" size={36} alt="" />
                <span className="cw-a2hs-demo__home-label">ChronoWalk</span>
              </span>
              <span className="cw-a2hs-demo__app-dot" />
            </div>
            <p className="cw-a2hs-demo__caption">4 · Open the ChronoWalk icon</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Install-to-home-screen option, with expand/hover how-to.
 * @param {'dark' | 'light'} tone — dark for prepare (obsidian), light for Settings (bone).
 */
export default function HomeScreenInstallOption({
  installed = false,
  canPromptInstall = false,
  showIosInstructions = false,
  onInstall,
  tone = 'dark',
  /** When true, omit the top hairline (already inside a Recommended card). */
  embedded = false,
}) {
  const titleColor = tone === 'light' ? T.ink : T.warmWhite
  const borderColor = tone === 'light' ? `${T.ink}22` : T.ink800
  const topBorder = embedded || tone === 'light' ? 'none' : `1px solid ${borderColor}`
  const topPad = embedded || tone === 'light' ? 0 : 22
  const panelId = useId()
  const defaultPlatform = useMemo(() => {
    if (showIosInstructions || isIosDevice()) return 'ios'
    return 'android'
  }, [showIosInstructions])
  const [platform, setPlatform] = useState(defaultPlatform)
  const [open, setOpen] = useState(false)
  const [hoverOpen, setHoverOpen] = useState(false)
  const expanded = open || hoverOpen

  useEffect(() => {
    setPlatform(defaultPlatform)
  }, [defaultPlatform])

  useEffect(() => {
    if (installed) {
      setOpen(false)
      setHoverOpen(false)
    }
  }, [installed])

  if (installed) {
    return (
      <div
        style={{ borderTop: topBorder, paddingTop: topPad, paddingBottom: 22 }}
        data-testid="a2hs-option-installed"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 16, color: titleColor, fontWeight: 500, marginBottom: 5 }}>
              Ready as a mobile app
            </p>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
              Open ChronoWalk from your Home Screen — full-screen, no browser.
            </p>
          </div>
          <span
            aria-hidden
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: `0 0 0 1px ${T.actII}44`,
            }}
          >
            <ChronoWalkAppIcon size={44} alt="" />
          </span>
        </div>
      </div>
    )
  }

  const handlePrimary = async () => {
    if (canPromptInstall && platform === 'android') {
      await onInstall?.()
      return
    }
    setOpen(true)
  }

  const toggle = () => setOpen((v) => !v)

  return (
    <div
      style={{ borderTop: topBorder, paddingTop: topPad, paddingBottom: 22 }}
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
          <p style={{ fontSize: 16, color: titleColor, fontWeight: 500, marginBottom: 5 }}>
            Use as a mobile app
          </p>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: 0 }}>
            Add ChronoWalk to your Home Screen so you open it like a regular app — not from the browser.
          </p>
        </button>
        <button
          type="button"
          aria-label={
            canPromptInstall
              ? 'Install ChronoWalk as a mobile app'
              : 'Show how to use ChronoWalk as a mobile app'
          }
          onClick={() => void handlePrimary()}
          style={{
            flexShrink: 0,
            width: 52,
            height: 52,
            borderRadius: 14,
            border: `1px solid ${T.ember}55`,
            background: `${T.ember}18`,
            padding: 0,
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          <ChronoWalkAppIcon size={52} alt="" />
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
        <div className="cw-a2hs-capsule__inner cw-a2hs-capsule__inner--detailed">
          <div className="cw-a2hs-capsule__platforms" role="tablist" aria-label="Choose your phone">
            <button
              type="button"
              role="tab"
              aria-selected={platform === 'ios'}
              className={`cw-a2hs-capsule__tab${platform === 'ios' ? ' cw-a2hs-capsule__tab--active' : ''}`}
              onClick={() => setPlatform('ios')}
            >
              iPhone · Safari or Chrome
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={platform === 'android'}
              className={`cw-a2hs-capsule__tab${platform === 'android' ? ' cw-a2hs-capsule__tab--active' : ''}`}
              onClick={() => setPlatform('android')}
            >
              Android · Chrome
            </button>
          </div>

          {platform === 'ios' ? <IosHowToDemo /> : <AndroidChromeHowToDemo />}

          <div className="cw-a2hs-capsule__copy">
            {platform === 'ios' ? (
              <>
                <p className="cw-a2hs-capsule__title">iPhone — Safari or Chrome</p>
                <ol className="cw-a2hs-capsule__steps">
                  <li>
                    Open this page in <strong>Safari</strong> or <strong>Chrome</strong> on your
                    iPhone (not Instagram, Facebook, or other in-app browsers)
                  </li>
                  <li>
                    Tap <strong>Share</strong> — at the bottom in Safari, or next to the address bar
                    in Chrome
                  </li>
                  <li>
                    Scroll and tap <strong>Add to Home Screen</strong>
                  </li>
                  <li>
                    You’ll see the <strong>ChronoWalk</strong> logo — tap <strong>Add</strong>
                  </li>
                  <li>On your Home Screen, open the ChronoWalk icon (not the website)</li>
                </ol>
                <p className="cw-a2hs-capsule__warn" data-testid="a2hs-ios-inapp-warning">
                  In-app browsers often hide Add to Home Screen. If you don’t see it, open
                  chronowalk.com in Safari or Chrome first.
                </p>
              </>
            ) : (
              <>
                <p className="cw-a2hs-capsule__title">Android — Chrome (Samsung &amp; others)</p>
                <ol className="cw-a2hs-capsule__steps">
                  <li>
                    Open this page in <strong>Chrome</strong> on your Android phone (Samsung, Pixel,
                    etc.)
                  </li>
                  <li>
                    Tap the <strong>⋮</strong> menu (top right)
                  </li>
                  <li>
                    Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>
                  </li>
                  <li>
                    Confirm — the <strong>ChronoWalk</strong> logo appears as the app icon
                  </li>
                  <li>Launch ChronoWalk from the Home Screen icon on tour day</li>
                </ol>
                {canPromptInstall ? (
                  <button
                    type="button"
                    className="cw-a2hs-capsule__cta"
                    onClick={() => void onInstall?.()}
                  >
                    Add to Home Screen
                  </button>
                ) : (
                  <p className="cw-a2hs-capsule__tip">
                    If you don’t see Install yet, keep ChronoWalk open in Chrome for a moment, then
                    check the ⋮ menu again.
                  </p>
                )}
                <p className="cw-a2hs-capsule__warn">
                  On iPhone, use the <strong>iPhone · Safari or Chrome</strong> tab — Share works in
                  both browsers.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
