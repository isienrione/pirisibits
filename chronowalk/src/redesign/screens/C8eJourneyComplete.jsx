import { T, F, S, SHELL_SAFE_BOTTOM_INSET } from '../tokens.js'
import { PrimaryButton, SecondaryButton, Vignette } from '../ui/index.js'
import { RiseIn } from '../motion/index.js'
import { appiaNow } from '../images.js'

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
  const stats = stopCount > 0 ? [`${stopCount} stop${stopCount === 1 ? '' : 's'}`] : []

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
          filter: 'brightness(0.22) saturate(0.5)',
          pointerEvents: 'none',
        }}
      />
      <Vignette />

      <RiseIn
        category="journal"
        show
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `max(64px, calc(env(safe-area-inset-top) + ${S.xl})) ${S.xl} ${S.l}`,
        }}
      >
        <h1
          style={{
            fontFamily: F.display,
            fontSize: 34,
            fontWeight: 300,
            color: T.warmWhite,
            lineHeight: 1.1,
            textAlign: 'center',
            margin: `0 0 ${S.m}`,
            textShadow: '0 2px 24px rgba(0,0,0,0.55)',
          }}
        >
          {headline}
        </h1>
        <p
          style={{
            fontFamily: F.display,
            fontSize: 18,
            fontStyle: 'italic',
            fontWeight: 300,
            color: `${T.warmWhite}CC`,
            lineHeight: 1.5,
            textAlign: 'center',
            margin: 0,
            maxWidth: 340,
          }}
        >
          {subline}
        </p>
      </RiseIn>

      <RiseIn
        category="navigation"
        show
        delay={200}
        duration={900}
        y={0}
        style={{
          position: 'relative',
          zIndex: 12,
          flexShrink: 0,
          padding: `0 ${S.edge} calc(${SHELL_SAFE_BOTTOM_INSET} + ${S.m})`,
        }}
      >
        {stats.length ? (
          <p
            style={{
              fontSize: 13,
              color: T.muted,
              textAlign: 'center',
              margin: `0 0 ${S.l}`,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {stats[0]}
          </p>
        ) : null}

        <PrimaryButton
          color={accent}
          textColor={T.warmWhite}
          glow={false}
          disabled={busy}
          onClick={() => onReadLetter?.()}
          style={{ marginBottom: S.m }}
          data-testid="journey-complete-letter"
        >
          Read your letter
        </PrimaryButton>

        <SecondaryButton
          disabled={busy}
          onClick={() => onReturnTour?.()}
          data-testid="journey-complete-tour"
        >
          Return to My Tour
        </SecondaryButton>
      </RiseIn>
    </div>
  )
}
