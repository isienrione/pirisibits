import { useEffect, useState } from 'react'
import {T, F, SHELL_SAFE_BOTTOM_INSET, withAlpha} from '../tokens.js'
import { appiaNow } from '../images.js'
import { Vignette } from '../ui/index.js'

export default function C8eJourneyComplete({
  headline = 'You walked Ancient Rome.',
  subline = 'The city you crossed is still beneath your feet.',
  heroPhoto = appiaNow,
  stopCount = 0,
  accent = T.encore,
  busy = false,
  onReadLetter,
  onReturnTour,
}) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 180)
    return () => clearTimeout(timer)
  }, [])

  const stats = [
    stopCount > 0 ? `${stopCount} stop${stopCount === 1 ? '' : 's'}` : null,
    '21 centuries',
    'One road still here',
  ].filter(Boolean)

  return (
    <div
      data-testid="journey-complete-screen"
      style={{
        background: T.obsidian,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${heroPhoto})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 42%',
          filter: 'brightness(0.14) saturate(0.42)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(138,111,181,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(138,111,181,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '44px 44px',
          pointerEvents: 'none',
        }}
      />
      <Vignette />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'max(56px, calc(env(safe-area-inset-top) + 24px)) 32px 24px',
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 700ms ease, transform 700ms ease',
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: accent,
            margin: '0 0 18px',
          }}
        >
          Journey complete
        </p>
        <h1
          style={{
            fontFamily: F.display,
            fontSize: 34,
            fontWeight: 300,
            color: T.warmWhite,
            lineHeight: 1.1,
            textAlign: 'center',
            margin: '0 0 14px',
            textShadow: '0 2px 24px rgba(0,0,0,0.55)',
          }}
        >
          {headline}
        </h1>
        <p
          style={{
            fontFamily: F.display,
            fontSize: 20,
            fontStyle: 'italic',
            fontWeight: 300,
            color: `${withAlpha(T.warmWhite, 'CC')}`,
            lineHeight: 1.5,
            textAlign: 'center',
            margin: 0,
            maxWidth: 360,
          }}
        >
          {subline}
        </p>
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 12,
          flexShrink: 0,
          padding: `0 28px calc(${SHELL_SAFE_BOTTOM_INSET} + 12px)`,
          opacity: revealed ? 1 : 0,
          transition: 'opacity 900ms ease 200ms',
        }}
      >
        {stats.length ? (
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 22,
              flexWrap: 'wrap',
            }}
          >
            {stats.map((stat, index) => (
              <span
                key={stat}
                style={{
                  fontSize: 13,
                  color: T.muted,
                  fontVariantNumeric: 'tabular-nums',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {index > 0 ? <span style={{ color: T.ink800, fontSize: 10 }}>·</span> : null}
                {stat}
              </span>
            ))}
          </div>
        ) : null}

        <div
          style={{
            width: 1.5,
            height: 24,
            background: T.ember,
            margin: '0 auto 22px',
            boxShadow: '0 0 12px rgba(232,161,60,0.45)',
          }}
        />

        <button
          type="button"
          data-testid="journey-complete-letter"
          disabled={busy}
          onClick={() => onReadLetter?.()}
          style={{
            width: '100%',
            padding: '15px',
            background: accent,
            color: T.warmWhite,
            borderRadius: 12,
            fontFamily: F.body,
            fontWeight: 600,
            fontSize: 15,
            border: 'none',
            cursor: busy ? 'wait' : 'pointer',
            marginBottom: 12,
            boxShadow: `0 0 22px ${accent}55`,
          }}
        >
          Read your letter
        </button>

        <button
          type="button"
          data-testid="journey-complete-tour"
          disabled={busy}
          onClick={() => onReturnTour?.()}
          style={{
            width: '100%',
            padding: '13px',
            background: 'transparent',
            color: T.muted,
            borderRadius: 12,
            fontFamily: F.body,
            fontWeight: 500,
            fontSize: 14,
            border: `1px solid ${withAlpha(T.muted, '33')}`,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          Return to My Tour
        </button>
      </div>
    </div>
  )
}
