import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nProvider.jsx'
import { SUPPORTED_LOCALES } from '../../i18n/locales.js'
import { isNativeIOS } from '../../lib/platform.js'
import { F, T } from '../tokens.js'
import { GhostButton } from '../ui/GhostButton.jsx'

export default function NativeSettingsScreen() {
  const navigate = useNavigate()
  const { locale, setLocale, t } = useI18n()

  return (
    <div
      data-testid="native-settings"
      style={{
        minHeight: '100%',
        background: T.bone,
        color: T.ink,
        padding:
          'max(28px, calc(env(safe-area-inset-top) + 16px)) 22px calc(var(--shell-tab-bar-height, 72px) + 16px)',
        boxSizing: 'border-box',
      }}
    >
      <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, margin: '0 0 8px' }}>
        {t('settings.title')}
      </h1>
      <p style={{ margin: '0 0 24px', color: T.muted, lineHeight: 1.45 }}>{t('native.settings.intro')}</p>

      <p style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted }}>
        {t('native.settings.language')}
      </p>
      <div style={{ display: 'flex', gap: 8, margin: '10px 0 24px' }}>
        {SUPPORTED_LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            aria-pressed={locale === code}
            onClick={() => setLocale(code)}
            style={{
              minHeight: 44,
              padding: '10px 16px',
              borderRadius: 999,
              border: locale === code ? `1.5px solid ${T.ink}` : `1.5px solid ${T.muted}55`,
              background: locale === code ? T.ink : 'transparent',
              color: locale === code ? T.bone : T.ink,
              fontFamily: F.body,
            }}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>

      <GhostButton
        data-testid="native-settings-access"
        onClick={() => navigate('/access')}
        style={{ minHeight: 48, color: T.ink, borderColor: `${T.muted}66`, background: 'transparent' }}
      >
        {t('native.welcome.cta.access')}
      </GhostButton>
      <GhostButton
        onClick={() => navigate('/credits')}
        style={{ marginTop: 10, minHeight: 48, color: T.ink, borderColor: `${T.muted}66`, background: 'transparent' }}
      >
        {t('native.settings.about')}
      </GhostButton>
      {isNativeIOS() ? (
        <p style={{ marginTop: 28, color: T.muted, fontSize: 13, lineHeight: 1.45 }}>
          {t('native.settings.downloadLater')}
        </p>
      ) : null}
    </div>
  )
}
