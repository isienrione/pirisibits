import { T, F } from '../tokens.js'
import { PrimaryButton, GoldSeam } from './index.js'
import { Eyebrow } from './Eyebrow.jsx'

/** Standalone audio unlock — Gold Seam flashes when sound wakes. */
export default function RedesignAudioUnlock({ onUnlock, busy = false, unlocked = false }) {
  return (
    <div
      className="cw-grain redesign-app-shell"
      style={{
        minHeight: '100dvh',
        background: T.obsidian,
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 'max(48px, env(safe-area-inset-top) + 24px) 24px max(32px, env(safe-area-inset-bottom) + 24px)',
        position: 'relative',
      }}
    >
      {unlocked ? (
        <div
          style={{
            position: 'absolute',
            top: 'max(64px, calc(env(safe-area-inset-top) + 32px))',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
          aria-hidden
        >
          <GoldSeam moment="audioUnlocked" />
        </div>
      ) : null}
      <Eyebrow color={T.ember}>JOURNEY</Eyebrow>
      <h1
        style={{
          fontFamily: F.display,
          fontSize: 40,
          fontWeight: 300,
          color: T.warmWhite,
          lineHeight: 1.08,
          margin: '12px 0 16px',
        }}
      >
        Ready when you are
      </h1>
      <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.65, marginBottom: 28 }}>
        Tap once to wake the soundscape — narration, ambience, and the city between stops.
      </p>
      <PrimaryButton onClick={onUnlock} disabled={busy}>
        {busy ? 'Starting audio…' : 'Begin sound'}
      </PrimaryButton>
    </div>
  )
}
