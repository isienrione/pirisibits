import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useTourManifest } from '../../hooks/useJourney.js'
import { useAudioEngine } from '../../hooks/useAudioEngine.js'
import {
  PLATFORM_CITIES,
  ROME_ENTRANCE_IMAGE,
  WELCOME_CROSSFADE_MS,
  WELCOME_REDUCED_MS,
  WELCOME_SEAM_MS,
  WELCOME_SPLASH_MS,
} from '../../data/welcomeConfig'
import { Beacon } from './Beacon'
import { PrismSeamLogo } from './PrismSeamLogo'

function WelcomeShell({ children, aura = false }) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100dvh',
        background: 'var(--obsidian)',
        color: 'var(--warm-white)',
        fontFamily: 'var(--font-ui)',
        overflow: 'hidden',
      }}
    >
      {aura ? (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: '0 0 auto 0',
            height: '42%',
            background:
              'radial-gradient(ellipse 120% 80% at 50% -10%, color-mix(in srgb, var(--city-rome) 15%, transparent) 0%, color-mix(in srgb, var(--city-kyoto) 10%, transparent) 35%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 50% at 50% 12%, color-mix(in srgb, var(--ember) 18%, transparent) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100dvh',
          padding:
            'max(var(--edge), env(safe-area-inset-top)) var(--edge) max(var(--edge), env(safe-area-inset-bottom))',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function SplashView({ onDone, reducedMotion, onSeamStart }) {
  const [seamProgress, setSeamProgress] = useState(0)
  const fadeMs = reducedMotion ? WELCOME_REDUCED_MS : WELCOME_CROSSFADE_MS
  const seamCuePlayedRef = useRef(false)

  useEffect(() => {
    if (reducedMotion) {
      const done = window.setTimeout(onDone, WELCOME_REDUCED_MS)
      return () => window.clearTimeout(done)
    }

    const seamStart = performance.now()
    let raf = 0

    const tick = (now) => {
      if (!seamCuePlayedRef.current) {
        seamCuePlayedRef.current = true
        onSeamStart?.()
      }

      const t = Math.min(1, (now - seamStart) / WELCOME_SEAM_MS)
      setSeamProgress(t)
      if (t < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    const done = window.setTimeout(onDone, WELCOME_SPLASH_MS)

    return () => {
      window.clearTimeout(done)
      cancelAnimationFrame(raf)
    }
  }, [onDone, onSeamStart, reducedMotion])

  return (
    <WelcomeShell>
      <div
        style={{
          minHeight: 'calc(100dvh - 2 * var(--edge))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <PrismSeamLogo size={84} />
        <p
          style={{
            marginTop: 20,
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
          }}
        >
          ChronoWalk
        </p>
        <p
          style={{
            marginTop: 10,
            fontFamily: 'var(--font-display)',
            fontSize: 19,
            fontStyle: 'italic',
            color: 'color-mix(in srgb, var(--warm-white) 88%, transparent)',
          }}
        >
          The world, as it once was.
        </p>
      </div>

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 'var(--edge)',
          right: 'var(--edge)',
          bottom: 'max(1.25rem, env(safe-area-inset-bottom))',
          height: 3,
          borderRadius: 999,
          background: 'color-mix(in srgb, var(--warm-white) 12%, transparent)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${seamProgress * 100}%`,
            background: 'var(--ember)',
            boxShadow: '0 0 10px var(--ember-glow)',
            transition: reducedMotion ? undefined : 'width 80ms linear',
          }}
        />
      </div>
    </WelcomeShell>
  )
}

function CitySelectView({ onSelectRome }) {
  const rome = PLATFORM_CITIES.find((city) => city.id === 'rome')
  const coming = PLATFORM_CITIES.filter((city) => city.status !== 'available')

  return (
    <WelcomeShell aura>
      <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 24 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 30,
            fontWeight: 500,
            lineHeight: 1.15,
          }}
        >
          Cross into a
          <br />
          city&apos;s past.
        </h1>
        <p style={{ marginTop: 12, fontSize: 14, color: 'var(--muted-warm)' }}>
          One city at a time. Rome is ready when you are.
        </p>

        <button
          type="button"
          onClick={onSelectRome}
          style={{
            marginTop: 28,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px 18px',
            borderRadius: 16,
            border: '1px solid color-mix(in srgb, var(--city-rome) 55%, transparent)',
            background: 'color-mix(in srgb, var(--city-rome) 20%, var(--obsidian))',
            color: 'var(--warm-white)',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              display: 'grid',
              placeItems: 'center',
              background: 'color-mix(in srgb, var(--city-rome) 35%, var(--obsidian))',
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 500,
            }}
          >
            {rome?.monogram}
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 20 }}>
              {rome?.name}
            </span>
            <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: 'var(--muted-warm)' }}>
              {rome?.subtitle}
            </span>
          </span>
          <span style={{ color: 'var(--city-rome)', fontSize: 18 }} aria-hidden="true">
            →
          </span>
        </button>

        <p
          style={{
            marginTop: 28,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--muted-warm)',
          }}
        >
          On their way · 2027
        </p>

        <div
          style={{
            marginTop: 12,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          {coming.map((city) => (
            <div
              key={city.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'color-mix(in srgb, var(--ink) 55%, transparent)',
                opacity: 0.55,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: city.accent,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 14, color: 'var(--muted-warm)' }}>{city.name}</span>
            </div>
          ))}
        </div>
      </div>
    </WelcomeShell>
  )
}

function EnteringRomeView({ onBegin }) {
  const [heroFailed, setHeroFailed] = useState(false)

  return (
    <div style={{ position: 'relative', minHeight: '100dvh', background: 'var(--obsidian)' }}>
      {!heroFailed ? (
        <img
          src={ROME_ENTRANCE_IMAGE}
          alt=""
          aria-hidden="true"
          onError={() => setHeroFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 38%',
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'color-mix(in srgb, var(--city-rome) 18%, var(--obsidian))',
          }}
        />
      )}

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'color-mix(in srgb, var(--obsidian) 62%, transparent)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding:
            'max(var(--edge), env(safe-area-inset-top)) var(--edge) max(calc(var(--edge) + 0.5rem), env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ marginBottom: 'auto', paddingTop: 8 }}>
          <Beacon />
        </div>

        <p
          style={{
            margin: '0 0 10px',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--muted-warm)',
          }}
        >
          Your first city
        </p>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.75rem, 11vw, 3.25rem)',
            fontWeight: 500,
            lineHeight: 1.02,
          }}
        >
          Rome
        </h1>
        <p
          style={{
            margin: '10px 0 0',
            fontFamily: 'var(--font-display)',
            fontSize: 19,
            fontStyle: 'italic',
            color: 'color-mix(in srgb, var(--warm-white) 90%, transparent)',
          }}
        >
          as it once was.
        </p>
        <p
          style={{
            marginTop: 14,
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--muted-warm)',
            maxWidth: '28rem',
          }}
        >
          Twenty-two places. Six acts. Stories that unlock exactly where you stand.
        </p>

        <button
          type="button"
          onClick={onBegin}
          style={{
            marginTop: 28,
            width: '100%',
            padding: '16px 20px',
            border: 'none',
            borderRadius: 999,
            background: 'var(--accent)',
            color: 'var(--ink-900)',
            fontSize: 'var(--fs-body)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Begin
        </button>
      </div>
    </div>
  )
}

export default function WelcomeFlow() {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const { manifest } = useTourManifest()
  const audio = useAudioEngine(manifest)
  const [step, setStep] = useState('splash')
  const [visible, setVisible] = useState(true)

  const playSeamCue = useCallback(() => {
    void audio.playUiCue('phase_transition')
  }, [audio])

  const transitionTo = (nextStep) => {
    if (reducedMotion) {
      setStep(nextStep)
      return
    }

    setVisible(false)
    window.setTimeout(() => {
      setStep(nextStep)
      setVisible(true)
    }, WELCOME_CROSSFADE_MS)
  }

  const content =
    step === 'splash' ? (
      <SplashView onDone={() => transitionTo('cities')} reducedMotion={reducedMotion} onSeamStart={playSeamCue} />
    ) : step === 'cities' ? (
      <CitySelectView onSelectRome={() => transitionTo('entering')} />
    ) : (
      <EnteringRomeView onBegin={() => navigate('/landing')} />
    )

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: reducedMotion
          ? undefined
          : `opacity ${WELCOME_CROSSFADE_MS}ms var(--ease)`,
      }}
    >
      {content}
    </div>
  )
}
