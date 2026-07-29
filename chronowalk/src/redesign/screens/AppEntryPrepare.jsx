import { useEffect, useState } from 'react'
import { T, F } from '../tokens.js'
import { spanishSteps } from '../images.js'
import { Vignette, BottomScrim } from '../ui/index.js'
import HomeScreenInstallOption from '../ui/HomeScreenInstallOption.jsx'

/**
 * In-app prepare step: offline download, home-screen install, optional analytics.
 * Shown after the threshold — not marketing, not the walk yet.
 */
export default function AppEntryPrepare({
  downloading = false,
  downloadProgress = 0,
  downloadComplete = false,
  analyticsEnabled = false,
  installed = false,
  canPromptInstall = false,
  showIosInstructions = false,
  onDownload,
  onInstall,
  onAnalyticsChange,
  onContinue,
}) {
  const [analyticsOn, setAnalyticsOn] = useState(Boolean(analyticsEnabled))
  const ringR = 22
  const ringC = 2 * Math.PI * ringR
  const done = downloadComplete || downloadProgress >= 1

  useEffect(() => {
    setAnalyticsOn(Boolean(analyticsEnabled))
  }, [analyticsEnabled])

  const setAnalytics = (next) => {
    setAnalyticsOn(next)
    onAnalyticsChange?.(next)
  }

  return (
    <div
      data-testid="app-entry-prepare"
      style={{
        background: T.obsidian,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: F.body,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${spanishSteps})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 25%',
          filter: 'brightness(0.32) saturate(0.8)',
        }}
      />
      <Vignette />
      <BottomScrim strength={0.9} />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding:
            'max(56px, calc(env(safe-area-inset-top, 0px) + 16px)) 28px max(40px, calc(env(safe-area-inset-bottom, 0px) + 16px))',
          overflowY: 'auto',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: T.ember,
            fontWeight: 600,
          }}
        >
          Inside ChronoWalk
        </p>
        <h2
          style={{
            fontFamily: F.display,
            fontSize: 36,
            color: T.warmWhite,
            fontWeight: 300,
            lineHeight: 1.08,
            margin: '12px 0 10px',
          }}
        >
          Prepare for the streets.
        </h2>
        <p style={{ fontSize: 14, color: T.muted, marginBottom: 28, lineHeight: 1.6 }}>
          One download keeps the stories playing when signal drops.
        </p>

        <div
          style={{
            borderRadius: 14,
            border: `1.5px solid ${T.ember}55`,
            background: `${T.ember}0a`,
            padding: '18px 16px 16px',
            marginBottom: 12,
          }}
          data-testid="app-entry-download"
        >
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: T.ember,
              fontWeight: 600,
            }}
          >
            Recommended
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 16, color: T.warmWhite, fontWeight: 500, marginBottom: 5 }}>
                Download the walk
                <span style={{ color: T.muted, fontWeight: 400, fontSize: 14 }}> - 215 MB</span>
              </p>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                Works offline in Rome&apos;s dense streets.
              </p>
              {done ? (
                <p style={{ fontSize: 12, color: T.actII, marginTop: 6 }}>Ready on this phone</p>
              ) : downloading && downloadProgress > 0 ? (
                <p style={{ fontSize: 12, color: T.ember, marginTop: 6 }}>
                  {Math.round(downloadProgress * 215)} MB of 215 MB
                </p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label={done ? 'Download complete' : 'Download the walk'}
              onClick={() => {
                if (done) return
                onDownload?.()
              }}
              style={{
                flexShrink: 0,
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: done ? 'default' : 'pointer',
              }}
            >
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r={ringR} fill="none" stroke={T.ink800} strokeWidth="2" />
                <circle
                  cx="26"
                  cy="26"
                  r={ringR}
                  fill="none"
                  stroke={done ? T.actII : T.ember}
                  strokeWidth="2"
                  strokeLinecap="round"
                  transform="rotate(-90 26 26)"
                  style={{
                    strokeDasharray: ringC,
                    strokeDashoffset: ringC * (1 - downloadProgress),
                    transition: 'stroke-dashoffset 160ms linear',
                  }}
                />
                {done ? (
                  <polyline
                    points="17,26 23,32 35,20"
                    fill="none"
                    stroke={T.actII}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <>
                    <line
                      x1="26"
                      y1="19"
                      x2="26"
                      y2="30"
                      stroke={T.warmWhite}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <polyline
                      points="20,26 26,32 32,26"
                      fill="none"
                      stroke={T.warmWhite}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        <div
          style={{
            borderRadius: 14,
            border: `1.5px solid ${T.ember}55`,
            background: `${T.ember}0a`,
            padding: '18px 16px 8px',
            marginBottom: 16,
          }}
          data-testid="app-entry-a2hs"
        >
          <p
            style={{
              margin: '0 0 4px',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: T.ember,
              fontWeight: 600,
            }}
          >
            Recommended
          </p>
          <HomeScreenInstallOption
            installed={installed}
            canPromptInstall={canPromptInstall}
            showIosInstructions={showIosInstructions}
            onInstall={onInstall}
            tone="dark"
            embedded
          />
        </div>

        <div style={{ borderTop: `1px solid ${T.ink800}`, paddingTop: 22, paddingBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 16, color: T.warmWhite, fontWeight: 500, marginBottom: 6 }}>
                Help improve ChronoWalk
              </p>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                Anonymous usage only - we count moments, never people.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={analyticsOn}
              aria-label={analyticsOn ? 'Disable analytics' : 'Enable analytics'}
              onClick={() => setAnalytics(!analyticsOn)}
              style={{
                flexShrink: 0,
                width: 52,
                height: 32,
                borderRadius: 999,
                border: 'none',
                padding: 3,
                cursor: 'pointer',
                background: analyticsOn ? T.ember : T.ink800,
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'block',
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: analyticsOn ? T.obsidian : T.muted,
                  transform: analyticsOn ? 'translateX(20px)' : 'translateX(0)',
                  transition: 'transform 160ms ease',
                }}
              />
            </button>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 24, display: 'grid', gap: 10 }}>
          <button
            type="button"
            onClick={() => onContinue?.()}
            style={{
              width: '100%',
              padding: '15px',
              background: T.ember,
              color: T.obsidian,
              borderRadius: 12,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 15,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => onContinue?.()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: T.muted,
              fontSize: 13,
              fontFamily: F.body,
            }}
          >
            I&apos;ll download later
          </button>
        </div>
      </div>
    </div>
  )
}
