import { Link } from 'react-router-dom'
import OfflineAudioPanel from '../../components/offline/OfflineAudioPanel.jsx'

export function SettingsPage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        padding:
          'max(var(--edge), env(safe-area-inset-top)) var(--edge) max(calc(var(--edge) + 72px), calc(env(safe-area-inset-bottom) + 72px))',
        background: 'var(--bone)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 24 }}>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--fs-caption)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'color-mix(in srgb, var(--ink) 45%, var(--bone))',
          }}
        >
          Settings
        </p>
        <h1
          style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-title)',
            fontWeight: 500,
            color: 'var(--ink)',
          }}
        >
          Tour & device
        </h1>

        <div style={{ marginTop: 28 }}>
          <OfflineAudioPanel />
        </div>

        <Link
          to="/journey"
          style={{
            display: 'inline-block',
            marginTop: 24,
            color: 'color-mix(in srgb, var(--ink) 60%, var(--bone))',
            fontSize: 'var(--fs-secondary)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Back to walk
        </Link>
      </div>
    </main>
  )
}
