import { T, F } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { Vignette, Eyebrow, PulseRings } from '../ui/index.js'

/**
 * Arrival — full-bleed photo + cream card (Figma: YOU'VE ARRIVED, Step through time).
 */
export default function C4ArrivalMoment({
  accent = T.actI,
  title = 'The Colosseum',
  photo = colosseumNow,
  description = 'Take a second. Look up.',
  hasReconstruction = true,
  onStepThroughTime,
  onAudioOnly,
  onTranscript,
  busy = false,
}) {
  return (
    <div
      style={{
        background: T.bone,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Photo hero — top ~52% */}
      <div style={{ position: 'relative', flex: '0 0 52%', minHeight: 280, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${photo})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 25%',
          }}
        />
        <Vignette />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(22,19,15,0.15) 0%, rgba(22,19,15,0.55) 100%)',
          }}
        />

        {/* Centered water-drop beacon */}
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 5,
          }}
        >
          <PulseRings accent={accent} variant="arrival" count={3} />
        </div>
      </div>

      {/* Cream arrival card */}
      <div
        style={{
          flex: 1,
          background: T.bone,
          borderRadius: '24px 24px 0 0',
          marginTop: -24,
          position: 'relative',
          zIndex: 10,
          padding: '28px 24px max(28px, calc(env(safe-area-inset-bottom) + 16px))',
          boxShadow: '0 -8px 32px rgba(33,28,21,0.12)',
        }}
      >
        <Eyebrow color={accent}>YOU&apos;VE ARRIVED</Eyebrow>
        <h1
          style={{
            fontFamily: F.display,
            fontSize: 34,
            color: T.ink,
            fontWeight: 300,
            lineHeight: 1.1,
            margin: '10px 0 14px',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 15,
            color: T.muted,
            lineHeight: 1.65,
            marginBottom: 24,
          }}
        >
          {description}
        </p>

        {hasReconstruction ? (
          <button
            type="button"
            disabled={busy}
            onClick={onStepThroughTime}
            style={{
              width: '100%',
              padding: '16px 20px',
              borderRadius: 14,
              border: 'none',
              background: accent,
              color: T.warmWhite,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 16,
              cursor: busy ? 'wait' : 'pointer',
              marginBottom: 14,
              boxShadow: `0 4px 20px ${accent}44`,
            }}
          >
            Step through time
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={onAudioOnly}
            style={{
              width: '100%',
              padding: '16px 20px',
              borderRadius: 14,
              border: 'none',
              background: accent,
              color: T.warmWhite,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 16,
              cursor: busy ? 'wait' : 'pointer',
              marginBottom: 14,
            }}
          >
            Begin story
          </button>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            disabled={busy}
            onClick={onAudioOnly}
            style={{
              flex: 1,
              padding: '13px 12px',
              borderRadius: 999,
              border: `1.5px solid ${T.muted}55`,
              background: 'transparent',
              color: T.ink,
              fontFamily: F.body,
              fontSize: 14,
              fontWeight: 500,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            Audio only
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onTranscript}
            style={{
              flex: 1,
              padding: '13px 12px',
              borderRadius: 999,
              border: `1.5px solid ${T.muted}55`,
              background: 'transparent',
              color: T.ink,
              fontFamily: F.body,
              fontSize: 14,
              fontWeight: 500,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            Transcript
          </button>
        </div>
      </div>
    </div>
  )
}
