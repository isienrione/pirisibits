import { T, F, SHELL_TAB_BAR_INSET } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { Eyebrow } from '../ui/index.js'

export default function C3Approaching({
  accent = T.actI,
  title = 'The Colosseum',
  photo = colosseumNow,
  approachLine = 'The stones are close now — let the city slow you down.',
  progressPct = 35,
  subtitle = 'almost there',
  onArrive,
  locationShy = false,
  companionEyebrow = null,
  companionTitle = null,
  companionSubtitle = null,
}) {
  const showCompanion = Boolean(companionEyebrow || companionTitle || companionSubtitle)

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
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 5 }}>
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            background: accent,
            boxShadow: `0 0 8px ${accent}80`,
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          background: `linear-gradient(180deg, ${T.warmWhite} 0%, ${T.bone} 100%)`,
        }}
      >
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `1px solid ${accent}`,
              animation: 'approachPulse 3.8s ease-in-out infinite 0.7s',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 18,
              borderRadius: '50%',
              border: `1.5px solid ${accent}`,
              animation: 'approachPulse 3.8s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 8,
              height: 8,
              borderRadius: 4,
              background: accent,
              boxShadow: `0 0 10px ${accent}CC, 0 0 20px ${accent}66`,
            }}
          />
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          background: T.warmWhite,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: `0 -8px 32px ${T.ink}12`,
          padding: `18px 20px calc(${SHELL_TAB_BAR_INSET} + 16px)`,
          position: 'relative',
          zIndex: 12,
        }}
      >
        {showCompanion ? (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              borderRadius: 12,
              background: `${accent}12`,
              border: `1px solid ${accent}28`,
            }}
          >
            {companionEyebrow ? (
              <Eyebrow color={accent}>{companionEyebrow.toUpperCase()}</Eyebrow>
            ) : null}
            {companionTitle ? (
              <p style={{ margin: '6px 0 4px', fontSize: 15, fontWeight: 600, color: T.ink }}>
                {companionTitle}
              </p>
            ) : null}
            {companionSubtitle ? (
              <p style={{ margin: 0, fontSize: 13, color: `${T.ink}72`, lineHeight: 1.55 }}>
                {companionSubtitle}
              </p>
            ) : null}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <img
            src={photo}
            alt=""
            style={{
              width: 88,
              height: 88,
              borderRadius: 14,
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: `0 0 0 1px ${accent}33`,
            }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <Eyebrow color={accent}>ALMOST THERE</Eyebrow>
            <h1
              style={{
                fontFamily: F.display,
                fontSize: 32,
                color: T.ink,
                fontWeight: 300,
                lineHeight: 1.08,
                margin: '6px 0 4px',
              }}
            >
              {title}
            </h1>
            <p style={{ fontSize: 14, color: accent, letterSpacing: '0.04em', margin: '0 0 8px' }}>
              {subtitle}
            </p>
            <p style={{ fontSize: 14, color: `${T.ink}72`, lineHeight: 1.6, margin: 0 }}>
              {approachLine}
            </p>
          </div>
        </div>

        {onArrive ? (
          <button
            type="button"
            data-testid="manual-arrive"
            onClick={onArrive}
            style={{
              marginTop: 18,
              width: '100%',
              background: 'transparent',
              border: `1px solid ${accent}`,
              borderRadius: 12,
              padding: '11px 22px',
              cursor: 'pointer',
              color: accent,
              fontFamily: F.body,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            I&apos;m here
          </button>
        ) : null}
        {onArrive && locationShy ? (
          <p
            style={{
              margin: '12px 0 0',
              fontSize: 12,
              color: T.muted,
              fontStyle: 'italic',
              lineHeight: 1.5,
              textAlign: 'center',
            }}
          >
            The satellites are being shy — tap when you&apos;ve reached it.
          </p>
        ) : null}
      </div>
    </div>
  )
}
