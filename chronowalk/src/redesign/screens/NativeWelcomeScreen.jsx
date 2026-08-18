import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ChronoWalkLogo from '../../components/ui/ChronoWalkLogo.jsx'
import { LANDING_HERO } from '../../landing/landingVisualAssets.js'
import { startNativeGuestExploration } from '../../lib/guestSession.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { GhostButton } from '../ui/GhostButton.jsx'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'

const INTRO_VIDEO_SRC = '/landing/intro-open.mp4'
const INTRO_POSTER_SRC = '/landing/intro-open-poster.jpg'

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
  )
}

/**
 * Native-first Welcome — cinematic ChronoWalk entrance, not a marketing landing
 * or login form. Video failure must never block the CTAs.
 */
export default function NativeWelcomeScreen() {
  const t = useT()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const [reduceMotion] = useState(() => prefersReducedMotion())
  const [videoFailed, setVideoFailed] = useState(false)
  const showVideo = !reduceMotion && !videoFailed

  useEffect(() => {
    track(TRACK_EVENTS.NATIVE_WELCOME_VIEWED)
  }, [])

  useEffect(() => {
    if (!showVideo) return undefined
    const node = videoRef.current
    if (!node) return undefined
    const play = node.play()
    if (play && typeof play.catch === 'function') {
      play.catch(() => setVideoFailed(true))
    }
    return undefined
  }, [showVideo])

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

      {showVideo ? (
        <video
          ref={videoRef}
          data-testid="native-welcome-video"
          src={INTRO_VIDEO_SRC}
          poster={INTRO_POSTER_SRC}
          muted
          playsInline
          autoPlay
          preload="metadata"
          onError={() => setVideoFailed(true)}
          onEnded={(event) => {
            try {
              event.currentTarget.pause()
            } catch {
              /* ignore */
            }
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <img
          data-testid="native-welcome-poster"
          src={INTRO_POSTER_SRC}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(11,11,13,0.28) 0%, rgba(11,11,13,0.18) 38%, rgba(11,11,13,0.82) 100%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '32px 24px max(28px, env(safe-area-inset-bottom))',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: 420, margin: '0 auto', width: '100%' }}>
          <ChronoWalkLogo variant="dark" layout="stacked" width={168} />
          <p
            data-testid="native-welcome-proposition"
            style={{
              margin: '18px 0 28px',
              fontFamily: F.display,
              fontSize: 22,
              lineHeight: 1.35,
              fontWeight: 400,
              color: T.bone,
            }}
          >
            {t('native.welcome.proposition')}
          </p>
          <PrimaryButton
            color={T.gold}
            data-testid="native-welcome-start"
            onClick={handleStart}
            style={{ marginBottom: 12 }}
          >
            {t('native.welcome.cta.start')}
          </PrimaryButton>
          <GhostButton data-testid="native-welcome-access" onClick={() => navigate('/access')}>
            {t('native.welcome.cta.access')}
          </GhostButton>
        </div>
      </div>
    </div>
  )
}
