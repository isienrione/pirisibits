import { Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { T, F, SHELL_TAB_BAR_INSET } from '../tokens.js'
import { Eyebrow } from '../ui/index.js'

export default function C2Transit({
  accent = T.actI,
  title = 'The Pantheon',
  note = 'The city between stops has its own stories.',
  progressPct = 35,
  extraBottomInset = 0,
  onOpenSettings,
  onContinue,
  continueLabel = 'Continue',
  narrationPlaying = false,
  map,
}) {
  const navigate = useNavigate()

  return (
    <div
      className="cw-grain"
      style={{
        background: T.bone,
        height: '100%',
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 3,
          background: `${T.muted}28`,
          flexShrink: 0,
          position: 'relative',
          zIndex: 4,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
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
          background: T.obsidian,
        }}
      >
        {map}

        <button
          type="button"
          onClick={onOpenSettings ?? (() => navigate('/settings'))}
          aria-label="Settings"
          style={{
            position: 'absolute',
            top: 'max(12px, calc(env(safe-area-inset-top) + 8px))',
            left: 16,
            zIndex: 3,
            background: 'rgba(247,241,230,0.92)',
            border: 'none',
            borderRadius: 20,
            width: 36,
            height: 36,
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: `${T.ink}80`,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Settings size={18} />
        </button>

        <div
          style={{
            position: 'absolute',
            top: 'max(12px, calc(env(safe-area-inset-top) + 8px))',
            right: 16,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(247,241,230,0.92)',
            borderRadius: 20,
            padding: '5px 10px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              background: accent,
              animation: 'presencePulse 2.5s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: 11, color: T.ink, letterSpacing: '0.06em' }}>ON ROUTE</span>
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: '18px 20px 0',
          position: 'relative',
          zIndex: 2,
          background: `linear-gradient(to top, ${T.bone} 88%, transparent)`,
          marginTop: -28,
        }}
      >
        <Eyebrow color={accent}>ON THE ROAD</Eyebrow>
        <h1
          style={{
            fontFamily: F.display,
            fontSize: 28,
            color: T.ink,
            fontWeight: 300,
            lineHeight: 1.12,
            margin: '8px 0 6px',
          }}
        >
          Toward {title}
        </h1>
        <p style={{ fontSize: 14, color: `${T.ink}72`, lineHeight: 1.6, margin: '0 0 4px' }}>
          {note}
        </p>
        <p style={{ fontSize: 12, color: T.muted, letterSpacing: '0.05em', margin: '10px 0 0' }}>
          ♪ Listen while you walk
        </p>
      </div>

      <div
        style={{
          padding: `14px 20px calc(${SHELL_TAB_BAR_INSET} + ${extraBottomInset}px)`,
          flexShrink: 0,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {onContinue ? (
          <button
            type="button"
            onClick={onContinue}
            style={{
              width: '100%',
              background: T.ember,
              border: 'none',
              borderRadius: 12,
              padding: '13px 16px',
              cursor: 'pointer',
              color: T.obsidian,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {continueLabel}
          </button>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: T.muted, fontStyle: 'italic', textAlign: 'center' }}>
            {narrationPlaying ? 'Narration playing — use the player below to pause or skip ahead.' : 'Continue when ready.'}
          </p>
        )}
      </div>
    </div>
  )
}
