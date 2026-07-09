import { T, F, SHELL_SAFE_BOTTOM_INSET } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { Vignette, Eyebrow, PulseRings } from '../ui/index.js'

/**
 * Arrival — full-bleed photo + cream card with full immersive options on every stop.
 */
export default function C4ArrivalMoment({
  accent = T.actI,
  title = 'The Colosseum',
  photo = colosseumNow,
  description = 'Take a second. Look up.',
  onBeginListening,
  onTranscript,
  onViewImages,
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

      <div
        style={{
          flex: 1,
          background: T.bone,
          borderRadius: '24px 24px 0 0',
          marginTop: -24,
          position: 'relative',
          zIndex: 10,
          padding: `28px 24px ${SHELL_SAFE_BOTTOM_INSET}`,
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
        <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.65, marginBottom: 20 }}>{description}</p>

        <button
          type="button"
          disabled={busy}
          onClick={onBeginListening}
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
            marginBottom: 10,
            boxShadow: `0 4px 20px ${accent}44`,
          }}
        >
          Begin listening
        </button>

        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          {onTranscript ? (
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
              Read instead
            </button>
          ) : null}
        </div>

        {onViewImages ? (
          <button
            type="button"
            disabled={busy}
            onClick={onViewImages}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 999,
              border: `1.5px solid ${accent}55`,
              background: 'transparent',
              color: accent,
              fontFamily: F.body,
              fontSize: 13,
              fontWeight: 500,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            View images only
          </button>
        ) : null}
      </div>
    </div>
  )
}
