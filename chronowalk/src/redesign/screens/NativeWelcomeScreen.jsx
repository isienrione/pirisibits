import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LANDING_HERO } from '../../landing/landingVisualAssets.js'
import { startNativeGuestExploration } from '../../lib/guestSession.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { GhostButton } from '../ui/GhostButton.jsx'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'

/**
 * Native-first Welcome — cinematic Rome still, restrained identity, one proposition.
 * No intro-open logo video, no stacked lockup, no “private audio guide.”
 */
export default function NativeWelcomeScreen() {
  const t = useT()
  const navigate = useNavigate()

  useEffect(() => {
    track(TRACK_EVENTS.NATIVE_WELCOME_VIEWED)
  }, [])

  const handleStart = () => {
    const { nextPath } = startNativeGuestExploration()
    track(TRACK_EVENTS.NATIVE_GUEST_STARTED)
    navigate(nextPath, { replace: true })
  }

  return (
    <div
      data-testid="native-welcome"
      style={{
        position: 'relative',
        minHeight: '100%',
        height: '100dvh',
        background: T.obsidian,
        color: T.bone,
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${LANDING_HERO.mobileSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: LANDING_HERO.objectPosition,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(11,11,13,0.22) 0%, rgba(11,11,13,0.12) 42%, rgba(11,11,13,0.88) 100%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding:
            'max(28px, env(safe-area-inset-top)) 24px max(28px, calc(env(safe-area-inset-bottom) + 12px))',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: 420, margin: '0 auto', width: '100%' }}>
          <p
            data-testid="native-welcome-brand"
            style={{
              margin: 0,
              fontFamily: F.body,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: T.bone,
            }}
          >
            {t('native.welcome.brand')}
          </p>
          <h1
            data-testid="native-welcome-proposition"
            style={{
              margin: '18px 0 10px',
              fontFamily: F.display,
              fontSize: 32,
              lineHeight: 1.2,
              fontWeight: 400,
              color: T.bone,
            }}
          >
            {t('native.welcome.proposition')}
          </h1>
          <p
            style={{
              margin: '0 0 28px',
              fontFamily: F.body,
              fontSize: 16,
              lineHeight: 1.5,
              color: 'rgba(250,246,239,0.78)',
            }}
          >
            {t('native.welcome.supporting')}
          </p>
          <PrimaryButton
            color={T.gold}
            data-testid="native-welcome-start"
            onClick={handleStart}
            style={{ marginBottom: 12, minHeight: 48 }}
          >
            {t('native.welcome.cta.start')}
          </PrimaryButton>
          <GhostButton
            data-testid="native-welcome-access"
            onClick={() => navigate('/access')}
            style={{ minHeight: 48 }}
          >
            {t('native.welcome.cta.access')}
          </GhostButton>
        </div>
      </div>
    </div>
  )
}
