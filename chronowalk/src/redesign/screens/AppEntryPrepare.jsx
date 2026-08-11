import { T, F } from '../tokens.js'
import { spanishSteps } from '../images.js'
import { Vignette, BottomScrim } from '../ui/index.js'
import HomeScreenInstallOption from '../ui/HomeScreenInstallOption.jsx'
import { useT } from '../../i18n/I18nProvider.jsx'

/**
 * In-app prepare step: offline download and home-screen install.
 * Shown after the threshold - not marketing, not the walk yet.
 */
export default function AppEntryPrepare({
  downloading = false,
  downloadProgress = 0,
  downloadComplete = false,
  downloadError = null,
  mapTilesPartial = false,
  installed = false,
  canPromptInstall = false,
  showIosInstructions = false,
  onDownload,
  onInstall,
  onContinue,
}) {
  const t = useT()
  const ringR = 22
  const ringC = 2 * Math.PI * ringR
  const done = downloadComplete || downloadProgress >= 1

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
          {t('entry.prepare.eyebrow')}
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
          {t('entry.prepare.title')}
        </h2>
        <p style={{ fontSize: 14, color: T.muted, marginBottom: 28, lineHeight: 1.6 }}>
          {t('entry.prepare.lead')}
        </p>

        <div
          style={{
            borderRadius: 14,
            border: `1.5px solid ${installed ? `${T.actII}66` : `${T.ember}55`}`,
            background: installed ? `${T.actII}0f` : `${T.ember}0a`,
            padding: '18px 16px 8px',
            marginBottom: 12,
          }}
          data-testid="app-entry-a2hs"
          data-installed={installed ? 'true' : 'false'}
        >
          <p
            style={{
              margin: '0 0 4px',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: installed ? T.actII : T.ember,
              fontWeight: 600,
            }}
          >
            {installed ? t('entry.prepare.done') : t('entry.prepare.recommended')}
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

        <button
          type="button"
          data-testid="app-entry-download"
          aria-label={
            done
              ? t('entry.prepare.downloadComplete')
              : downloadError
                ? t('entry.prepare.retryDownload')
                : t('entry.prepare.downloadAria')
          }
          disabled={done || downloading}
          onClick={() => {
            if (done || downloading) return
            onDownload?.()
          }}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            borderRadius: 14,
            border: `1.5px solid ${T.ember}55`,
            background: `${T.ember}0a`,
            padding: '18px 16px 16px',
            marginBottom: 16,
            cursor: done || downloading ? 'default' : 'pointer',
            font: 'inherit',
            color: 'inherit',
          }}
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
            {t('entry.prepare.recommended')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 16, color: T.warmWhite, fontWeight: 500, marginBottom: 5 }}>
                {t('entry.prepare.download')}
                <span style={{ color: T.muted, fontWeight: 400, fontSize: 14 }}>
                  {t('entry.prepare.size')}
                </span>
              </p>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                {t('entry.prepare.contents')}
              </p>
              {done ? (
                mapTilesPartial ? (
                  <p style={{ fontSize: 12, color: T.ember, marginTop: 6 }}>
                    {t('entry.prepare.partial')}
                  </p>
                ) : (
                  <p style={{ fontSize: 12, color: T.actII, marginTop: 6 }}>
                    {t('entry.prepare.ready')}
                  </p>
                )
              ) : downloading ? (
                <p style={{ fontSize: 12, color: T.ember, marginTop: 6 }}>
                  {downloadProgress > 0.02
                    ? t('entry.prepare.saved', {
                        percent: Math.max(1, Math.round(downloadProgress * 100)),
                      })
                    : t('entry.prepare.starting')}
                </p>
              ) : downloadError ? (
                <p style={{ fontSize: 12, color: T.ember, marginTop: 6 }}>{downloadError}</p>
              ) : null}
            </div>
            <span style={{ flexShrink: 0, lineHeight: 0 }} aria-hidden="true">
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
            </span>
          </div>
        </button>

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
            {t('common.continue')}
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
            {t('entry.prepare.later')}
          </button>
        </div>
      </div>
    </div>
  )
}
