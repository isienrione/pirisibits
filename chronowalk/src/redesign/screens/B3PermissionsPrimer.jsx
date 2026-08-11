import { MapPin, Navigation, Shield } from 'lucide-react'
import { T, F } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { Vignette } from '../ui/index.js'
import ChronoWalkLogo from '../ui/ChronoWalkLogo.jsx'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import { GhostButton } from '../ui/GhostButton.jsx'
import { useT } from '../../i18n/I18nProvider.jsx'

const BENEFITS = [
  {
    icon: Navigation,
    key: 'onboarding.permissions.benefit.arrivals',
  },
  {
    icon: MapPin,
    key: 'onboarding.permissions.benefit.directions',
  },
  {
    icon: Shield,
    key: 'onboarding.permissions.benefit.settings',
  },
]

export default function B3PermissionsPrimer({ onEnable, onSkip, busy = false, paceTitle }) {
  const t = useT()
  return (
    <div
      data-testid="permissions-primer"
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
          backgroundPosition: 'center 30%',
          filter: 'brightness(0.28) saturate(0.5)',
        }}
      />
      <Vignette />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding:
            'max(48px, calc(env(safe-area-inset-top) + 20px)) 24px max(32px, calc(env(safe-area-inset-bottom) + 24px))',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28, flexShrink: 0 }}>
          <ChronoWalkLogo size={68} />
          <p
            style={{
              marginTop: 14,
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: T.muted,
            }}
          >
            {t('onboarding.permissions.eyebrow')}
          </p>
        </div>

        <div
          style={{
            flex: '1 0 auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: 360,
            margin: '0 auto',
            width: '100%',
            minHeight: 0,
          }}
        >
          <h1
            style={{
              fontFamily: F.display,
              fontSize: 34,
              fontWeight: 300,
              color: T.warmWhite,
              lineHeight: 1.12,
              margin: '0 0 14px',
              textAlign: 'center',
            }}
          >
            {t('onboarding.permissions.title')}
          </h1>
          <p
            style={{
              fontSize: 15,
              color: T.muted,
              lineHeight: 1.65,
              textAlign: 'center',
              margin: '0 0 28px',
            }}
          >
            {t('onboarding.permissions.body')}
          </p>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {BENEFITS.map(({ icon: Icon, key }) => (
              <li key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(232,161,60,0.14)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={T.ember} strokeWidth={1.8} />
                </span>
                <p style={{ margin: 0, fontSize: 14, color: `${T.warmWhite}dd`, lineHeight: 1.55 }}>{t(key)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: 24, flexShrink: 0, paddingBottom: 8 }}>
          {paceTitle ? (
            <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', margin: '0 0 16px' }}>
              {t('onboarding.permissions.pace', { pace: paceTitle })}
            </p>
          ) : null}
          <PrimaryButton onClick={onEnable} disabled={busy}>
            {busy
              ? t('onboarding.permissions.requesting')
              : t('onboarding.permissions.enable')}
          </PrimaryButton>
          {onSkip ? (
            <div style={{ marginTop: 10 }}>
              <GhostButton onClick={onSkip} disabled={busy}>
                {t('onboarding.permissions.skip')}
              </GhostButton>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
