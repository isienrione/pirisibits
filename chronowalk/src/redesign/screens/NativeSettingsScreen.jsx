import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nProvider.jsx'
import { SUPPORTED_LOCALES } from '../../i18n/locales.js'
import { isNativeIOS } from '../../lib/platform.js'
import { resetGuestOnboarding, resetTravelContext } from '../../lib/guestSession.js'
import { clearRouteState } from '../../lib/route/store.js'
import { F, T } from '../tokens.js'
import { GhostButton } from '../ui/GhostButton.jsx'
import NativeCoverageSheet from '../ui/NativeCoverageSheet.jsx'
import { ROME_SCOPE_IDS } from '../../content/rome/coverage.js'
import { R, routeGhost } from '../ui/RouteSurface.jsx'

const section = {
  margin: '0 0 8px',
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: T.muted,
  fontFamily: F.body,
}

export default function NativeSettingsScreen() {
  const navigate = useNavigate()
  const { locale, setLocale, t } = useI18n()
  const [coverageOpen, setCoverageOpen] = useState(false)

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
      <p style={{ margin: '0 0 24px', color: R.muted, lineHeight: 1.45 }}>{t('native.settings.intro')}</p>

      <p style={section}>{t('native.settings.profile')}</p>
      <p style={{ ...section, marginTop: 18 }}>{t('native.settings.language')}</p>
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

      <p style={section}>{t('native.settings.trip')}</p>
      <GhostButton
        data-testid="native-settings-trip"
        onClick={() => navigate('/context')}
        style={{ minHeight: 48, marginBottom: 18, ...routeGhost }}
      >
        {t('native.settings.tripCue')}
      </GhostButton>

      <p style={section}>{t('native.settings.offline')}</p>
      {isNativeIOS() ? (
        <p style={{ margin: '8px 0 18px', color: T.muted, fontSize: 13, lineHeight: 1.45 }}>
          {t('native.settings.downloadLater')}
        </p>
      ) : (
        <p style={{ margin: '8px 0 18px', color: T.muted, fontSize: 13, lineHeight: 1.45 }}>
          {t('native.settings.downloadLater')}
        </p>
      )}

      <p style={section}>{t('native.settings.purchases')}</p>
      <GhostButton
        data-testid="native-settings-coverage"
        onClick={() => setCoverageOpen(true)}
        style={{ minHeight: 48, ...routeGhost }}
      >
        {t('native.coverage.headline')}
      </GhostButton>
      <GhostButton
        data-testid="native-settings-claim"
        onClick={() => navigate('/access')}
        style={{ marginTop: 10, minHeight: 48, ...routeGhost }}
      >
        {t('native.settings.claimElsewhere')}
      </GhostButton>
      <GhostButton
        data-testid="native-settings-access"
        onClick={() => navigate('/access')}
        style={{ marginTop: 10, minHeight: 48, marginBottom: 18, ...routeGhost }}
      >
        {t('native.welcome.cta.access')}
      </GhostButton>

      <p style={section}>{t('native.settings.help')}</p>
      <GhostButton
        data-testid="native-settings-help"
        onClick={() => navigate('/contact')}
        style={{ minHeight: 48, ...routeGhost }}
      >
        {t('native.settings.help')}
      </GhostButton>
      <GhostButton
        onClick={() => navigate('/credits')}
        style={{ marginTop: 10, minHeight: 48, ...routeGhost }}
      >
        {t('native.settings.about')}
      </GhostButton>
      {import.meta.env.DEV ? (
        <div data-testid="native-qa-panel" style={{ marginTop: 28 }}>
          <p style={section}>{t('native.settings.qa')}</p>
          <GhostButton
            data-testid="qa-reset-onboarding"
            onClick={() => resetGuestOnboarding()}
            style={{ marginTop: 10, minHeight: 48, ...routeGhost }}
          >
            {t('native.settings.qa.resetOnboarding')}
          </GhostButton>
          <GhostButton
            data-testid="qa-reset-context"
            onClick={() => resetTravelContext()}
            style={{ marginTop: 10, minHeight: 48, ...routeGhost }}
          >
            {t('native.settings.qa.resetContext')}
          </GhostButton>
          <GhostButton
            data-testid="qa-reset-route"
            onClick={() => clearRouteState()}
            style={{ marginTop: 10, minHeight: 48, ...routeGhost }}
          >
            {t('native.settings.qa.resetRoute')}
          </GhostButton>
        </div>
      ) : null}
      <NativeCoverageSheet
        open={coverageOpen}
        item={{ title: 'Rome', unlockScopes: [ROME_SCOPE_IDS.ANCIENT, ROME_SCOPE_IDS.HISTORIC, ROME_SCOPE_IDS.COMPLETE] }}
        onClose={() => setCoverageOpen(false)}
      />
    </div>
  )
}
