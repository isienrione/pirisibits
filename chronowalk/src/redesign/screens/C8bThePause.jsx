import { T, F, SHELL_SAFE_BOTTOM_INSET } from '../tokens.js'
import { severusNow } from '../images.js'
import { Seam, Vignette } from '../ui/index.js'

export default function C8bThePause({ onResume, busy = false }) {
  return (
    <div
      data-testid="pause-screen"
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
          backgroundImage: `url(${severusNow})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          filter: 'brightness(0.11) saturate(0.35)',
          pointerEvents: 'none',
        }}
      />
      <Vignette />

      <Seam variant="horizontal" accent={T.ember} style={{ top: '58%', transform: 'none', pointerEvents: 'none' }} />

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
          padding: 'max(48px, calc(env(safe-area-inset-top) + 20px)) 40px 24px',
        }}
      >
        <p
          style={{
            fontFamily: F.display,
            fontSize: 26,
            fontStyle: 'italic',
            fontWeight: 300,
            color: T.warmWhite,
            lineHeight: 1.55,
            textAlign: 'center',
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            margin: 0,
          }}
        >
          Find a piece of shade.
          <br />
          I&apos;ll be here.
        </p>
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 20,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          padding: `16px 36px calc(${SHELL_SAFE_BOTTOM_INSET} + 12px)`,
          background: 'linear-gradient(to top, rgba(22,19,15,0.92) 55%, transparent)',
        }}
      >
        <button
          type="button"
          data-testid="pause-ready"
          disabled={busy}
          onClick={() => onResume?.()}
          style={{
            width: 'min(420px, 100%)',
            padding: '15px 36px',
            border: `1px solid rgba(245,239,227,0.28)`,
            borderRadius: 12,
            background: 'rgba(22,19,15,0.55)',
            color: T.warmWhite,
            fontFamily: F.body,
            fontSize: 15,
            fontWeight: 600,
            cursor: busy ? 'wait' : 'pointer',
            letterSpacing: '0.03em',
            boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(8px)',
            opacity: busy ? 0.7 : 1,
          }}
        >
          I&apos;m ready
        </button>

        <p
          style={{
            fontSize: 11,
            color: T.muted,
            letterSpacing: '0.12em',
            margin: 0,
          }}
        >
          ♪ antiquity
        </p>
      </div>
    </div>
  )
}
