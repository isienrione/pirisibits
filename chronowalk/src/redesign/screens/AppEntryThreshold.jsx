import { T, F } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { Vignette } from '../ui/index.js'
import ChronoWalkLogo from '../../components/ui/ChronoWalkLogo.jsx'
import { useT } from '../../i18n/I18nProvider.jsx'

/**
 * The crossing from marketing site → ChronoWalk app.
 * One composition: brand, pack name, install CTA, continue in browser.
 */
export default function AppEntryThreshold({
  packTitle = null,
  packBlurb = null,
  installed = false,
  canPromptInstall = false,
  showIosInstructions = false,
  onInstall,
  onContinue,
}) {
  const t = useT()
  const resolvedPackTitle = packTitle ?? t('entry.threshold.defaultTitle')
  const resolvedPackBlurb = packBlurb ?? t('entry.threshold.defaultBlurb')
  const primaryInstall = !installed && (canPromptInstall || showIosInstructions)

  return (
    <div
      data-testid="app-entry-threshold"
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
          backgroundImage: `url(${colosseumNow})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 22%',
          filter: 'brightness(0.22) saturate(0.55)',
        }}
      />
      <Vignette />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(11,11,13,0.55) 0%, rgba(11,11,13,0.35) 40%, rgba(11,11,13,0.92) 78%, rgba(11,11,13,0.98) 100%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '56px 28px max(40px, env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ChronoWalkLogo size={22} variant="dark" />
          <span
            style={{
              fontSize: 12,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: T.ember,
              fontWeight: 600,
            }}
          >
            ChronoWalk
          </span>
        </div>

        <p
          style={{
            margin: '28px 0 0',
            fontSize: 12,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: T.muted,
          }}
        >
          {t('entry.threshold.eyebrow')}
        </p>

        <h1
          style={{
            margin: '12px 0 0',
            fontFamily: F.display,
            fontSize: 40,
            fontWeight: 300,
            lineHeight: 1.08,
            color: T.warmWhite,
            maxWidth: 320,
          }}
        >
          {resolvedPackTitle}
          <br />
          {t('entry.threshold.unlocked')}
        </h1>

        <p
          style={{
            marginTop: 14,
            fontSize: 15,
            lineHeight: 1.6,
            color: T.muted,
            maxWidth: 300,
          }}
        >
          {t('entry.threshold.body', { blurb: resolvedPackBlurb })}
        </p>

        <div style={{ marginTop: 'auto', display: 'grid', gap: 12 }}>
          {primaryInstall ? (
            <>
              <button
                type="button"
                onClick={() => onInstall?.()}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: 'none',
                  borderRadius: 14,
                  background: T.ember,
                  color: T.obsidian,
                  fontFamily: F.body,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                {showIosInstructions
                  ? t('entry.threshold.iosInstall')
                  : t('entry.threshold.install')}
              </button>
              {showIosInstructions ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: T.muted,
                    textAlign: 'center',
                  }}
                >
                  {t('entry.threshold.iosHelp')}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => onContinue?.()}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 14,
                  border: `1px solid ${T.warmWhite}22`,
                  background: 'transparent',
                  color: T.warmWhite,
                  fontFamily: F.body,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                {t('entry.threshold.browser')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onContinue?.()}
              style={{
                width: '100%',
                padding: '16px',
                border: 'none',
                borderRadius: 14,
                background: T.ember,
                color: T.obsidian,
                fontFamily: F.body,
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              {installed ? t('entry.threshold.openRome') : t('entry.threshold.enter')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
