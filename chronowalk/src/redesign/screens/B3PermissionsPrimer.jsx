import { MapPin, Navigation } from 'lucide-react'
import { T, F, S, SHELL_SAFE_BOTTOM_INSET } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { Vignette } from '../ui/index.js'
import ChronoWalkLogo from '../ui/ChronoWalkLogo.jsx'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import { GhostButton } from '../ui/GhostButton.jsx'

const BENEFITS = [
  {
    icon: Navigation,
    text: 'Stories unlock when you arrive',
  },
  {
    icon: MapPin,
    text: 'Walking directions stay with you',
  },
]

export default function B3PermissionsPrimer({ onEnable, onSkip, busy = false, paceTitle }) {
  return (
    <div
      style={{
        background: T.obsidian,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: F.body,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${colosseumNow})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          filter: 'brightness(0.28) saturate(0.5)',
        }}
      />
      <Vignette />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: `max(64px, calc(env(safe-area-inset-top) + ${S.l})) ${S.edge} ${SHELL_SAFE_BOTTOM_INSET}`,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: S.xl }}>
          <ChronoWalkLogo size={64} />
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: 340,
            margin: '0 auto',
            width: '100%',
          }}
        >
          <h1
            style={{
              fontFamily: F.display,
              fontSize: 36,
              fontWeight: 300,
              color: T.warmWhite,
              lineHeight: 1.15,
              margin: `0 0 ${S.m}`,
              textAlign: 'center',
            }}
          >
            Turn on location
          </h1>
          <p
            style={{
              fontSize: 15,
              color: T.muted,
              lineHeight: 1.7,
              textAlign: 'center',
              margin: `0 0 ${S.xl}`,
            }}
          >
            Used only while you walk — never when the app is closed.
          </p>

          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: S.l,
            }}
          >
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} style={{ display: 'flex', alignItems: 'center', gap: S.m }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    border: `1px solid ${T.ember}44`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} color={T.ember} strokeWidth={1.8} />
                </span>
                <p style={{ margin: 0, fontSize: 14, color: `${T.warmWhite}cc`, lineHeight: 1.5 }}>{text}</p>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: S.xl }}>
          {paceTitle ? (
            <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', margin: `0 0 ${S.m}` }}>
              {paceTitle}
            </p>
          ) : null}
          <PrimaryButton onClick={onEnable} disabled={busy}>
            {busy ? 'Requesting…' : 'Enable location & begin'}
          </PrimaryButton>
          {onSkip ? (
            <div style={{ marginTop: S.m }}>
              <GhostButton onClick={onSkip} disabled={busy}>
                Continue without location
              </GhostButton>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
