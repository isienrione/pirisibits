import { useEffect, useState } from 'react'
import { T, F } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { photoForWaypoint, titleForWaypoint } from '../lib/waypointPresentation.js'

/** Soft Ancient Rome motif — fallback when a stop photo is unavailable. */
function RomeMotif() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 220 160"
      style={{
        position: 'absolute',
        right: -8,
        bottom: 28,
        width: 200,
        height: 146,
        opacity: 0.28,
        pointerEvents: 'none',
      }}
    >
      <path
        d="M40 140 V58 M70 140 V58 M40 58 H70 M30 52 H80"
        fill="none"
        stroke={T.actIV}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M100 140 V72 M160 140 V72 M100 72 Q130 28 160 72"
        fill="none"
        stroke={T.actVI}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="186" cy="48" r="16" fill="none" stroke={T.actIII} strokeWidth="4" />
      <path d="M186 36 V48 L196 48" fill="none" stroke={T.actV} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Full-bleed Home hero — current (or next) stop photo with readable scrims.
 */
export default function HomeStopHero({ waypoint = null, children }) {
  const t = useT()
  const src = waypoint ? photoForWaypoint(waypoint) : null
  const title = waypoint ? titleForWaypoint(waypoint) : null
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  const showPhoto = Boolean(src) && !failed

  return (
    <section
      data-testid="home-stop-hero"
      aria-label={
        title ? t('home.hero.aria', { title }) : t('home.hero.ariaReady')
      }
      style={{
        position: 'relative',
        flex: '1 1 0',
        minHeight: 120,
        overflow: 'hidden',
        background: showPhoto
          ? T.charcoal
          : `
            radial-gradient(80% 70% at 90% 10%, rgba(78,155,143,0.35) 0%, transparent 55%),
            radial-gradient(70% 60% at 10% 80%, rgba(177,74,110,0.28) 0%, transparent 50%),
            radial-gradient(50% 50% at 70% 70%, rgba(232,161,60,0.22) 0%, transparent 45%),
            linear-gradient(165deg, #2A4A52 0%, #1A2E34 45%, #3A2A28 100%)
          `,
      }}
    >
      {showPhoto ? (
        <img
          key={src}
          src={src}
          alt=""
          data-testid="home-stop-hero-image"
          onError={() => setFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 35%',
          }}
        />
      ) : (
        <RomeMotif />
      )}

      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: showPhoto
            ? `
              linear-gradient(180deg, rgba(11,11,13,0.45) 0%, rgba(11,11,13,0.12) 28%, rgba(11,11,13,0.08) 48%, rgba(250,246,239,0.55) 78%, ${T.bone} 100%),
              linear-gradient(90deg, rgba(11,11,13,0.28) 0%, transparent 42%)
            `
            : `
              linear-gradient(180deg, rgba(11,11,13,0.35) 0%, transparent 32%, rgba(250,246,239,0.45) 78%, ${T.bone} 100%)
            `,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 0,
          color: T.warmWhite,
          fontFamily: F.body,
        }}
      >
        {children}
      </div>
    </section>
  )
}
